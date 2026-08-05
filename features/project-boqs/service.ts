// Service layer: BOQ generation, patch, regenerate logic

import "server-only";
import type { PoolClient } from "pg";
import { getDb } from "@/lib/db";
import { requireUserId } from "@/lib/auth/require-user";
import { ensureProjectsSchema } from "@/lib/db/projects-schema";
import { decodeCursor, encodeCursor } from "@/lib/cursor";
import { boqGenerateSchema, boqPatchSchema, listBoqsQuerySchema, boqSwapBrandSchema } from "./schema";
import type { BoqGenerateInput, BoqPatchInput, ListBoqsQuery, Boq } from ".";
import {
  insertBoq,
  findBoqByIdForUser,
  listBoqsForProject,
  insertBoqSection,
  insertBoqLine,
  insertBoqMaterial,
  insertBoqTotalsCache,
  getBoqWithRelations,
  updateBoqMetadata,
  updateBoqLineOverride,
  updateBoqMaterialRow,
  deleteBoqRow,
} from "./repo";
import { getProject } from "@/features/projects/service";
import { listCalculations } from "@/features/project-calculations/service";
import { extractMaterialSuggestions } from "@/features/project-materials/from-calculation";
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

// Helper: look up material price by (type, brand) or fallback to (type, null brand)
// Suggestions from extractMaterialSuggestions() don't carry brand info (calculators don't know brands),
// so we always pass null and rely on the fallback to find materials by type only.
async function findMaterialPrice(
  projectId: string,
  userId: string,
  materialType: string,
  brand: string | null,
): Promise<string | null> {
  const db = getDb();

  // Try exact match first
  if (brand) {
    const res = await db.query<{ unit_price: string }>(
      `SELECT unit_price FROM project_materials
       WHERE project_id = $1 AND user_id = $2 AND type = $3 AND brand = $4
       LIMIT 1`,
      [projectId, userId, materialType, brand],
    );
    if (res.rows[0]) return res.rows[0].unit_price;
  }

  // Fall back to any material of this type (prefer null brand, then any brand)
  const res = await db.query<{ unit_price: string }>(
    `SELECT unit_price FROM project_materials
     WHERE project_id = $1 AND user_id = $2 AND type = $3
     ORDER BY (brand IS NULL) DESC, created_at DESC
     LIMIT 1`,
    [projectId, userId, materialType],
  );
  return res.rows[0]?.unit_price ?? null;
}

