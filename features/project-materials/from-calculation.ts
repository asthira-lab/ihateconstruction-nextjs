// Pure server-side extractor: SavedCalculation → suggested materials.
// Materials store PRICES not quantities, so the quantity here is a UI hint only, never persisted.

import type { SavedCalculation } from "@/features/project-calculations";
import type { MaterialType } from "./schema";
import type { BrickResponse } from "@/features/calculators/brick/types";
import type { ConcreteResponse } from "@/features/calculators/concrete/types";
import type { SteelResponse } from "@/features/calculators/steel/types";
import type { PaintResponse } from "@/features/calculators/paint/types";
import type { TileResponse } from "@/features/calculators/tile/types";

export interface MaterialSuggestion {
  type: MaterialType;
  unit: string;
  // A human-readable qty label like "540 bags" — for the chip preview only.
  quantityLabel: string;
  // Numeric quantity as a decimal string, or null when the source isn't a single number
  // (e.g. multi-layer paint aggregated into one row). Persisted on the material row.
  quantity: string | null;
  // A stable key for dedup lookups against existing project materials.
  key: string; // `${type}:${unit}:${brand ?? ""}`
}

// Materials schema uses "bag" (singular); several calculator outputs say "bags" — normalize here.
function normalizeUnit(u: string): string {
  if (u === "bags") return "bag";
  return u;
}

// Convert an arbitrary decimal-ish string to a canonical non-negative "X.XXX" form the schema accepts.
// Returns null when the input isn't a finite non-negative number.
function toQuantityString(v: unknown): string | null {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n < 0) return null;
  return n.toFixed(3).replace(/\.?0+$/, (m) => (m.startsWith(".") ? "" : m));
}

function suggestion(
  type: MaterialType,
  unit: string,
  quantityLabel: string,
  quantity: string | null,
): MaterialSuggestion {
  const u = normalizeUnit(unit);
  return { type, unit: u, quantityLabel, quantity, key: `${type}:${u}:` };
}

// Extract material candidates from a saved calculation's stored result.
// Returns [] if the result JSON doesn't match the calculator's expected shape (defensive).
export function extractMaterialSuggestions(calc: SavedCalculation): MaterialSuggestion[] {
  try {
    switch (calc.calculator) {
      case "brick":
        return fromBrick(calc.result as unknown as BrickResponse);
      case "concrete":
        return fromConcrete(calc.result as unknown as ConcreteResponse);
      case "steel":
        return fromSteel(calc.result as unknown as SteelResponse);
      case "paint":
        return fromPaint(calc.result as unknown as PaintResponse);
      case "tile":
        return fromTile(calc.result as unknown as TileResponse);
      default:
        return [];
    }
  } catch {
    return [];
  }
}

function fromBrick(r: BrickResponse): MaterialSuggestion[] {
  const items: MaterialSuggestion[] = [];
  const bricks = r.quantities.bricks;
  items.push(suggestion("brick", "piece", `${bricks.value} ${bricks.unit}`, toQuantityString(bricks.value)));
  const cement = r.quantities.mortar.cement;
  items.push(suggestion("cement", cement.unit, `${cement.value} ${cement.unit}`, toQuantityString(cement.value)));
  const sand = r.quantities.mortar.sand;
  items.push(suggestion("sand", sand.unit, `${sand.value} ${sand.unit}`, toQuantityString(sand.value)));
  return items;
}

function fromConcrete(r: ConcreteResponse): MaterialSuggestion[] {
  const items: MaterialSuggestion[] = [];
  const { cement, sand, aggregate } = r.quantities;
  items.push(suggestion("cement", cement.unit, `${cement.value} ${cement.unit}`, toQuantityString(cement.value)));
  items.push(suggestion("sand", sand.unit, `${sand.value} ${sand.unit}`, toQuantityString(sand.value)));
  items.push(suggestion("aggregate", aggregate.unit, `${aggregate.value} ${aggregate.unit}`, toQuantityString(aggregate.value)));
  return items;
}

function fromSteel(r: SteelResponse): MaterialSuggestion[] {
  const w = r.totals.totalWeight;
  return [suggestion("steel", w.unit, `${w.value} ${w.unit}`, toQuantityString(w.value))];
}

function fromPaint(r: PaintResponse): MaterialSuggestion[] {
  // Coalesce identical-typed layers into one suggestion, summing their quantities.
  const acc = new Map<string, { type: MaterialType; unit: string; total: number; layers: number }>();
  for (const l of r.layers) {
    const isPutty = l.type === "putty";
    const q = isPutty ? l.kg : l.litres;
    const n = Number(q.value);
    const type: MaterialType = isPutty ? "putty" : "paint";
    const key = `${type}:${q.unit}`;
    const prev = acc.get(key);
    acc.set(key, {
      type,
      unit: q.unit,
      total: (prev?.total ?? 0) + (Number.isFinite(n) ? n : 0),
      layers: (prev?.layers ?? 0) + 1,
    });
  }
  return Array.from(acc.values()).map((v) => {
    const label = v.layers > 1 ? `${v.total.toFixed(2)} ${v.unit} (${v.layers} layers)` : `${v.total.toFixed(2)} ${v.unit}`;
    return suggestion(v.type, v.unit, label, toQuantityString(v.total));
  });
}

function fromTile(r: TileResponse): MaterialSuggestion[] {
  const items: MaterialSuggestion[] = [];
  items.push(suggestion("tile", "piece", `${r.tile.count} tiles`, toQuantityString(r.tile.count)));
  if (r.adhesive.method === "thin-set") {
    const q = r.adhesive.quantity;
    items.push(suggestion("adhesive", q.unit, `${q.value} ${q.unit}`, toQuantityString(q.value)));
  } else {
    items.push(suggestion("cement", r.adhesive.cement.unit, `${r.adhesive.cement.value} ${r.adhesive.cement.unit}`, toQuantityString(r.adhesive.cement.value)));
    items.push(suggestion("sand", r.adhesive.sand.unit, `${r.adhesive.sand.value} ${r.adhesive.sand.unit}`, toQuantityString(r.adhesive.sand.value)));
  }
  const g = r.grout.estimatedWeight;
  items.push(suggestion("grout", g.unit, `${g.value} ${g.unit}`, toQuantityString(g.value)));
  return items;
}
