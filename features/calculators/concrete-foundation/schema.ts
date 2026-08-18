// Zod schemas for the concrete-foundation calculator API contract.

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

// Foundation is a continuous strip footing: a long run of concrete that
// spreads the wall load onto the soil, optionally topped by a stem wall.
// Footing width and depth are measured on the trench section; the stem wall
// (if any) sits on top and is added when `stemWall.enabled` is true.
export const concreteFoundationRequestSchema = z.object({
  footing: z.object({
    length: lengthQuantitySchema,
    width: lengthQuantitySchema,
    depth: lengthQuantitySchema,
  }),
  stemWall: z.object({
    enabled: z.boolean(),
    height: lengthQuantitySchema,
    thickness: lengthQuantitySchema,
  }),
  // Optional ordering/placing wastage — defaults to 5% server-side when absent.
  wastagePercent: nonNegativeDecimalString.optional(),
});

// Concrete volumes in the units contractors quote in, plus weight, premix
// bags, and ready-mix truck count. Bag yields are premix standard: 80 lb ≈
// 0.6 ft³, 60 lb ≈ 0.45 ft³. Truck size is a standard 7 yd³ mixer.
export const concreteFoundationResponseSchema = z.object({
  input: z.object({
    footing: z.object({
      length: lengthQuantitySchema,
      width: lengthQuantitySchema,
      depth: lengthQuantitySchema,
    }),
    stemWall: z.object({
      enabled: z.boolean(),
      height: lengthQuantitySchema,
      thickness: lengthQuantitySchema,
    }),
  }),
  foundation: z.object({
    footingVolume: z.object({ m3: z.string(), yd3: z.string(), ft3: z.string() }),
    stemWallVolume: z.object({ m3: z.string(), yd3: z.string(), ft3: z.string() }),
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