export async function generateBoq(projectId: string, raw: unknown): Promise<Boq> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = boqGenerateSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_FAILED:" + JSON.stringify(parsed.error.flatten()));

  const input: BoqGenerateInput = parsed.data;
  const project = await getProject(projectId);

  // Load project materials (primary source)
  const matRes = await getDb().query<{ id: string; type: string; brand: string | null; unit: string; unit_price: string; quantity: string | null }>(
    `SELECT id, type, brand, unit, unit_price, quantity FROM project_materials WHERE project_id = $1 AND user_id = $2 ORDER BY type, created_at`,
    [projectId, userId],
  );
  const materials = matRes.rows;

  // Optionally load calculations
  let calcLines: { label: string; group: string | null; materials: { type: string; quantity: string; unit: string }[] }[] = [];
  if (input.includeCalculations) {
    const allCalcs = await listCalculations(projectId, { limit: 100 });
    let calcs = allCalcs.items;

    if (input.calculationIds && input.calculationIds.length > 0) {
      const ids = new Set(input.calculationIds);
      calcs = calcs.filter((c) => ids.has(c.id));
    }

    // Deduplicate
    const seen = new Map<string, typeof calcs[0]>();
    for (const c of calcs) {
      const key = `${c.calculator}|${JSON.stringify(c.request)}`;
      if (!seen.has(key)) seen.set(key, c);
    }
    calcs = Array.from(seen.values());

    for (const calc of calcs) {
      const suggestions = extractMaterialSuggestions(calc);
      calcLines.push({
        label: calc.label,
        group: calc.group ?? null,
        materials: suggestions.map((s) => ({ type: s.type, quantity: s.quantity ?? "0", unit: s.unit })),
      });
    }
  }

  // Must have at least materials or calculations
  if (materials.length === 0 && calcLines.length === 0) throw new Error("NO_CALCULATIONS");

  // Build default name
  const name = input.name ?? `BOQ v${Number((await getDb().query(
    `SELECT COUNT(*) as cnt FROM project_boqs WHERE project_id = $1 AND user_id = $2`,
    [projectId, userId],
  )).rows[0]!.cnt) + 1}`;

  const boqId = await tx(async (client) => {
    const boq = await insertBoq(
      {
        projectId,
        userId,
        currency: project.currency,
        name,
        notes: input.notes !== undefined ? input.notes : null,
        orderingJson: null,
        filtersJson: input.includeCalculations ? { includeCalculations: true, calculationIds: input.calculationIds ?? null } : null,
      },
      client,
    );

    let lineNum = 1;
    let materialsSubtotal = "0";
    let unknownPriceCount = 0;
    let sectionOrder = 0;

    // Section 1: Materials (primary)
    if (materials.length > 0) {
      // Group materials by type
      const typeMap = new Map<string, typeof materials>();
      for (const m of materials) {
        if (!typeMap.has(m.type)) typeMap.set(m.type, []);
        typeMap.get(m.type)!.push(m);
      }

      const section = await insertBoqSection(boq.id, "Materials", sectionOrder, client);
      sectionOrder++;
      let sectionSubtotal = "0";

      for (const [, typeMats] of typeMap) {
        for (const mat of typeMats) {
          const lineKey = `l-${lineNum}`;
          lineNum++;

          const label = mat.brand ? `${mat.type} (${mat.brand})` : mat.type;
          const qty = mat.quantity ?? "1";
          const unitPrice = mat.unit_price;
          const amount = (Number(qty) * Number(unitPrice)).toFixed(2);

          // Use a dummy source_calculation_id (materials don't come from calcs)
          const line = await insertBoqLine(boq.id, section.id, lineKey, boq.id, "material", label, lineNum - 1, client);

          await insertBoqMaterial(
            {
              lineId: line.id,
              materialType: mat.type,
              brand: mat.brand,
              quantityValue: qty,
              quantityUnit: mat.unit,
              unitPrice,
              amount,
              priceUnknown: false,
              lineOrder: 0,
            },
            client,
          );

          // Update line subtotal
          await client.query(`UPDATE boq_lines SET line_subtotal = $1::numeric WHERE id = $2`, [amount, line.id]);
          sectionSubtotal = (Number(sectionSubtotal) + Number(amount)).toFixed(2);
        }
      }

      await client.query(`UPDATE boq_sections SET section_subtotal = $1::numeric WHERE id = $2`, [sectionSubtotal, section.id]);
      materialsSubtotal = (Number(materialsSubtotal) + Number(sectionSubtotal)).toFixed(2);
    }

    // Section 2+: Calculations (optional)
    if (calcLines.length > 0) {
      // Group by calc group
      const groupMap = new Map<string | null, typeof calcLines>();
      for (const cl of calcLines) {
        const key = cl.group;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(cl);
      }

      for (const [groupName, lines] of groupMap) {
        const section = await insertBoqSection(boq.id, groupName ?? "Calculations", sectionOrder, client);
        sectionOrder++;
        let sectionSubtotal = "0";

        for (const calcLine of lines) {
          const lineKey = `l-${lineNum}`;
          lineNum++;

          const line = await insertBoqLine(boq.id, section.id, lineKey, boq.id, "calculation", calcLine.label, lineNum - 1, client);
          let lineSubtotal = "0";

          for (let matOrder = 0; matOrder < calcLine.materials.length; matOrder++) {
            const sug = calcLine.materials[matOrder]!;
            const unitPrice = await findMaterialPrice(projectId, userId, sug.type, null) ?? "0";
            const amount = (Number(sug.quantity) * Number(unitPrice)).toFixed(2);
            lineSubtotal = (Number(lineSubtotal) + Number(amount)).toFixed(2);

            await insertBoqMaterial(
              {
                lineId: line.id,
                materialType: sug.type,
                brand: null,
                quantityValue: sug.quantity,
                quantityUnit: sug.unit,
                unitPrice,
                amount,
                priceUnknown: false,
                lineOrder: matOrder,
              },
              client,
            );
          }

          await client.query(`UPDATE boq_lines SET line_subtotal = $1::numeric WHERE id = $2`, [lineSubtotal, line.id]);
          sectionSubtotal = (Number(sectionSubtotal) + Number(lineSubtotal)).toFixed(2);
        }

        await client.query(`UPDATE boq_sections SET section_subtotal = $1::numeric WHERE id = $2`, [sectionSubtotal, section.id]);
        materialsSubtotal = (Number(materialsSubtotal) + Number(sectionSubtotal)).toFixed(2);
      }
    }

    // Insert totals cache
    await insertBoqTotalsCache(boq.id, materialsSubtotal, unknownPriceCount, materialsSubtotal, client);

    // Update project counts
    await client.query(
      `UPDATE projects SET counts_boqs = counts_boqs + 1, updated_at = NOW() WHERE id = $1 AND user_id = $2`,
      [projectId, userId],
    );

    await logAudit(client, { projectId, userId, entityType: "boq", entityId: boq.id, action: "created", summary: `Generated BOQ: ${name}` });

    return boq.id;
  });

  return getBoq(boqId);
}

