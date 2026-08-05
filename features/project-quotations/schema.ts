// Zod schemas for quotation operations

import { z } from "zod";

export const quotationCreateSchema = z
  .object({
    boqId: z.string().uuid(),
    name: z.string().min(1).max(200).optional(),
    clientName: z.string().max(200).nullable().optional(),
    clientEmail: z.string().email().nullable().optional(),
    clientPhone: z.string().max(20).nullable().optional(),
    markupPercentage: z.coerce.number().min(0).max(999).default(0),
    discountPercentage: z.coerce.number().min(0).max(100).default(0),
    taxPercentage: z.coerce.number().min(0).max(100).default(0),
    validUntil: z.string().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    terms: z.string().max(5000).nullable().optional(),
  })
  .strict();

export type QuotationCreateInput = z.infer<typeof quotationCreateSchema>;

export const quotationPatchSchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    clientName: z.string().max(200).nullable().optional(),
    clientEmail: z.string().email().nullable().optional(),
    clientPhone: z.string().max(20).nullable().optional(),
    markupPercentage: z.coerce.number().min(0).max(999).optional(),
    discountPercentage: z.coerce.number().min(0).max(100).optional(),
    taxPercentage: z.coerce.number().min(0).max(100).optional(),
    validUntil: z.string().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    terms: z.string().max(5000).nullable().optional(),
  })
  .strict();

export type QuotationPatchInput = z.infer<typeof quotationPatchSchema>;

export const listQuotationsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export type ListQuotationsQuery = z.infer<typeof listQuotationsQuerySchema>;
