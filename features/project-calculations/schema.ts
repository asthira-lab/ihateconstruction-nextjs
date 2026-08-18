// Zod schemas for saved-calculation API contract. Two shapes: A (server recomputes) and B (trust client).

import { z } from "zod";

export const CALCULATOR_SLUGS = ["brick", "concrete", "paint", "steel", "tile", "rebar", "concrete-volume", "concrete-slab", "concrete-footing", "concrete-foundation", "concrete-wall"] as const;
export type CalculatorSlug = (typeof CALCULATOR_SLUGS)[number];
export const calculatorSlugSchema = z.enum(CALCULATOR_SLUGS);

const labelSchema = z.string().trim().min(1, { message: "Required" }).max(200);
const descriptionSchema = z.string().max(2000);
const groupSchema = z.string().trim().max(60);

export const savedCalculationCreateShapeA = z
  .object({
    calculator: calculatorSlugSchema,
    label: labelSchema,
    description: descriptionSchema.nullable().optional(),
    group: groupSchema.nullable().optional(),
    request: z.record(z.unknown()),
  })
  .strict();

export const savedCalculationCreateShapeB = z
  .object({
    calculator: calculatorSlugSchema,
    label: labelSchema,
    description: descriptionSchema.nullable().optional(),
    group: groupSchema.nullable().optional(),
    request: z.record(z.unknown()),
    result: z.record(z.unknown()),
  })
  .strict();

export const savedCalculationCreateSchema = z.union([
  savedCalculationCreateShapeB,
  savedCalculationCreateShapeA,
]);

export const savedCalculationPatchSchema = z
  .object({
    label: labelSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    group: groupSchema.nullable().optional(),
  })
  .strict();

export const listCalculationsQuerySchema = z
  .object({
    calculator: calculatorSlugSchema.optional(),
    group: z.string().max(60).optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    cursor: z.string().max(500).optional(),
  })
  .strict();
