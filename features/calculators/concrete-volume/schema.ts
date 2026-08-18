// Zod schemas for the concrete-volume calculator API contract.

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

// Shape of the pour: rectangular slab/footing or a cylindrical post hole.
export const shapeSchema = z.enum(["rect", "cylinder"]);

export const concreteVolumeRequestSchema = z.object({
  shape: shapeSchema,
  length: lengthQuantitySchema,
  width: lengthQuantitySchema,
  thickness: lengthQuantitySchema,
  diameter: lengthQuantitySchema,
  wastagePercent: nonNegativeDecimalString,
});

// Volume results in the three units contractors quote in. Weight uses the
// standard 2400 kg/m³ reinforced-concrete density.
export const concreteVolumeResponseSchema = z.object({
  input: z.object({
    shape: shapeSchema,
    length: lengthQuantitySchema,
    width: lengthQuantitySchema,
    thickness: lengthQuantitySchema,
    diameter: lengthQuantitySchema,
  }),
  volume: z.object({
    beforeWastage: z.object({
      m3: z.string(),
      ft3: z.string(),
      yd3: z.string(),
    }),
    withWastage: z.object({
      m3: z.string(),
      ft3: z.string(),
      yd3: z.string(),
    }),
  }),
  weight: z.object({
    kg: z.string(),
    tonnes: z.string(),
  }),
  standardUsed: z.object({
    wastagePercent: z.string(),
    densityKgPerM3: z.string(),
  }),
  disclaimer: z.string().optional(),
});