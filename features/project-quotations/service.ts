// Service layer: quotation generation, get, list, patch, status, delete

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import { requireUserId } from "@/lib/auth/require-user";
import { ensureProjectsSchema } from "@/lib/db/projects-schema";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import { quotationCreateSchema, quotationPatchSchema, listQuotationsQuerySchema } from "./schema";
import type { QuotationCreateInput, QuotationPatchInput, ListQuotationsQuery } from "./schema";
import type { Quotation, QuotationStatus } from "./types";
import {
  insertQuotation,
  insertQuotationSection,
  insertQuotationLine,
  findQuotationByIdForUser,
  getQuotationWithRelations,
  listQuotationsForProject,
  updateQuotation,
  deleteQuotationRow,
} from "./repo";
import { getBoq } from "@/features/project-boqs/service";
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

// Compute pricing from subtotal + markup/discount/tax
function computeTotals(materialsSubtotal: number, markupPct: number, discountPct: number, taxPct: number) {
  const markupAmount = +(materialsSubtotal * markupPct / 100).toFixed(2);
  const afterMarkup = +(materialsSubtotal + markupAmount).toFixed(2);
  const discountAmount = +(afterMarkup * discountPct / 100).toFixed(2);
  const afterDiscount = +(afterMarkup - discountAmount).toFixed(2);
  const taxAmount = +(afterDiscount * taxPct / 100).toFixed(2);
  const grandTotal = +(afterDiscount + taxAmount).toFixed(2);
  return { markupAmount, discountAmount, taxAmount, grandTotal };
}

export async function generateQuotation(projectId: string, raw: unknown): Promise<Quotation> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = quotationCreateSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_FAILED:" + JSON.stringify(parsed.error.flatten()));

  const input: QuotationCreateInput = parsed.data;

  // Load source BOQ
  let boq;
  try {
    boq = await getBoq(input.boqId);
  } catch {
    throw new Error("BOQ_NOT_FOUND");
  }

  if (boq.projectId !== projectId) throw new Error("BOQ_NOT_FOUND");

  const materialsSubtotal = Number(boq.totals.grandTotal);
  const { markupAmount, discountAmount, taxAmount, grandTotal } = computeTotals(
    materialsSubtotal, input.markupPercentage, input.discountPercentage, input.taxPercentage,
  );

  // Auto-generate quotation number
  const countRes = await getDb().query<{ cnt: string }>(
    `SELECT COUNT(*) as cnt FROM project_quotations WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId],
  );
  const quotationNumber = `Q-${Number(countRes.rows[0]!.cnt) + 1}`;
  const name = input.name ?? `Quotation ${quotationNumber}`;

  const quotationId = await tx(async (client) => {
    const quot = await insertQuotation({
      projectId,
      boqId: input.boqId,
      userId,
      quotationNumber,
      name,
      clientName: input.clientName ?? null,
      clientEmail: input.clientEmail ?? null,
      clientPhone: input.clientPhone ?? null,
      currency: boq.currency,
      validUntil: input.validUntil ?? null,
      materialsSubtotal: materialsSubtotal.toFixed(2),
      markupPercentage: input.markupPercentage,
      markupAmount: markupAmount.toFixed(2),
      discountPercentage: input.discountPercentage,
      discountAmount: discountAmount.toFixed(2),
      taxPercentage: input.taxPercentage,
      taxAmount: taxAmount.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      notes: input.notes ?? null,
      terms: input.terms ?? null,
    }, client);

    // Copy BOQ sections and lines into quotation
    for (let sIdx = 0; sIdx < boq.sections.length; sIdx++) {
      const boqSection = boq.sections[sIdx]!;
      const sec = await insertQuotationSection(quot.id, boqSection.group, sIdx, boqSection.sectionSubtotal, client);

      let lineOrder = 0;
      for (const boqLine of boqSection.lines) {
        // Each BOQ line becomes a quotation line (aggregated from its materials)
        const lineLabel = boqLine.override?.label || boqLine.label;
        const lineAmount = boqLine.override?.amount || boqLine.subtotal;

        await insertQuotationLine({
          quotationId: quot.id,
          sectionId: sec.id,
          label: lineLabel,
          description: boqLine.description,
          quantity: "1",
          unit: "lot",
          unitRate: lineAmount,
          amount: lineAmount,
          lineOrder,
        }, client);
        lineOrder++;
      }
    }

    // Increment project counts
    await client.query(
      `UPDATE projects SET counts_quotations = counts_quotations + 1, updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [projectId, userId],
    );

    await logAudit(client, { projectId, userId, entityType: "quotation", entityId: quot.id, action: "created", summary: `Created quotation ${quotationNumber}` });

    return quot.id;
  });

  return getQuotation(quotationId);
}

export async function getQuotation(id: string): Promise<Quotation> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const data = await getQuotationWithRelations(id, userId);
  if (!data) throw new Error("NOT_FOUND");

  const { quotation: q, sections } = data;

  return {
    id: q.id,
    projectId: q.project_id,
    boqId: q.boq_id,
    quotationNumber: q.quotation_number,
    name: q.name,
    clientName: q.client_name,
    clientEmail: q.client_email,
    clientPhone: q.client_phone,
    currency: q.currency,
    status: q.status as QuotationStatus,
    validUntil: q.valid_until,
    materialsSubtotal: q.materials_subtotal,
    markupPercentage: q.markup_percentage,
    markupAmount: q.markup_amount,
    discountPercentage: q.discount_percentage,
    discountAmount: q.discount_amount,
    taxPercentage: q.tax_percentage,
    taxAmount: q.tax_amount,
    grandTotal: q.grand_total,
    notes: q.notes,
    terms: q.terms,
    sections: sections.map((sec) => ({
      group: sec.group_name,
      lines: sec.lines.map((l) => ({
        id: l.id,
        label: l.label,
        description: l.description,
        quantity: l.quantity,
        unit: l.unit,
        unitRate: l.unit_rate,
        amount: l.amount,
      })),
      sectionSubtotal: sec.section_subtotal,
    })),
    createdAt: q.created_at,
    updatedAt: q.updated_at,
    sentAt: q.sent_at,
  };
}

