// Zod schemas for BOQ operations

import { z } from "zod";

export const boqGenerateSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    notes: z.string().max(2000).nullable().optional(),
    includeCalculations: z.boolean().default(false),
    calculationIds: z.array(z.string().uuid()).optional(),
  })
  .strict();

export type BoqGenerateInput = z.infer<typeof boqGenerateSchema>;

export const boqPatchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    notes: z.string().max(2000).nullable().optional(),
    lineOverrides: z
      .array(
        z.object({
          lineId: z.string(),
          override: z.object({
            label: z.string().max(200).optional(),
            amount: z.string().regex(/^\d+(\.\d{1,2})?$/).optional(),
            reason: z.string().max(500).optional(),
          }),
        }),
      )
      .optional(),
  })
  .strict();

export type BoqPatchInput = z.infer<typeof boqPatchSchema>;

export const boqRegenerateSchema = boqGenerateSchema.optional();

export type BoqRegenerateInput = z.infer<typeof boqRegenerateSchema>;

export const listBoqsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type ListBoqsQuery = z.infer<typeof listBoqsQuerySchema>;

export const boqSwapBrandSchema = z.object({
  materialRowId: z.string().uuid(),
  newBrand: z.string().max(200).nullable(),
}).strict();

export type BoqSwapBrandInput = z.infer<typeof boqSwapBrandSchema>;
