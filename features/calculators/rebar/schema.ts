// Zod schemas for the rebar calculator API contract.

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
// Bars ship with diameter in mm — enforce that literal.
export const barDiameterUnitSchema = z.literal("mm");

export const lengthQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: lengthUnitSchema,
});

export const barDiameterSchema = z.object({
  value: positiveDecimalString,
  unit: barDiameterUnitSchema,
});

// Members the rebar grid calculator supports.
export const memberSchema = z.enum([
  "slab",
  "footing",
  "wall",
  "foundation",
]);

export const rebarRequestSchema = z.object({
  member: memberSchema,
  length: lengthQuantitySchema,
  width: lengthQuantitySchema,
  // Centre-to-centre spacing between parallel bars (same in both directions).
  spacing: lengthQuantitySchema,
  // Distance from the outermost bar line to the slab edge (each side).
  edgeSpacing: lengthQuantitySchema,
  barDiameter: barDiameterSchema,
  // Single stock length of a rebar you buy from the supplier.
  barLength: lengthQuantitySchema,
  // Optional cutting/ordering wastage — defaults applied server-side when absent.
  wastagePercent: nonNegativeDecimalString.optional(),
});

export const rebarResponseSchema = z.object({
  input: z.object({
    member: memberSchema,
    length: lengthQuantitySchema,
    width: lengthQuantitySchema,
    spacing: lengthQuantitySchema,
    edgeSpacing: lengthQuantitySchema,
  }),
  barDiameter: barDiameterSchema,
  grid: z.object({
    gridLength: z.object({ value: z.string(), unit: z.literal("m") }),
    gridWidth: z.object({ value: z.string(), unit: z.literal("m") }),
  }),
  longitudinal: z.object({
    count: z.number().int().nonnegative(),
    barLength: z.object({ value: z.string(), unit: z.literal("m") }),
  }),
  transverse: z.object({
    count: z.number().int().nonnegative(),
    barLength: z.object({ value: z.string(), unit: z.literal("m") }),
  }),
  totalLength: z.object({ value: z.string(), unit: z.literal("m") }),
  pieces: z.number().int().nonnegative(),
  area: z.object({
    value: z.string(),
    perSqm: z.object({ value: z.string(), unit: z.literal("kg") }),
    perSqft: z.object({ value: z.string(), unit: z.literal("kg") }),
  }),
  totals: z.object({
    weightBeforeWastage: z.object({ value: z.string(), unit: z.literal("kg") }),
    wastage: z.object({ value: z.string(), unit: z.literal("kg") }),
    totalWeight: z.object({ value: z.string(), unit: z.literal("kg") }),
  }),
  standardUsed: z.object({
    wastagePercent: z.string(),
  }),
  disclaimer: z.string().optional(),
});
