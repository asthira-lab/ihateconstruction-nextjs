// Zod schemas for the concrete-staircase calculator API contract.

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

export const lengthQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: lengthUnitSchema,
});

// Staircase request: rise (height per step), run (depth per step), width, step count, wastage
export const concreteStaircaseRequestSchema = z.object({
  rise: lengthQuantitySchema,
  run: lengthQuantitySchema,
  width: lengthQuantitySchema,
  stepCount: z.coerce.number().int().positive({ message: "Must be a positive integer" }),
  wastagePercent: nonNegativeDecimalString.optional(),
});

// Response schema with computed volume and material quantities
export const concreteStaircaseResponseSchema = z.object({
  input: z.object({
    rise: lengthQuantitySchema,
    run: lengthQuantitySchema,
    width: lengthQuantitySchema,
    stepCount: z.number().int().positive(),
  }),
  volume: z.object({ value: z.string(), unit: z.literal("m³") }),
  totals: z.object({
    concreteVolume: z.object({ value: z.string(), unit: z.literal("m³") }),
    cementBags25kg: z.object({ value: z.string(), unit: z.literal("bags") }),
    cementBags50kg: z.object({ value: z.string(), unit: z.literal("bags") }),
    sandVolume: z.object({ value: z.string(), unit: z.literal("m³") }),
    aggregateVolume: z.object({ value: z.string(), unit: z.literal("m³") }),
  }),
  standardUsed: z.object({
    wastagePercent: z.string(),
    mixRatio: z.string(),
    cementDensity: z.string(),
    sandDensity: z.string(),
    aggregateDensity: z.string(),
  }),
  disclaimer: z.string().optional(),
});