export async function getBoq(id: string): Promise<Boq> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const data = await getBoqWithRelations(id, userId);
  if (!data) throw new Error("NOT_FOUND");

  const { boq, sections, totals } = data;

  return {
    id: boq.id,
    projectId: boq.project_id,
    name: boq.name,
    notes: boq.notes,
    currency: boq.currency,
    generatedAt: boq.generated_at,
    sections: sections.map((sec) => ({
      group: sec.group_name,
      lines: sec.lines.map((line) => ({
        id: line.id,
        sourceCalculationId: line.source_calculation_id,
        calculator: line.calculator,
        label: line.label,
        description: line.description,
        materials: line.materials.map((m) => ({
          id: m.id,
          type: m.material_type,
          brand: m.brand,
          quantity: { value: m.quantity_value, unit: m.quantity_unit },
          unitPrice: m.unit_price,
          amount: m.amount,
          priceUnknown: m.price_unknown,
        })),
        subtotal: line.override_json && (line.override_json as any).amount
          ? (line.override_json as any).amount
          : line.line_subtotal,
        override: line.override_json as any,
      })),
      sectionSubtotal: sec.section_subtotal,
    })),
    totals: {
      materialsSubtotal: totals.materials_subtotal,
      unknownPriceLineCount: totals.unknown_price_count,
      grandTotal: totals.grand_total,
    },
    createdAt: boq.created_at,
    updatedAt: boq.updated_at,
  };
}

export interface ListBoqsResult {
  items: Boq[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function listBoqs(projectId: string, rawQuery: unknown): Promise<ListBoqsResult> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = listBoqsQuerySchema.safeParse(rawQuery);
  if (!parsed.success) throw new Error("VALIDATION_FAILED:" + JSON.stringify(parsed.error.flatten()));

  const q: ListBoqsQuery = parsed.data;

  let cursor = undefined;
  if (q.cursor) {
    cursor = decodeCursor(q.cursor);
    if (!cursor) throw new Error("INVALID_CURSOR");
  }

  const result = await listBoqsForProject(projectId, userId, q.limit, cursor);

  return {
    items: await Promise.all(result.items.map(async (b) => getBoq(b.id))),
    nextCursor: result.nextCursor ? encodeCursor(result.nextCursor) : null,
    hasMore: result.items.length === q.limit,
  };
}

export async function patchBoq(id: string, raw: unknown): Promise<Boq> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = boqPatchSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_FAILED:" + JSON.stringify(parsed.error.flatten()));

  const input: BoqPatchInput = parsed.data;

  const boq = await findBoqByIdForUser(id, userId);
  if (!boq) throw new Error("NOT_FOUND");

