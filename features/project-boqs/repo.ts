// Database layer for BOQ operations

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import type {
  BoqRow,
  BoqSectionRow,
  BoqLineRow,
  BoqLineMaterialRow,
  BoqTotalsCacheRow,
} from "./types";

export interface InsertBoqInput {
  projectId: string;
  userId: string;
  currency: string;
  name: string;
  notes: string | null;
  orderingJson: unknown | null;
  filtersJson: unknown | null;
}

export async function insertBoq(input: InsertBoqInput, client?: PoolClient): Promise<BoqRow> {
  const db = client || getDb();
  const res = await db.query<BoqRow>(
    `INSERT INTO project_boqs (project_id, user_id, name, notes, currency, ordering_json, filters_json)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      input.projectId,
      input.userId,
      input.name,
      input.notes,
      input.currency,
      input.orderingJson ? JSON.stringify(input.orderingJson) : null,
      input.filtersJson ? JSON.stringify(input.filtersJson) : null,
    ],
  );
  return res.rows[0]!;
}

export async function findBoqByIdForUser(id: string, userId: string): Promise<BoqRow | undefined> {
  const res = await getDb().query<BoqRow>(
    `SELECT * FROM project_boqs WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return res.rows[0];
}

export async function listBoqsForProject(
  projectId: string,
  userId: string,
  limit: number,
  cursor?: { createdAt: string; id: string },
): Promise<{ items: BoqRow[]; nextCursor: { createdAt: string; id: string } | null }> {
  let query = `SELECT * FROM project_boqs WHERE project_id = $1 AND user_id = $2`;
  const params: unknown[] = [projectId, userId];

  if (cursor) {
    query += ` AND (created_at, id) < ($3::timestamptz, $4::uuid)`;
    params.push(cursor.createdAt, cursor.id);
  }

  query += ` ORDER BY created_at DESC, id DESC LIMIT $${params.length + 1}`;
  params.push(limit + 1);

  const res = await getDb().query<BoqRow>(query, params);
  const items = res.rows.slice(0, limit);
  const hasMore = res.rows.length > limit;

  return {
    items,
    nextCursor: hasMore ? { createdAt: res.rows[limit]!.created_at, id: res.rows[limit]!.id } : null,
  };
}

export async function insertBoqSection(
  boqId: string,
  groupName: string | null,
  sectionOrder: number,
  client: PoolClient,
): Promise<BoqSectionRow> {
  const res = await client.query<BoqSectionRow>(
    `INSERT INTO boq_sections (boq_id, group_name, section_order, section_subtotal)
     VALUES ($1, $2, $3, 0)
     RETURNING *`,
    [boqId, groupName, sectionOrder],
  );
  return res.rows[0]!;
}

export async function insertBoqLine(
  boqId: string,
  sectionId: string,
  lineKey: string,
  sourceCalcId: string,
  calculator: string,
  label: string,
  lineOrder: number,
  client: PoolClient,
): Promise<BoqLineRow> {
  const res = await client.query<BoqLineRow>(
    `INSERT INTO boq_lines (boq_id, section_id, line_key, source_calculation_id, calculator, label, line_order, line_subtotal)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 0)
     RETURNING *`,
    [boqId, sectionId, lineKey, sourceCalcId, calculator, label, lineOrder],
  );
  return res.rows[0]!;
}

export interface InsertBoqMaterialInput {
  lineId: string;
  materialType: string;
  brand: string | null;
  quantityValue: string;
  quantityUnit: string;
  unitPrice: string | null;
  amount: string | null;
  priceUnknown: boolean;
  lineOrder: number;
}

export async function insertBoqMaterial(input: InsertBoqMaterialInput, client: PoolClient): Promise<BoqLineMaterialRow> {
  const res = await client.query<BoqLineMaterialRow>(
    `INSERT INTO boq_line_materials (line_id, material_type, brand, quantity_value, quantity_unit, unit_price, amount, price_unknown, line_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      input.lineId,
      input.materialType,
      input.brand,
      input.quantityValue,
      input.quantityUnit,
      input.unitPrice,
      input.amount,
      input.priceUnknown,
      input.lineOrder,
    ],
  );
  return res.rows[0]!;
}

export async function insertBoqTotalsCache(
  boqId: string,
  materialsSubtotal: string,
  unknownPriceCount: number,
  grandTotal: string,
  client: PoolClient,
): Promise<BoqTotalsCacheRow> {
  const res = await client.query<BoqTotalsCacheRow>(
    `INSERT INTO boq_totals_cache (boq_id, materials_subtotal, unknown_price_count, grand_total)
     VALUES ($1, $2, $3, $4)
     RETURNING *`,
    [boqId, materialsSubtotal, unknownPriceCount, grandTotal],
  );
  return res.rows[0]!;
}

export async function getBoqWithRelations(id: string, userId: string): Promise<{
  boq: BoqRow;
  sections: Array<BoqSectionRow & { lines: Array<BoqLineRow & { materials: BoqLineMaterialRow[] }> }>;
  totals: BoqTotalsCacheRow;
} | null> {
  const boqRes = await getDb().query<BoqRow>(
    `SELECT * FROM project_boqs WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  if (!boqRes.rows[0]) return null;

  const boq = boqRes.rows[0];

  const sectionsRes = await getDb().query<BoqSectionRow>(
    `SELECT * FROM boq_sections WHERE boq_id = $1 ORDER BY section_order ASC`,
    [id],
  );

  const sections = await Promise.all(
    sectionsRes.rows.map(async (section) => {
      const linesRes = await getDb().query<BoqLineRow>(
        `SELECT * FROM boq_lines WHERE section_id = $1 ORDER BY line_order ASC`,
        [section.id],
      );

      const lines = await Promise.all(
        linesRes.rows.map(async (line) => {
          const materialsRes = await getDb().query<BoqLineMaterialRow>(
            `SELECT * FROM boq_line_materials WHERE line_id = $1 ORDER BY line_order ASC`,
            [line.id],
          );
          return { ...line, materials: materialsRes.rows };
        }),
      );

      return { ...section, lines };
    }),
  );

  const totalsRes = await getDb().query<BoqTotalsCacheRow>(
    `SELECT * FROM boq_totals_cache WHERE boq_id = $1`,
    [id],
  );

  if (!totalsRes.rows[0]) return null;

  return {
    boq,
    sections,
    totals: totalsRes.rows[0],
  };
}

export async function updateBoqMetadata(
  id: string,
  userId: string,
  patch: { name?: string; notes?: string | null },
  client: PoolClient,
): Promise<BoqRow | undefined> {
  const updates: string[] = [];
  const params: unknown[] = [id, userId];
  let paramIndex = 3;

  if (patch.name !== undefined) {
    updates.push(`name = $${paramIndex}`);
    params.push(patch.name);
    paramIndex++;
  }
  if (patch.notes !== undefined) {
    updates.push(`notes = $${paramIndex}`);
    params.push(patch.notes);
    paramIndex++;
  }

  if (updates.length === 0) return undefined;

  updates.push(`updated_at = NOW()`);
  const query = `UPDATE project_boqs SET ${updates.join(", ")} WHERE id = $1 AND user_id = $2 RETURNING *`;

  const res = await client.query<BoqRow>(query, params);
  return res.rows[0];
}

export async function updateBoqLineOverride(
  lineId: string,
  override: { label?: string; amount?: string; reason?: string } | null,
  client: PoolClient,
): Promise<void> {
  await client.query(
    `UPDATE boq_lines SET override_json = $1::jsonb WHERE id = $2`,
    [override ? JSON.stringify(override) : null, lineId],
  );
}

export async function updateBoqLineSubtotal(lineId: string, subtotal: string, client: PoolClient): Promise<void> {
  await client.query(
    `UPDATE boq_lines SET line_subtotal = $1::numeric WHERE id = $2`,
    [subtotal, lineId],
  );
}

export async function updateBoqSectionSubtotal(
  sectionId: string,
  subtotal: string,
  client: PoolClient,
): Promise<void> {
  await client.query(
    `UPDATE boq_sections SET section_subtotal = $1::numeric WHERE id = $2`,
    [subtotal, sectionId],
  );
}

export async function deleteBoqRow(id: string, userId: string, client: PoolClient): Promise<boolean> {
  const res = await client.query(
    `DELETE FROM project_boqs WHERE id = $1 AND user_id = $2 RETURNING id`,
    [id, userId],
  );
  return res.rowCount! > 0;
}

export async function updateBoqMaterialRow(
  materialId: string,
  patch: { brand: string | null; unitPrice: string | null; amount: string | null },
  client: PoolClient,
): Promise<BoqLineMaterialRow | undefined> {
  const res = await client.query<BoqLineMaterialRow>(
    `UPDATE boq_line_materials SET brand = $1, unit_price = $2, amount = $3 WHERE id = $4 RETURNING *`,
    [patch.brand, patch.unitPrice, patch.amount, materialId],
  );
  return res.rows[0];
}
