"use server";

// Server action for listing audit log entries
import { normalizeCalcError } from "@/features/calculators/errors";
import { INVOICE_CATALOG } from "@/features/project-invoices";
import { listActivityLog } from "@/features/audit-log/service";
import type { AuditEntry } from "@/features/audit-log";

export type ListActivityResult =
  | { ok: true; data: { items: AuditEntry[]; nextCursor: string | null; hasMore: boolean } }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export async function listActivityAction(projectId: string, rawQuery: unknown): Promise<ListActivityResult> {
  try {
    const data = await listActivityLog(projectId, rawQuery);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, INVOICE_CATALOG) as ListActivityResult;
  }
}