  return tx(async (client) => {
    // Update metadata if provided
    if (input.name || input.notes !== undefined) {
      await updateBoqMetadata(id, userId, { name: input.name, notes: input.notes }, client);
    }

    // Apply line overrides
    if (input.lineOverrides && input.lineOverrides.length > 0) {
      // Load all lines in this BOQ to verify they exist
      const linesRes = await client.query<{ id: string }>(
        `SELECT id FROM boq_lines WHERE boq_id = $1`,
        [id],
      );
      const validLineIds = new Set(linesRes.rows.map((r) => r.id));

      let newMaterialsSubtotal = "0";
      let newGrandTotal = "0";

      for (const override of input.lineOverrides) {
        // Find the line by id or line_key
        const lineRes = await client.query<{ id: string; line_subtotal: string }>(
          `SELECT id, line_subtotal FROM boq_lines WHERE boq_id = $1 AND (id::text = $2 OR line_key = $2)`,
          [id, override.lineId],
        );

        if (!lineRes.rows[0]) throw new Error("LINE_NOT_FOUND");

        const lineId = lineRes.rows[0].id;
        const lineSubtotal = lineRes.rows[0].line_subtotal;

        // Apply override
        await updateBoqLineOverride(lineId, override.override, client);

        // Recompute this line's contribution to the total
        // Use override.amount if present, otherwise use line_subtotal
        const contributionAmount = override.override?.amount ? override.override.amount : lineSubtotal;
        newMaterialsSubtotal = (Number(newMaterialsSubtotal) + Number(contributionAmount)).toFixed(2);
      }

      // Recompute grand total: sum all lines (using override amounts where present)
      const allLinesRes = await client.query<{ line_key: string; line_subtotal: string; override_json: unknown }>(
        `SELECT line_key, line_subtotal, override_json FROM boq_lines WHERE boq_id = $1 ORDER BY line_key`,
        [id],
      );

      newGrandTotal = "0";
      for (const line of allLinesRes.rows) {
        const amt = line.override_json && (line.override_json as any).amount
          ? (line.override_json as any).amount
          : line.line_subtotal;
        newGrandTotal = (Number(newGrandTotal) + Number(amt)).toFixed(2);
      }

      // Update totals cache
      const totalsRes = await client.query<{ unknown_price_count: number }>(
        `SELECT unknown_price_count FROM boq_totals_cache WHERE boq_id = $1`,
        [id],
      );

      await client.query(
        `UPDATE boq_totals_cache SET materials_subtotal = $1::numeric, grand_total = $2::numeric, updated_at = NOW()
         WHERE boq_id = $3`,
        [newGrandTotal, newGrandTotal, id],
      );
    }

    // Update project's updated_at
    await client.query(
      `UPDATE projects SET updated_at = NOW() WHERE id = (SELECT project_id FROM project_boqs WHERE id = $1)`,
      [id],
    );

    await logAudit(client, { projectId: boq.project_id, userId, entityType: "boq", entityId: id, action: "updated", summary: `Updated BOQ: ${input.name ?? boq.name}`, changes: input as unknown as Record<string, unknown> });

    return getBoq(id);
  });
}

