// Parameterized queries for project invoices. user_id denormalized for ownership filter.

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import type { CursorPayload } from "@/lib/cursor";
import type { InvoiceRow, Invoice, InvoicePatch, ListInvoicesQuery } from "./types";
import { toWireInvoice } from "./types";

type Executor = Pick<PoolClient, "query">;

const COLS = `id, project_id, quotation_id, user_id, invoice_number, name,
  client_name, client_email, client_phone, currency, amount_due, amount_paid,
  due_date, status, payment_notes, notes, created_at, updated_at, paid_at`;

export interface InsertInvoiceInput {
  projectId: string;
  quotationId: string | null;
  userId: string;
  invoiceNumber: string;
  name: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  currency: string;
  amountDue: string;
  dueDate: string | null;
  notes: string | null;
}

export async function insertInvoice(
  input: InsertInvoiceInput,
  client: Executor = getDb(),
): Promise<Invoice> {
  const res = await client.query<InvoiceRow>(
    `INSERT INTO project_invoices
       (project_id, quotation_id, user_id, invoice_number, name, client_name, client_email, client_phone, currency, amount_due, due_date, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING ${COLS}`,
    [
      input.projectId,
      input.quotationId,
      input.userId,
      input.invoiceNumber,
      input.name,
      input.clientName,
      input.clientEmail,
      input.clientPhone,
      input.currency,
      input.amountDue,
      input.dueDate,
      input.notes,
    ],
  );
  const row = res.rows[0];
  if (!row) throw new Error("Insert returned no row.");
  return toWireInvoice(row);
}

export async function findInvoiceByIdForUser(
  id: string,
  userId: string,
  client: Executor = getDb(),
): Promise<Invoice | undefined> {
  const res = await client.query<InvoiceRow>(
    `SELECT ${COLS} FROM project_invoices WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  const row = res.rows[0];
  return row ? toWireInvoice(row) : undefined;
}

export async function listInvoicesForProject(
  projectId: string,
  userId: string,
  q: ListInvoicesQuery,
  cursor: CursorPayload | null,
  client: Executor = getDb(),
): Promise<{ items: Invoice[]; nextCursor: CursorPayload | null; hasMore: boolean }> {
  const conditions: string[] = ["project_id = $1", "user_id = $2"];
  const params: unknown[] = [projectId, userId];

  if (cursor) {
    params.push(cursor.createdAt);
    params.push(cursor.id);
    conditions.push(`(created_at, id) < ($${params.length - 1}::timestamptz, $${params.length}::uuid)`);
  }

  params.push(q.limit + 1);
  const res = await client.query<InvoiceRow>(
    `SELECT ${COLS} FROM project_invoices
     WHERE ${conditions.join(" AND ")}
     ORDER BY created_at DESC, id DESC
     LIMIT $${params.length}`,
    params,
  );

  const rows = res.rows;
  const hasMore = rows.length > q.limit;
  const kept = hasMore ? rows.slice(0, q.limit) : rows;
  const last = kept[kept.length - 1];
  return {
    items: kept.map(toWireInvoice),
    nextCursor: hasMore && last ? { createdAt: last.created_at.toISOString(), id: last.id } : null,
    hasMore,
  };
}

export async function patchInvoiceRow(
  id: string,
  userId: string,
  patch: InvoicePatch,
  client: Executor = getDb(),
): Promise<Invoice | undefined> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const push = (col: string, val: unknown) => {
    params.push(val);
    sets.push(`${col} = $${params.length}`);
  };

  if (patch.name !== undefined) push("name", patch.name);
  if (patch.dueDate !== undefined) push("due_date", patch.dueDate);
  if (patch.notes !== undefined) push("notes", patch.notes);
  if (patch.paymentNotes !== undefined) push("payment_notes", patch.paymentNotes);

  if (!sets.length) return findInvoiceByIdForUser(id, userId, client);

  sets.push("updated_at = NOW()");
  params.push(id);
  params.push(userId);

  const res = await client.query<InvoiceRow>(
    `UPDATE project_invoices SET ${sets.join(", ")}
     WHERE id = $${params.length - 1} AND user_id = $${params.length}
     RETURNING ${COLS}`,
    params,
  );
  const row = res.rows[0];
  return row ? toWireInvoice(row) : undefined;
}

export async function recordPaymentRow(
  id: string,
  userId: string,
  amount: string,
  notes: string | null,
  client: Executor = getDb(),
): Promise<Invoice | undefined> {
  const res = await client.query<InvoiceRow>(
    `UPDATE project_invoices
     SET amount_paid = amount_paid + $3::numeric,
         status = CASE
           WHEN (amount_paid + $3::numeric) >= amount_due THEN 'paid'
           WHEN (amount_paid + $3::numeric) > 0 THEN 'partial'
           ELSE 'unpaid'
         END,
         paid_at = CASE WHEN (amount_paid + $3::numeric) >= amount_due THEN NOW() ELSE paid_at END,
         payment_notes = COALESCE($4, payment_notes),
         updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING ${COLS}`,
    [id, userId, amount, notes],
  );
  const row = res.rows[0];
  return row ? toWireInvoice(row) : undefined;
}

export async function deleteInvoiceRow(
  id: string,
  userId: string,
  client: Executor = getDb(),
): Promise<{ deleted: boolean; projectId?: string }> {
  const res = await client.query<{ project_id: string }>(
    `DELETE FROM project_invoices WHERE id = $1 AND user_id = $2 RETURNING project_id`,
    [id, userId],
  );
  const row = res.rows[0];
  return row ? { deleted: true, projectId: row.project_id } : { deleted: false };
}
