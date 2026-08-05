/**
 * Zod schemas mirroring the backend API contract for the paint calculator.
 *
 * Source of truth for both:
 *   - client-side form validation (via @hookform/resolvers/zod)
 *   - server-side re-validation inside the Server Action
 *
 * Wire shape matches `POST /api/v1/calculators/paint` in
 * roadmap/api/phase-1-calculators/paint.md. The frontend runs the compute
 * in-process today; the schema still speaks the eventual REST shape so a
 * future backend swap is a one-file change in compute.ts.
 *
 * Two things differ from brick / concrete:
 *   - Areas: paint introduces a new Quantity dimension (`sqm`, `sqft`).
 *   - Per-layer standards: each element of `layers[]` carries its own
 *     `standard` block, not one at the top level.
 */

import { z } from "zod";

// --- primitives ---------------------------------------------------------

/**
 * A stringified positive decimal. Accepts "10", "0.5", "48.6". Rejects
 * empty, negative, non-numeric, and NaN. Uses string on the wire to
 * preserve BigDecimal precision when a backend eventually reads it.
 */
const positiveDecimalString = z
  .string()
  .refine((s) => s.trim().length > 0, { message: "Required" })
  .refine(
    (s) => {
      const n = Number(s);
      return Number.isFinite(n) && n > 0;
    },
    { message: "Must be a positive number" },
  );

const nonNegativeDecimalString = z
  .string()
  .refine((s) => s.trim().length > 0, { message: "Required" })
  .refine(
    (s) => {
      const n = Number(s);
      return Number.isFinite(n) && n >= 0;
    },
    { message: "Must be zero or a positive number" },
  );

export const lengthUnitSchema = z.enum(["mm", "cm", "m", "ft", "in"]);
export const areaUnitSchema = z.enum(["sqm", "sqft"]);
// Paint volume is always litres today. Kept as a schema for symmetry with
// the other calculators' quantity envelopes.
export const paintVolumeUnitSchema = z.enum(["litre"]);
// Putty is quoted per kilogram — contractors order it by weight, not volume.
export const paintMassUnitSchema = z.enum(["kg"]);

export const lengthQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: lengthUnitSchema,
});

export const areaQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: areaUnitSchema,
});

export const paintVolumeQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: paintVolumeUnitSchema,
});

// Same shapes but allow "0" — used for totals that can legitimately be zero
// (e.g. no putty layer → totalPuttyKg = 0; putty-only run → totalLitres = 0).
const nonNegativePaintVolumeQuantitySchema = z.object({
  value: nonNegativeDecimalString,
  unit: paintVolumeUnitSchema,
});

export const paintMassQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: paintMassUnitSchema,
});

const nonNegativePaintMassQuantitySchema = z.object({
  value: nonNegativeDecimalString,
  unit: paintMassUnitSchema,
});

// --- layer standard (per-layer override) --------------------------------

/**
 * Layer types the calculator recognises. Distinct products in a paint job:
 *   - putty: wall filler applied first to level the surface
 *   - primer: sealer that goes on top of putty (or raw wall)
 *   - sealer: alternative surface prep on porous substrates
 *   - finish: the visible top coat
 *
 * The order in a real job is usually putty → primer → finish; the calculator
 * doesn't enforce order, it just quotes litres per layer the user configures.
 */
export const layerTypeSchema = z.enum(["primer", "finish", "putty", "sealer"]);

/**
 * Per-layer standard override. Each layer in `layers[]` has its own — one
 * request may quote primer at 10 sqm/L and finish at 12 sqm/L on the same
 * surface.
 */
export const layerStandardSchema = z.object({
  preset: z.string().min(1),
  custom: z
    .object({
      // Applies to primer / finish / sealer layers.
      coveragePerLitre: areaQuantitySchema.optional(),
      // Applies to putty layers only — kilograms of putty per square metre per coat.
      kgPerSqm: positiveDecimalString.optional(),
      wastagePercent: nonNegativeDecimalString.optional(),
    })
    .passthrough()
    .optional(),
});

export const layerSchema = z.object({
  type: layerTypeSchema,
  coats: z
    .number()
    .int()
    .positive({ message: "Coats must be at least 1" }),
  standard: layerStandardSchema.optional(),
});

// --- openings ------------------------------------------------------------

export const openingSchema = z.object({
  label: z.string().optional(),
  width: lengthQuantitySchema,
  height: lengthQuantitySchema,
});

// --- request -------------------------------------------------------------

const roomBodySchema = z.object({
  mode: z.literal("room"),
  room: z.object({
    length: lengthQuantitySchema,
    width: lengthQuantitySchema,
    height: lengthQuantitySchema,
    // Default false — most Indian jobs paint walls only unless requested.
    includeCeiling: z.boolean().optional().default(false),
  }),
  openings: z.array(openingSchema).optional().default([]),
  layers: z.array(layerSchema).min(1, { message: "Add at least one layer" }),
});

const areaBodySchema = z.object({
  mode: z.literal("area"),
  area: areaQuantitySchema,
  layers: z.array(layerSchema).min(1, { message: "Add at least one layer" }),
});

/**
 * Discriminated union on `mode`. Zod produces clean error paths when the
 * wrong shape shows up and TypeScript narrows downstream.
 */
export const paintRequestSchema = z.discriminatedUnion("mode", [
  roomBodySchema,
  areaBodySchema,
]);

// --- response ------------------------------------------------------------

const surfaceSchema = z.object({
  wallGrossArea: z.object({ value: z.string(), unit: z.literal("sqm") }),
  ceilingArea: z.object({ value: z.string(), unit: z.literal("sqm") }),
  openingsArea: z.object({ value: z.string(), unit: z.literal("sqm") }),
  netArea: z.object({ value: z.string(), unit: z.literal("sqm") }),
});

const paintLayerResultSchema = z.object({
  type: z.enum(["primer", "finish", "sealer"]),
  coats: z.number().int().positive(),
  standardUsed: z.object({
    preset: z.string(),
    effectiveParameters: z.object({
      coveragePerLitre: areaQuantitySchema,
      wastagePercent: z.string(),
    }),
  }),
  areaCovered: z.object({ value: z.string(), unit: z.literal("sqm") }),
  litresBeforeWastage: paintVolumeQuantitySchema,
  litres: paintVolumeQuantitySchema,
});

const puttyLayerResultSchema = z.object({
  type: z.literal("putty"),
  coats: z.number().int().positive(),
  standardUsed: z.object({
    preset: z.string(),
    effectiveParameters: z.object({
      kgPerSqm: z.string(),
      wastagePercent: z.string(),
    }),
  }),
  areaCovered: z.object({ value: z.string(), unit: z.literal("sqm") }),
  kgBeforeWastage: paintMassQuantitySchema,
  kg: paintMassQuantitySchema,
});

const layerResultSchema = z.discriminatedUnion("type", [
  paintLayerResultSchema.extend({ type: z.literal("primer") }),
  paintLayerResultSchema.extend({ type: z.literal("finish") }),
  paintLayerResultSchema.extend({ type: z.literal("sealer") }),
  puttyLayerResultSchema,
]);

export const paintResponseSchema = z.object({
  input: z.object({ mode: z.enum(["room", "area"]) }),
  // Present in room mode only; omitted in area mode.
  surface: surfaceSchema.optional(),
  layers: z.array(layerResultSchema),
  totals: z.object({
    totalLitres: nonNegativePaintVolumeQuantitySchema,
    totalPuttyKg: nonNegativePaintMassQuantitySchema,
  }),
});
