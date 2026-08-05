// Zod schemas for the steel calculator API contract.

import { z } from "zod";

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
export const volumeUnitSchema = z.enum(["cum", "cft"]);
export const massUnitSchema = z.enum(["kg"]);
// Bars ship with diameter in mm — enforce that literal.
export const barDiameterUnitSchema = z.literal("mm");

export const lengthQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: lengthUnitSchema,
});

export const volumeQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: volumeUnitSchema,
});

export const massQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: massUnitSchema,
});

// Same shape as massQuantitySchema but allows a zero value — used where an amount can legitimately be zero (e.g. 0% wastage).
const nonNegativeMassQuantitySchema = z.object({
  value: nonNegativeDecimalString,
  unit: massUnitSchema,
});

export const barDiameterSchema = z.object({
  value: positiveDecimalString,
  unit: barDiameterUnitSchema,
});

// Members that thumb-rule mode knows about.
export const memberSchema = z.enum([
  "slab",
  "beam",
  "column",
  "footing",
  "staircase",
]);

// Whitelist of weight-per-metre formulas. See formula.ts for the evaluators.
export const weightPerMetreFormulaSchema = z.enum([
  "d^2 / 162",
  "d^2 / 162.28",
]);

// standard.custom accepts these keys; formula strings live in the whitelist above.
export const steelStandardSchema = z.object({
  preset: z.string().min(1).optional(),
  custom: z
    .object({
      steelDensity: massQuantitySchema.optional(),
      wastagePercent: nonNegativeDecimalString.optional(),
      weightPerMetreFormula: weightPerMetreFormulaSchema.optional(),
      thumbRuleKgPerCum: positiveDecimalString.optional(),
    })
    .passthrough()
    .optional(),
});

export const barSchema = z.object({
  label: z.string().optional(),
  diameter: barDiameterSchema,
  length: lengthQuantitySchema,
  count: z.number().int().positive({ message: "Count must be at least 1" }),
});

const barScheduleBodySchema = z.object({
  mode: z.literal("barSchedule"),
  bars: z.array(barSchema).min(1, { message: "Add at least one bar entry" }),
  standard: steelStandardSchema.optional(),
  outputUnits: z
    .object({
      totalWeight: massUnitSchema.optional(),
      perBar: massUnitSchema.optional(),
    })
    .optional(),
});

const thumbRuleBodySchema = z.object({
  mode: z.literal("thumbRule"),
  member: memberSchema,
  concreteVolume: volumeQuantitySchema,
  standard: steelStandardSchema.optional(),
});

export const steelRequestSchema = z.discriminatedUnion("mode", [
  barScheduleBodySchema,
  thumbRuleBodySchema,
]);

// --- response ---

const barResultSchema = z.object({
  label: z.string().optional(),
  diameter: barDiameterSchema,
  length: lengthQuantitySchema,
  count: z.number().int().positive(),
  weightPerMetre: massQuantitySchema,
  totalLength: z.object({ value: z.string(), unit: z.literal("m") }),
  weight: massQuantitySchema,
});

const totalsSchema = z.object({
  weightBeforeWastage: massQuantitySchema,
  wastage: nonNegativeMassQuantitySchema,
  totalWeight: massQuantitySchema,
});

export const steelResponseSchema = z.object({
  input: z.object({
    mode: z.enum(["barSchedule", "thumbRule"]),
    member: memberSchema.optional(),
  }),
  standardUsed: z.object({
    preset: z.string().optional(),
    effectiveParameters: z.object({
      steelDensity: massQuantitySchema.optional(),
      wastagePercent: z.string(),
      weightPerMetreFormula: weightPerMetreFormulaSchema.optional(),
      thumbRuleKgPerCum: z.string().optional(),
    }),
  }),
  bars: z.array(barResultSchema).optional(),
  totals: totalsSchema,
  disclaimer: z.string().optional(),
});
