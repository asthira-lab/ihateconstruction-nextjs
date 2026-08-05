// Quotation repository — parameterized queries with optional PoolClient for transaction support

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import type { QuotationRow, QuotationSectionRow, QuotationLineRow } from "./types";

interface InsertQuotationInput {
  projectId: string;
  boqId: string;
  userId: string;
  quotationNumber: string;
  name: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  currency: string;
  validUntil: string | null;
  materialsSubtotal: string;
  markupPercentage: number;
  markupAmount: string;
  discountPercentage: number;
  discountAmount: string;
  taxPercentage: number;
  taxAmount: string;
  grandTotal: string;
  notes: string | null;
  terms: string | null;
}

export async function insertQuotation(input: InsertQuotationInput, client: PoolClient): Promise<QuotationRow> {
  const res = await client.query<QuotationRow>(
    `INSERT INTO project_quotations (project_id, boq_id, user_id, quotation_number, name, client_name, client_email, client_phone, currency, valid_until, materials_subtotal, markup_percentage, markup_amount, discount_percentage, discount_amount, tax_percentage, tax_amount, grand_total, notes, terms)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
     RETURNING *`,
    [input.projectId, input.boqId, input.userId, input.quotationNumber, input.name, input.clientName, input.clientEmail, input.clientPhone, input.currency, input.validUntil, input.materialsSubtotal, input.markupPercentage, input.markupAmount, input.discountPercentage, input.discountAmount, input.taxPercentage, input.taxAmount, input.grandTotal, input.notes, input.terms],
  );
  return res.rows[0]!;
}

export async function insertQuotationSection(quotationId: string, groupName: string | null, sectionOrder: number, sectionSubtotal: string, client: PoolClient): Promise<QuotationSectionRow> {
  const res = await client.query<QuotationSectionRow>(
    `INSERT INTO quotation_sections (quotation_id, group_name, section_order, section_subtotal)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [quotationId, groupName, sectionOrder, sectionSubtotal],
  );
  return res.rows[0]!;
}

export async function insertQuotationLine(input: { quotationId: string; sectionId: string; label: string; description: string | null; quantity: string; unit: string | null; unitRate: string; amount: string; lineOrder: number }, client: PoolClient): Promise<QuotationLineRow> {
  const res = await client.query<QuotationLineRow>(
    `INSERT INTO quotation_lines (quotation_id, section_id, label, description, quantity, unit, unit_rate, amount, line_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [input.quotationId, input.sectionId, input.label, input.description, input.quantity, input.unit, input.unitRate, input.amount, input.lineOrder],
  );
  return res.rows[0]!;
}

export async function findQuotationByIdForUser(id: string, userId: string): Promise<QuotationRow | undefined> {
  const res = await getDb().query<QuotationRow>(
    `SELECT * FROM project_quotations WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return res.rows[0];
}

export async function getQuotationWithRelations(id: string, userId: string): Promise<{ quotation: QuotationRow; sections: (QuotationSectionRow & { lines: QuotationLineRow[] })[] } | undefined> {
  const db = getDb();
  const qRes = await db.query<QuotationRow>(
    `SELECT * FROM project_quotations WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  if (!qRes.rows[0]) return undefined;
  const quotation = qRes.rows[0];

  const secRes = await db.query<QuotationSectionRow>(
    `SELECT * FROM quotation_sections WHERE quotation_id = $1 ORDER BY section_order`,
    [id],
  );

  const lineRes = await db.query<QuotationLineRow>(
    `SELECT * FROM quotation_lines WHERE quotation_id = $1 ORDER BY line_order`,
    [id],
  );

  const linesBySection = new Map<string, QuotationLineRow[]>();
  for (const line of lineRes.rows) {
    if (!linesBySection.has(line.section_id)) linesBySection.set(line.section_id, []);
    linesBySection.get(line.section_id)!.push(line);
  }

  const sections = secRes.rows.map((sec) => ({
    ...sec,
    lines: linesBySection.get(sec.id) ?? [],
  }));

  return { quotation, sections };
}

export async function listQuotationsForProject(
  projectId: string,
  userId: string,
  limit: number,
  cursor?: { createdAt: string; id: string },
): Promise<{ items: QuotationRow[]; nextCursor: { createdAt: string; id: string } | null }> {
  let query = `SELECT * FROM project_quotations WHERE project_id = $1 AND user_id = $2`;
  const params: unknown[] = [projectId, userId];

  if (cursor) {
    query += ` AND (created_at, id) < ($3::timestamptz, $4::uuid)`;
    params.push(cursor.createdAt, cursor.id);
  }

  query += ` ORDER BY created_at DESC, id DESC LIMIT $${params.length + 1}`;
  params.push(limit + 1);

  const res = await getDb().query<QuotationRow>(query, params);
  const items = res.rows.slice(0, limit);
  const hasMore = res.rows.length > limit;

  return {
    items,
    nextCursor: hasMore ? { createdAt: items[items.length - 1]!.created_at, id: items[items.length - 1]!.id } : null,
  };
}

export async function updateQuotation(id: string, userId: string, patch: Record<string, unknown>, client: PoolClient): Promise<QuotationRow | undefined> {
  const updates: string[] = [];
  const params: unknown[] = [id, userId];
  let idx = 3;

  for (const [key, val] of Object.entries(patch)) {
    if (val === undefined) continue;
    updates.push(`${key} = $${idx}`);
    params.push(val);
    idx++;
  }

  if (updates.length === 0) return undefined;
  updates.push(`updated_at = NOW()`);

  const res = await client.query<QuotationRow>(
    `UPDATE project_quotations SET ${updates.join(", ")} WHERE id = $1 AND user_id = $2 RETURNING *`,
    params,
  );
  return res.rows[0];
}

export async function deleteQuotationRow(id: string, userId: string, client: PoolClient): Promise<boolean> {
  const res = await client.query(
    `DELETE FROM project_quotations WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return (res.rowCount ?? 0) > 0;
}