export interface ListQuotationsResult {
  items: Quotation[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listQuotations(projectId: string, rawQuery: unknown): Promise<ListQuotationsResult> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = listQuotationsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) throw new Error("VALIDATION_FAILED:" + JSON.stringify(parsed.error.flatten()));

  const q: ListQuotationsQuery = parsed.data;

  let cursor = undefined;
  if (q.cursor) {
    cursor = decodeCursor(q.cursor);
    if (!cursor) throw new Error("INVALID_CURSOR");
  }

  const result = await listQuotationsForProject(projectId, userId, q.limit, cursor);

  return {
    items: await Promise.all(result.items.map((r) => getQuotation(r.id))),
    nextCursor: result.nextCursor ? encodeCursor(result.nextCursor) : null,
    hasMore: result.items.length === q.limit,
  };
}

// Valid status transitions
const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ["sent"],
  sent: ["accepted", "rejected", "expired"],
};

export async function updateQuotationStatus(id: string, newStatus: string): Promise<Quotation> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const quot = await findQuotationByIdForUser(id, userId);
  if (!quot) throw new Error("NOT_FOUND");

  const allowed = VALID_TRANSITIONS[quot.status];
  if (!allowed || !allowed.includes(newStatus)) throw new Error("INVALID_STATUS_TRANSITION");

  await tx(async (client) => {
    const patch: Record<string, unknown> = { status: newStatus };
    if (newStatus === "sent") patch.sent_at = new Date().toISOString();
    await updateQuotation(id, userId, patch, client);

    await logAudit(client, { projectId: quot.project_id, userId, entityType: "quotation", entityId: id, action: "status_changed", summary: `Status: ${quot.status} → ${newStatus}`, changes: { from: quot.status, to: newStatus } });
  });

  return getQuotation(id);
}

export async function patchQuotation(id: string, raw: unknown): Promise<Quotation> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = quotationPatchSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_FAILED:" + JSON.stringify(parsed.error.flatten()));

  const input: QuotationPatchInput = parsed.data;

  const quot = await findQuotationByIdForUser(id, userId);
  if (!quot) throw new Error("NOT_FOUND");

  // Build patch object (snake_case for DB)
  const dbPatch: Record<string, unknown> = {};
  if (input.name !== undefined) dbPatch.name = input.name;
  if (input.clientName !== undefined) dbPatch.client_name = input.clientName;
  if (input.clientEmail !== undefined) dbPatch.client_email = input.clientEmail;
  if (input.clientPhone !== undefined) dbPatch.client_phone = input.clientPhone;
  if (input.validUntil !== undefined) dbPatch.valid_until = input.validUntil;
  if (input.notes !== undefined) dbPatch.notes = input.notes;
  if (input.terms !== undefined) dbPatch.terms = input.terms;

  // Recalculate totals if pricing fields changed
  const markupPct = input.markupPercentage ?? Number(quot.markup_percentage);
  const discountPct = input.discountPercentage ?? Number(quot.discount_percentage);
  const taxPct = input.taxPercentage ?? Number(quot.tax_percentage);
  const materialsSubtotal = Number(quot.materials_subtotal);

  if (input.markupPercentage !== undefined || input.discountPercentage !== undefined || input.taxPercentage !== undefined) {
    const { markupAmount, discountAmount, taxAmount, grandTotal } = computeTotals(materialsSubtotal, markupPct, discountPct, taxPct);
    dbPatch.markup_percentage = markupPct;
    dbPatch.markup_amount = markupAmount.toFixed(2);
    dbPatch.discount_percentage = discountPct;
    dbPatch.discount_amount = discountAmount.toFixed(2);
    dbPatch.tax_percentage = taxPct;
    dbPatch.tax_amount = taxAmount.toFixed(2);
    dbPatch.grand_total = grandTotal.toFixed(2);
  }

  if (Object.keys(dbPatch).length === 0) return getQuotation(id);

  await tx(async (client) => {
    await updateQuotation(id, userId, dbPatch, client);

    await logAudit(client, { projectId: quot.project_id, userId, entityType: "quotation", entityId: id, action: "updated", summary: `Updated quotation ${quot.quotation_number}`, changes: input as unknown as Record<string, unknown> });
  });

  return getQuotation(id);
}

export async function deleteQuotation(id: string): Promise<void> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const quot = await findQuotationByIdForUser(id, userId);
  if (!quot) throw new Error("NOT_FOUND");

  await tx(async (client) => {
    const deleted = await deleteQuotationRow(id, userId, client);
    if (!deleted) throw new Error("NOT_FOUND");

    await client.query(
      `UPDATE projects SET counts_quotations = GREATEST(counts_quotations - 1, 0), updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [quot.project_id, userId],
    );

    await logAudit(client, { projectId: quot.project_id, userId, entityType: "quotation", entityId: id, action: "deleted", summary: `Deleted quotation ${quot.quotation_number}` });
  });
}
