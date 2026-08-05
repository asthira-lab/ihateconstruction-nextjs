/**
 * Zod schemas for the concrete calculator's API contract.
 *
 * Mirrors the backend's `POST /api/v1/calculators/concrete` shape. Used both
 * as client-side form validation input and as the boundary check inside the
 * Server Action — Server Actions are POSTable outside the UI, so validation
 * has to live server-side too.
 *
 * The `Quantity` wire shape carries string-encoded decimals to preserve
 * BigDecimal precision on the way to and from the Java backend.
 */

import { z } from "zod";

// --- primitives ---------------------------------------------------------

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

// Volume units are the same enum the brick calculator uses; kept independent
// here so the concrete feature isn't coupled to brick's file layout. If a
// third calculator needs the same enum we'll promote to a shared file.
export const volumeUnitSchema = z.enum(["cum", "cft"]);

export const volumeQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: volumeUnitSchema,
});

// Output unit selectors. Each accepts a small enum of options aligned with
// how Indian contractors quote material. Defaults are enforced by the form.
export const cementOutputUnitSchema = z.enum(["bags", "kg"]);
export const sandOutputUnitSchema = z.enum(["cft", "cum", "kg"]);
export const aggregateOutputUnitSchema = z.enum(["cft", "cum", "kg"]);

// Mass quantity used inside `standard.custom` for cement density + bag
// weight. Server accepts kg only for both today — validating this narrowly
// prevents users typing "g" or "t" and getting garbage numbers back.
export const massUnitSchema = z.enum(["kg"]);
export const massQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: massUnitSchema,
});

// --- request ------------------------------------------------------------

/**
 * Mix ratio pattern: `a:b:c` with numeric parts (integers or decimals).
 * Rejects `1:1.5` (two parts, that's a brick ratio) and `1:2:3:4` (four).
 * Every part must be > 0 — a zero part would divide by zero downstream.
 */
const MIX_RATIO_PATTERN = /^\d+(\.\d+)?:\d+(\.\d+)?:\d+(\.\d+)?$/;

const mixRatioSchema = z
  .string()
  .regex(MIX_RATIO_PATTERN, {
    message: 'Format "a:b:c" e.g. "1:1.5:3"',
  })
  .refine(
    (s) => s.split(":").every((p) => Number(p) > 0),
    { message: "Every part of the ratio must be greater than 0" },
  );

// wastagePercent must be in the 0–50 range per the spec. Anything outside is
// almost certainly a typo — 60% wastage yields nonsense material orders.
const wastagePercentSchema = nonNegativeDecimalString.refine(
  (s) => {
    const n = Number(s);
    return n <= 50;
  },
  { message: "Wastage must be between 0 and 50%" },
);

export const concreteStandardSchema = z.object({
  preset: z.string().min(1),
  custom: z
    .object({
      mixRatio: mixRatioSchema.optional(),
      wastagePercent: wastagePercentSchema.optional(),
      cementDensity: massQuantitySchema.optional(),
      cementBagWeight: massQuantitySchema.optional(),
      dryToWetFactor: positiveDecimalString.optional(),
    })
    .passthrough()
    .optional(),
});

export const concreteOutputUnitsSchema = z
  .object({
    cement: cementOutputUnitSchema.optional(),
    sand: sandOutputUnitSchema.optional(),
    aggregate: aggregateOutputUnitSchema.optional(),
  })
  .optional();

export const concreteRequestSchema = z.object({
  volume: volumeQuantitySchema,
  standard: concreteStandardSchema.optional(),
  outputUnits: concreteOutputUnitsSchema,
});

// --- response -----------------------------------------------------------

const cementResultSchema = z.object({
  value: z.string(),
  unit: cementOutputUnitSchema,
  inSI: massQuantitySchema, // canonical kg regardless of chosen output unit
});

const aggregateResultSchema = z.object({
  value: z.string(),
  unit: aggregateOutputUnitSchema,
  inSI: volumeQuantitySchema, // canonical cum
});

const sandResultSchema = z.object({
  value: z.string(),
  unit: sandOutputUnitSchema,
  inSI: volumeQuantitySchema,
});

export const concreteResponseSchema = z.object({
  input: z.object({
    volume: volumeQuantitySchema,
  }),
  standardUsed: z.object({
    preset: z.string(),
    effectiveParameters: z.object({
      mixRatio: z.string(),
      wastagePercent: z.string(),
      cementDensity: massQuantitySchema,
      cementBagWeight: massQuantitySchema,
      dryToWetFactor: z.string(),
    }),
  }),
  quantities: z.object({
    cement: cementResultSchema,
    sand: sandResultSchema,
    aggregate: aggregateResultSchema,
  }),
  breakdown: z.object({
    dryVolume: volumeQuantitySchema,
    wastageApplied: z.object({
      value: z.string(),
      unit: z.literal("%"),
    }),
    notes: z.string().optional(),
  }),
});
