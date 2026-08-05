// Zod schemas for project materials. Type + unit are IMMUTABLE post-create.

import { z } from "zod";

export const MATERIAL_TYPES = [
  "cement", "sand", "aggregate", "brick", "steel", "tile",
  "paint", "adhesive", "grout", "putty", "labour", "other",
] as const;
export type MaterialType = (typeof MATERIAL_TYPES)[number];
export const materialTypeSchema = z.enum(MATERIAL_TYPES);

export const MATERIAL_UNITS: Record<MaterialType, readonly string[]> = {
  cement: ["bag", "kg", "tonne"],
  sand: ["cft", "cum", "tonne", "kg"],
  aggregate: ["cft", "cum", "tonne", "kg"],
  brick: ["piece", "1000-pieces"],
  steel: ["kg", "tonne", "quintal"],
  tile: ["piece", "sqft", "sqm", "box"],
  paint: ["litre", "kg", "bucket-20L", "bucket-10L"],
  adhesive: ["kg", "bag"],
  grout: ["kg", "bag"],
  putty: ["kg", "bag"],
  labour: ["day", "hour", "sqft", "sqm"],
  other: ["piece", "kg", "litre", "day", "sqft", "sqm", "unit"],
};

function isUnitAllowedForType(type: MaterialType, unit: string): boolean {
  return MATERIAL_UNITS[type].includes(unit);
}

const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, { message: "Must be a positive money value with up to 2 decimals" })
  .refine((s) => Number(s) > 0, { message: "Must be greater than 0" });

// Quantity is non-negative with up to 3 decimals — a running BOM quantity, not a price.
const quantitySchema = z
  .string()
  .regex(/^\d+(\.\d{1,3})?$/, { message: "Must be a non-negative number with up to 3 decimals" });

const brandSchema = z.string().trim().max(200);
const vendorSchema = z.string().trim().max(200);
const notesSchema = z.string().max(2000);

export const materialCreateSchema = z
  .object({
    type: materialTypeSchema,
    brand: brandSchema.nullable().optional(),
    unit: z.string().min(1).max(40),
    unitPrice: moneySchema,
    quantity: quantitySchema.nullable().optional(),
    vendor: vendorSchema.nullable().optional(),
    notes: notesSchema.nullable().optional(),
    effectiveFrom: z.string().datetime().optional(),
  })
  .strict()
  .superRefine((data, ctx) => {
    if (!isUnitAllowedForType(data.type, data.unit)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["unit"],
        message: `UNIT_NOT_ALLOWED_FOR_TYPE:${data.type}:${data.unit}`,
      });
    }
  });

export const materialPatchSchema = z
  .object({
    brand: brandSchema.nullable().optional(),
    unitPrice: moneySchema.optional(),
    quantity: quantitySchema.nullable().optional(),
    vendor: vendorSchema.nullable().optional(),
    notes: notesSchema.nullable().optional(),
    effectiveFrom: z.string().datetime().optional(),
  })
  .strict();

export const listMaterialsQuerySchema = z
  .object({
    type: materialTypeSchema.optional(),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    cursor: z.string().max(500).optional(),
  })
  .strict();

export function unitsForType(type: MaterialType): readonly string[] {
  return MATERIAL_UNITS[type];
}
