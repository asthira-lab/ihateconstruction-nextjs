// Zod schemas for the concrete-driveway calculator API contract.

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

export const reinforcementTypeSchema = z.enum(["none", "wire-mesh", "rebar"]);
export const rebarSizeSchema = z.enum(["10mm", "12mm", "16mm", "20mm"]);

// Driveway is rectangular: length × width footprint at a uniform thickness.
// Includes optional reinforcement (rebar/wire mesh) and control joint spacing.
export const concreteDrivewayRequestSchema = z.object({
  length: lengthQuantitySchema,
  width: lengthQuantitySchema,
  thickness: lengthQuantitySchema,
  // Reinforcement options
  reinforcement: reinforcementTypeSchema.optional().default("none"),
  rebarSpacing: lengthQuantitySchema.optional(),
  rebarSize: rebarSizeSchema.optional(),
  // Control joints
  jointSpacing: lengthQuantitySchema.optional(),
  // Optional ordering/placing wastage — defaults to 5% server-side when absent.
  wastagePercent: nonNegativeDecimalString.optional(),
});

// Volume in the three units contractors quote in, plus weight, premix bags,
// ready-mix truck count, and reinforcement materials.
export const concreteDrivewayResponseSchema = z.object({
  input: z.object({
    length: lengthQuantitySchema,
    width: lengthQuantitySchema,
    thickness: lengthQuantitySchema,
    reinforcement: reinforcementTypeSchema.optional(),
    rebarSpacing: lengthQuantitySchema.optional(),
    rebarSize: rebarSizeSchema.optional(),
    jointSpacing: lengthQuantitySchema.optional(),
  }),
  slab: z.object({
    area: z.object({ m2: z.string(), ft2: z.string() }),
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
  reinforcement: z.object({
    type: reinforcementTypeSchema,
    wireMeshSheets: z.number().int().nonnegative().optional(),
    rebar: z.object({
      totalLengthM: z.string().optional(),
      pieces: z.number().int().nonnegative().optional(),
      weightKg: z.string().optional(),
    }).optional(),
  }),
  joints: z.object({
    spacingM: z.string().optional(),
    totalJoints: z.number().int().nonnegative().optional(),
  }).optional(),
  standardUsed: z.object({
    wastagePercent: z.string(),
    densityKgPerM3: z.string(),
    bag80lbM3: z.string(),
    bag60lbM3: z.string(),
    truckYd3: z.string(),
    rebarDensityKgPerM: z.string().optional(),
  }),
  disclaimer: z.string().optional(),
});