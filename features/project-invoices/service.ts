// Server-side orchestration for invoices. Auth + validation + transactional counts.

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import { requireUserId } from "@/lib/auth/require-user";
import { ensureProjectsSchema } from "@/lib/db/projects-schema";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import { invoiceCreateSchema, invoicePatchSchema, recordPaymentSchema, listInvoicesQuerySchema } from "./schema";
import type { Invoice, ListInvoicesQuery } from "./types";
import { insertInvoice, findInvoiceByIdForUser, listInvoicesForProject, patchInvoiceRow, recordPaymentRow, deleteInvoiceRow } from "./repo";
import { logAudit } from "@/features/audit-log/service";

async function tx<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await getDb().connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (e) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw e;
  } finally {
    client.release();
  }
}

export async function generateInvoice(projectId: string, raw: unknown): Promise<Invoice> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = invoiceCreateSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const unknown = flat.formErrors.find((m) => m.toLowerCase().includes("unrecognized"));
    if (unknown) throw new Error("UNKNOWN_FIELD:" + unknown);
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }
  const data = parsed.data;

  return tx(async (client) => {
    // Verify project ownership and lock
    const projRes = await client.query<{ status: string; currency: string; counts_invoices: number }>(
      `SELECT status, currency, counts_invoices FROM projects WHERE id = $1 AND user_id = $2 FOR UPDATE`,
      [projectId, userId],
    );
    const proj = projRes.rows[0];
    if (!proj) throw new Error("NOT_FOUND");

    // Load quotation to copy client info and grand total
    const quotRes = await client.query<{
      id: string;
      client_name: string | null;
      client_email: string | null;
      client_phone: string | null;
      grand_total: string;
      name: string;
    }>(
      `SELECT id, client_name, client_email, client_phone, grand_total, name
       FROM project_quotations WHERE id = $1 AND user_id = $2`,
      [data.quotationId, userId],
    );
    const quot = quotRes.rows[0];
    if (!quot) throw new Error("QUOTATION_NOT_FOUND");

    // Auto invoice number: INV-<next>
    const nextNum = proj.counts_invoices + 1;
    const invoiceNumber = `INV-${nextNum}`;
    const name = data.name ?? `Invoice from ${quot.name}`;

    const created = await insertInvoice(
      {
        projectId,
        quotationId: quot.id,
        userId,
        invoiceNumber,
        name,
        clientName: quot.client_name,
        clientEmail: quot.client_email,
        clientPhone: quot.client_phone,
        currency: proj.currency,
        amountDue: quot.grand_total ?? "0",
        dueDate: data.dueDate ?? null,
        notes: data.notes ?? null,
      },
      client,
    );

    await client.query(
      `UPDATE projects SET counts_invoices = counts_invoices + 1, updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [projectId, userId],
    );

    await logAudit(client, { projectId, userId, entityType: "invoice", entityId: created.id, action: "created", summary: `Created invoice ${invoiceNumber}` });

    return created;
  });
}

export async function getInvoice(id: string): Promise<Invoice> {
  const userId = await requireUserId();
  await ensureProjectsSchema();
  const found = await findInvoiceByIdForUser(id, userId);
  if (!found) throw new Error("NOT_FOUND");
  return found;
}

export interface ListInvoicesResult {
  items: Invoice[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listInvoices(projectId: string, rawQuery: unknown): Promise<ListInvoicesResult> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = listInvoicesQuerySchema.safeParse(rawQuery);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const lim = flat.fieldErrors.limit?.[0];
    if (lim?.toLowerCase().includes("less than or equal") || lim?.toLowerCase().includes("greater than or equal")) {
      throw new Error("INVALID_LIMIT:" + lim);
    }
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }
  const q: ListInvoicesQuery = parsed.data;

  let cursor = null;
  if (q.cursor) {
    cursor = decodeCursor(q.cursor);
    if (!cursor) throw new Error("INVALID_CURSOR:" + q.cursor);
  }

  const result = await listInvoicesForProject(projectId, userId, q, cursor);
  return {
    items: result.items,
    nextCursor: result.nextCursor ? encodeCursor(result.nextCursor) : null,
    hasMore: result.hasMore,
  };
}

export async function patchInvoice(id: string, raw: unknown): Promise<Invoice> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = invoicePatchSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    const unknown = flat.formErrors.find((m) => m.toLowerCase().includes("unrecognized"));
    if (unknown) throw new Error("UNKNOWN_FIELD:" + unknown);
    throw new Error("VALIDATION_FAILED:" + JSON.stringify(flat));
  }

  return tx(async (client) => {
    const updated = await patchInvoiceRow(id, userId, parsed.data, client);
    if (!updated) throw new Error("NOT_FOUND");

    await logAudit(client, { projectId: updated.projectId, userId, entityType: "invoice", entityId: id, action: "updated", summary: `Updated invoice ${updated.invoiceNumber}`, changes: parsed.data as unknown as Record<string, unknown> });

    return updated;
  });
}

export async function recordPayment(id: string, raw: unknown): Promise<Invoice> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = recordPaymentSchema.safeParse(raw);
  if (!parsed.success) {
    const flat = parsed.error.flatten();
    throw new Error("INVALID_PAYMENT:" + JSON.stringify(flat));
  }

  const amount = parseFloat(parsed.data.amount);
  if (amount <= 0) throw new Error("INVALID_PAYMENT:Amount must be greater than zero");

  return tx(async (client) => {
    const updated = await recordPaymentRow(id, userId, parsed.data.amount, parsed.data.notes ?? null, client);
    if (!updated) throw new Error("NOT_FOUND");

    await logAudit(client, { projectId: updated.projectId, userId, entityType: "invoice", entityId: id, action: "payment_recorded", summary: `Payment recorded: ${parsed.data.amount}`, changes: { amount: parsed.data.amount, newAmountPaid: updated.amountPaid, newStatus: updated.status } });

    return updated;
  });
}

export async function deleteInvoice(id: string): Promise<void> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const invoice = await findInvoiceByIdForUser(id, userId);
  if (!invoice) throw new Error("NOT_FOUND");

  await tx(async (client) => {
    const res = await deleteInvoiceRow(id, userId, client);
    if (!res.deleted) throw new Error("NOT_FOUND");
    await client.query(
      `UPDATE projects SET counts_invoices = GREATEST(counts_invoices - 1, 0), updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [res.projectId, userId],
    );

    await logAudit(client, { projectId: res.projectId!, userId, entityType: "invoice", entityId: id, action: "deleted", summary: `Deleted invoice ${invoice.invoiceNumber}` });
  });
}
