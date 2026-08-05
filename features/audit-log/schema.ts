// Zod schemas for audit log queries
import { z } from "zod";

export const listAuditQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(30),
  cursor: z.string().max(500).optional(),
  entityType: z.enum(["boq", "quotation", "invoice"]).optional(),
}).strict();

export type ListAuditQuery = z.infer<typeof listAuditQuerySchema>;
