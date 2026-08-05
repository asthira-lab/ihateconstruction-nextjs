// Zod schemas for invoice API contract.

import { z } from "zod";

export const invoiceCreateSchema = z
  .object({
    quotationId: z.string().uuid(),
    name: z.string().trim().min(1).max(200).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").optional(),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict();

export const invoicePatchSchema = z
  .object({
    name: z.string().trim().min(1).max(200).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD").nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    paymentNotes: z.string().max(2000).nullable().optional(),
  })
  .strict();

export const recordPaymentSchema = z
  .object({
    amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Must be a valid monetary amount"),
    notes: z.string().max(2000).nullable().optional(),
  })
  .strict();

export const listInvoicesQuerySchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    cursor: z.string().max(500).optional(),
  })
  .strict();
