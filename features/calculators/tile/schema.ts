// Zod schemas for the tile calculator wire contract. Client + server share this.

import { z } from "zod";

// Positive-decimal string preserving BigDecimal precision on the wire.
const positiveDecimalString = z
  .string()
  .refine((s) => s.trim().length > 0, { message: "Required" })
  .refine((s) => {
    const n = Number(s);
    return Number.isFinite(n) && n > 0;
  }, { message: "Must be a positive number" });

const nonNegativeDecimalString = z
  .string()
  .refine((s) => s.trim().length > 0, { message: "Required" })
  .refine((s) => {
    const n = Number(s);
    return Number.isFinite(n) && n >= 0;
  }, { message: "Must be zero or a positive number" });

export const lengthUnitSchema = z.enum(["mm", "cm", "m", "ft", "in"]);
export const areaUnitSchema = z.enum(["sqm", "sqft"]);
export const volumeUnitSchema = z.enum(["cum", "cft"]);
export const massUnitSchema = z.enum(["kg", "bags"]);

export const lengthQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: lengthUnitSchema,
});

export const areaQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: areaUnitSchema,
});

export const surfaceTypeSchema = z.enum(["floor", "wall"]);
export const adhesiveMethodSchema = z.enum(["thin-set", "mortar-bed"]);
export const mortarRatioSchema = z
  .string()
  .regex(/^\d+:\d+$/, { message: "Must be in the form a:b (e.g. 1:4)" });

// Optional area excluded from the surface (columns, drains, pipe cutouts).
export const excludeAreaSchema = z.object({
  label: z.string().optional(),
  length: lengthQuantitySchema,
  width: lengthQuantitySchema,
});

// Standard block: preset id + optional per-key overrides.
export const tileStandardSchema = z.object({
  preset: z.string().min(1),
  custom: z
    .object({
      wastagePercent: nonNegativeDecimalString.optional(),
      adhesiveMethod: adhesiveMethodSchema.optional(),
      mortarBedThickness: lengthQuantitySchema.optional(),
      mortarRatio: mortarRatioSchema.optional(),
      thinsetCoverage: areaQuantitySchema.optional(),
      groutWidth: lengthQuantitySchema.optional(),
      groutDepth: lengthQuantitySchema.optional(),
      tileThickness: lengthQuantitySchema.optional(),
    })
    .optional(),
});

// Request body — one shape (surface + tile + optional exclusions + optional standard).
export const tileRequestSchema = z.object({
  surface: z.object({
    type: surfaceTypeSchema,
    length: lengthQuantitySchema,
    width: lengthQuantitySchema,
  }),
  excludeAreas: z.array(excludeAreaSchema).optional().default([]),
  tile: z.object({
    length: lengthQuantitySchema,
    width: lengthQuantitySchema,
  }),
  standard: tileStandardSchema.optional(),
});

// Response envelopes.
const areaOutSchema = z.object({ value: z.string(), unit: z.literal("sqm") });

const effectiveParamsThinSetSchema = z.object({
  wastagePercent: z.string(),
  adhesiveMethod: z.literal("thin-set"),
  thinsetCoverage: areaQuantitySchema,
  groutWidth: lengthQuantitySchema,
  groutDepth: lengthQuantitySchema,
  tileThickness: lengthQuantitySchema,
});

const effectiveParamsMortarBedSchema = z.object({
  wastagePercent: z.string(),
  adhesiveMethod: z.literal("mortar-bed"),
  mortarBedThickness: lengthQuantitySchema,
  mortarRatio: mortarRatioSchema,
  groutWidth: lengthQuantitySchema,
  groutDepth: lengthQuantitySchema,
  tileThickness: lengthQuantitySchema,
});

const thinSetAdhesiveResultSchema = z.object({
  method: z.literal("thin-set"),
  quantity: z.object({ value: z.string(), unit: z.literal("kg") }),
});

const mortarBedAdhesiveResultSchema = z.object({
  method: z.literal("mortar-bed"),
  thickness: lengthQuantitySchema,
  mortarVolume: z.object({ value: z.string(), unit: z.literal("cum") }),
  cement: z.object({ value: z.string(), unit: z.literal("bags") }),
  sand: z.object({ value: z.string(), unit: z.literal("cft") }),
  mortarRatio: mortarRatioSchema,
});

export const tileResponseSchema = z.object({
  input: z.object({ surface: z.object({ type: surfaceTypeSchema }) }),
  standardUsed: z.object({
    preset: z.string(),
    effectiveParameters: z.union([
      effectiveParamsThinSetSchema,
      effectiveParamsMortarBedSchema,
    ]),
  }),
  surface: z.object({
    grossArea: areaOutSchema,
    excludedArea: areaOutSchema,
    netArea: areaOutSchema,
  }),
  tile: z.object({
    size: z.object({ length: lengthQuantitySchema, width: lengthQuantitySchema }),
    areaPerTile: areaOutSchema,
    countBeforeWastage: z.string(),
    wastagePercent: z.string(),
    count: z.string(),
  }),
  adhesive: z.union([thinSetAdhesiveResultSchema, mortarBedAdhesiveResultSchema]),
  grout: z.object({
    volume: z.object({ value: z.string(), unit: z.literal("cum") }),
    estimatedWeight: z.object({ value: z.string(), unit: z.literal("kg") }),
    note: z.string(),
  }),
});