export async function regenerateBoq(id: string, raw?: unknown): Promise<Boq> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const boq = await findBoqByIdForUser(id, userId);
  if (!boq) throw new Error("NOT_FOUND");

  // Parse optional overrides
  let input: BoqGenerateInput | undefined;
  if (raw) {
    const parsed = boqGenerateSchema.safeParse(raw);
    if (!parsed.success) throw new Error("VALIDATION_FAILED:" + JSON.stringify(parsed.error.flatten()));
    input = parsed.data;
  }

  const originalFilters = boq.filters_json ? (typeof boq.filters_json === "string" ? JSON.parse(boq.filters_json) : boq.filters_json) as Record<string, unknown> : null;
  const project = await getProject(boq.project_id);

  // Determine if calculations should be included (from original or override)
  const includeCalcs = input?.includeCalculations ?? (originalFilters?.includeCalculations === true);
  const calcIds = input?.calculationIds ?? (originalFilters?.calculationIds as string[] | null) ?? undefined;

  // Load project materials
  const matRes = await getDb().query<{ id: string; type: string; brand: string | null; unit: string; unit_price: string; quantity: string | null }>(
    `SELECT id, type, brand, unit, unit_price, quantity FROM project_materials WHERE project_id = $1 AND user_id = $2 ORDER BY type, created_at`,
    [boq.project_id, userId],
  );
  const materials = matRes.rows;

  // Optionally load calculations
  let calcLines: { label: string; group: string | null; materials: { type: string; quantity: string; unit: string }[] }[] = [];
  if (includeCalcs) {
    const allCalcs = await listCalculations(boq.project_id, { limit: 100 });
    let calcs = allCalcs.items;

    if (calcIds && calcIds.length > 0) {
      const ids = new Set(calcIds);
      calcs = calcs.filter((c) => ids.has(c.id));
    }

    const seen = new Map<string, typeof calcs[0]>();
    for (const c of calcs) {
      const key = `${c.calculator}|${JSON.stringify(c.request)}`;
      if (!seen.has(key)) seen.set(key, c);
    }
    calcs = Array.from(seen.values());

    for (const calc of calcs) {
      const suggestions = extractMaterialSuggestions(calc);
      calcLines.push({
        label: calc.label,
        group: calc.group ?? null,
        materials: suggestions.map((s) => ({ type: s.type, quantity: s.quantity ?? "0", unit: s.unit })),
      });
    }
  }

  if (materials.length === 0 && calcLines.length === 0) throw new Error("NO_CALCULATIONS");

  return tx(async (client) => {
    // Delete existing sections/lines/materials (cascade via FK)
    await client.query(`DELETE FROM boq_sections WHERE boq_id = $1`, [id]);
    await client.query(`DELETE FROM boq_totals_cache WHERE boq_id = $1`, [id]);

    // Update metadata
    await client.query(
      `UPDATE project_boqs SET name = $1, notes = $2, generated_at = NOW(), filters_json = $3::jsonb, updated_at = NOW() WHERE id = $4`,
      [
        input?.name ?? boq.name,
        input?.notes !== undefined ? input.notes : boq.notes,
        includeCalcs ? JSON.stringify({ includeCalculations: true, calculationIds: calcIds ?? null }) : null,
        id,
      ],
    );

    let lineNum = 1;
    let materialsSubtotal = "0";
    let unknownPriceCount = 0;
    let sectionOrder = 0;

    // Section: Materials
    if (materials.length > 0) {
      const typeMap = new Map<string, typeof materials>();
      for (const m of materials) {
        if (!typeMap.has(m.type)) typeMap.set(m.type, []);
        typeMap.get(m.type)!.push(m);
      }

      const section = await insertBoqSection(id, "Materials", sectionOrder, client);
      sectionOrder++;
      let sectionSubtotal = "0";

      for (const [, typeMats] of typeMap) {
        for (const mat of typeMats) {
          const lineKey = `l-${lineNum}`;
          lineNum++;
          const label = mat.brand ? `${mat.type} (${mat.brand})` : mat.type;
          const qty = mat.quantity ?? "1";
          const amount = (Number(qty) * Number(mat.unit_price)).toFixed(2);

          const line = await insertBoqLine(id, section.id, lineKey, id, "material", label, lineNum - 1, client);
          await insertBoqMaterial({ lineId: line.id, materialType: mat.type, brand: mat.brand, quantityValue: qty, quantityUnit: mat.unit, unitPrice: mat.unit_price, amount, priceUnknown: false, lineOrder: 0 }, client);
          await client.query(`UPDATE boq_lines SET line_subtotal = $1::numeric WHERE id = $2`, [amount, line.id]);
          sectionSubtotal = (Number(sectionSubtotal) + Number(amount)).toFixed(2);
        }
      }

      await client.query(`UPDATE boq_sections SET section_subtotal = $1::numeric WHERE id = $2`, [sectionSubtotal, section.id]);
      materialsSubtotal = (Number(materialsSubtotal) + Number(sectionSubtotal)).toFixed(2);
    }

    // Section: Calculations
    if (calcLines.length > 0) {
      const groupMap = new Map<string | null, typeof calcLines>();
      for (const cl of calcLines) {
        if (!groupMap.has(cl.group)) groupMap.set(cl.group, []);
        groupMap.get(cl.group)!.push(cl);
      }

      for (const [groupName, lines] of groupMap) {
        const section = await insertBoqSection(id, groupName ?? "Calculations", sectionOrder, client);
        sectionOrder++;
        let sectionSubtotal = "0";

        for (const calcLine of lines) {
          const lineKey = `l-${lineNum}`;
          lineNum++;
          const line = await insertBoqLine(id, section.id, lineKey, id, "calculation", calcLine.label, lineNum - 1, client);
          let lineSubtotal = "0";

          for (let matOrder = 0; matOrder < calcLine.materials.length; matOrder++) {
            const sug = calcLine.materials[matOrder]!;
            const unitPrice = await findMaterialPrice(boq.project_id, userId, sug.type, null) ?? "0";
            const amount = (Number(sug.quantity) * Number(unitPrice)).toFixed(2);
            lineSubtotal = (Number(lineSubtotal) + Number(amount)).toFixed(2);
            await insertBoqMaterial({ lineId: line.id, materialType: sug.type, brand: null, quantityValue: sug.quantity, quantityUnit: sug.unit, unitPrice, amount, priceUnknown: false, lineOrder: matOrder }, client);
          }

          await client.query(`UPDATE boq_lines SET line_subtotal = $1::numeric WHERE id = $2`, [lineSubtotal, line.id]);
          sectionSubtotal = (Number(sectionSubtotal) + Number(lineSubtotal)).toFixed(2);
        }

        await client.query(`UPDATE boq_sections SET section_subtotal = $1::numeric WHERE id = $2`, [sectionSubtotal, section.id]);
        materialsSubtotal = (Number(materialsSubtotal) + Number(sectionSubtotal)).toFixed(2);
      }
    }

    await insertBoqTotalsCache(id, materialsSubtotal, unknownPriceCount, materialsSubtotal, client);

    await logAudit(client, { projectId: boq.project_id, userId, entityType: "boq", entityId: id, action: "regenerated", summary: `Regenerated BOQ: ${input?.name ?? boq.name}` });

    return getBoq(id);
  });
}

