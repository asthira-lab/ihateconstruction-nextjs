// Zod schemas for the concrete-footing calculator API contract.

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

// Footing shape drives which dimensions the form uses:
//  - continuous: a wall (strip) footing — length, width, height;
//  - spread: an isolated rectangular pad — length, width, height, quantity;
//  - pier: a circular column/round pad — diameter, height, quantity.
export const footingTypeSchema = z.enum(["continuous", "spread", "pier"]);

export const concreteFootingRequestSchema = z.object({
  footingType: footingTypeSchema,
  length: lengthQuantitySchema,
  width: lengthQuantitySchema,
  height: lengthQuantitySchema,
  diameter: lengthQuantitySchema,
  quantity: positiveDecimalString,
  // Optional ordering/placing wastage — defaults to 5% server-side when absent.
  wastagePercent: nonNegativeDecimalString.optional(),
});

// Volume in the three units contractors quote in, plus weight, premix bags,
// and ready-mix truck count. Bag yields are premix standard: 80 lb ≈ 0.6 ft³,
// 60 lb ≈ 0.45 ft³. Truck size is a standard 7 yd³ mixer.
export const concreteFootingResponseSchema = z.object({
  input: z.object({
    footingType: footingTypeSchema,
    length: lengthQuantitySchema,
    width: lengthQuantitySchema,
    height: lengthQuantitySchema,
    diameter: lengthQuantitySchema,
    quantity: z.string(),
  }),
  footing: z.object({
    unit: z.object({ m3: z.string(), ft3: z.string(), yd3: z.string() }),
  }),
  volume: z.object({
    beforeWastage: z.object({ m3: z.string(), yd3: z.string(), ft3: z.string() }),
    withWastage: z.object({ m3: z.string(), yd3: z.string(), ft3: z.string() }),
  }),
  weight: z.object({ kg: z.string(), tonnes: z.string() }),
  bags: z.object({
    bag80lb: z.number().int().nonnegative(),
    bag60lb: z.number().int().nonnegative(),
  }),
  trucks: z.object({ value: z.string(), unit: z.literal("7 yd³ trucks") }),
  standardUsed: z.object({
    wastagePercent: z.string(),
    densityKgPerM3: z.string(),
    bag80lbM3: z.string(),
    bag60lbM3: z.string(),
    truckYd3: z.string(),
  }),
  disclaimer: z.string().optional(),
});