export async function deleteBoq(id: string): Promise<void> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const boq = await findBoqByIdForUser(id, userId);
  if (!boq) throw new Error("NOT_FOUND");

  return tx(async (client) => {
    const deleted = await deleteBoqRow(id, userId, client);
    if (!deleted) throw new Error("NOT_FOUND");

    await client.query(
      `UPDATE projects SET counts_boqs = GREATEST(counts_boqs - 1, 0), updated_at = NOW()
       WHERE id = $1 AND user_id = $2`,
      [boq.project_id, userId],
    );

    await logAudit(client, { projectId: boq.project_id, userId, entityType: "boq", entityId: id, action: "deleted", summary: `Deleted BOQ: ${boq.name}` });
  });
}

export async function swapMaterialBrand(boqId: string, raw: unknown): Promise<Boq> {
  const userId = await requireUserId();
  await ensureProjectsSchema();

  const parsed = boqSwapBrandSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION_FAILED:" + JSON.stringify(parsed.error.flatten()));

  const { materialRowId, newBrand } = parsed.data;

  const boq = await findBoqByIdForUser(boqId, userId);
  if (!boq) throw new Error("NOT_FOUND");

  return tx(async (client) => {
    // Load material row + parent line
    const matRes = await client.query<{ id: string; line_id: string; material_type: string; brand: string | null; quantity_value: string }>(
      `SELECT id, line_id, material_type, brand, quantity_value FROM boq_line_materials WHERE id = $1`,
      [materialRowId],
    );
    const matRow = matRes.rows[0];
    if (!matRow) throw new Error("NOT_FOUND");

    // Verify material belongs to this BOQ
    const lineRes = await client.query<{ id: string; boq_id: string; section_id: string }>(
      `SELECT id, boq_id, section_id FROM boq_lines WHERE id = $1`,
      [matRow.line_id],
    );
    const lineRow = lineRes.rows[0];
    if (!lineRow || lineRow.boq_id !== boqId) throw new Error("NOT_FOUND");

    // Look up new price
    const newPrice = await findMaterialPrice(boq.project_id, userId, matRow.material_type, newBrand) ?? "0";
    const newAmount = (Number(matRow.quantity_value) * Number(newPrice)).toFixed(2);

    // Update material row
    await updateBoqMaterialRow(materialRowId, { brand: newBrand, unitPrice: newPrice, amount: newAmount }, client);

    // Recalculate line subtotal
    const lineMatsRes = await client.query<{ amount: string | null }>(
      `SELECT amount FROM boq_line_materials WHERE line_id = $1`,
      [matRow.line_id],
    );
    const lineSubtotal = lineMatsRes.rows.reduce((sum, r) => sum + Number(r.amount ?? 0), 0).toFixed(2);
    await client.query(`UPDATE boq_lines SET line_subtotal = $1::numeric WHERE id = $2`, [lineSubtotal, matRow.line_id]);

    // Recalculate section subtotal
    const secLinesRes = await client.query<{ line_subtotal: string }>(
      `SELECT line_subtotal FROM boq_lines WHERE section_id = $1`,
      [lineRow.section_id],
    );
    const sectionSubtotal = secLinesRes.rows.reduce((sum, r) => sum + Number(r.line_subtotal), 0).toFixed(2);
    await client.query(`UPDATE boq_sections SET section_subtotal = $1::numeric WHERE id = $2`, [sectionSubtotal, lineRow.section_id]);

    // Recalculate grand total
    const allSectionsRes = await client.query<{ section_subtotal: string }>(
      `SELECT section_subtotal FROM boq_sections WHERE boq_id = $1`,
      [boqId],
    );
    const grandTotal = allSectionsRes.rows.reduce((sum, r) => sum + Number(r.section_subtotal), 0).toFixed(2);
    await client.query(
      `UPDATE boq_totals_cache SET materials_subtotal = $1::numeric, grand_total = $1::numeric, updated_at = NOW() WHERE boq_id = $2`,
      [grandTotal, boqId],
    );

    const oldBrand = matRow.brand ?? "Generic";
    const brandLabel = newBrand ?? "Generic";
    await logAudit(client, { projectId: boq.project_id, userId, entityType: "boq", entityId: boqId, action: "updated", summary: `Swapped brand on ${matRow.material_type}: ${oldBrand} → ${brandLabel}` });

    return getBoq(boqId);
  });
}
