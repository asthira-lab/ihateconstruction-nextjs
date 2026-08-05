// Audit log wire and DB types
export type EntityType = "boq" | "quotation" | "invoice";
export type AuditAction = "created" | "updated" | "deleted" | "status_changed" | "payment_recorded" | "regenerated";

export interface AuditEntry {
  id: string;
  projectId: string;
  entityType: EntityType;
  entityId: string;
  action: AuditAction;
  summary: string;
  changes: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditRow {
  id: string;
  project_id: string;
  user_id: string;
  entity_type: EntityType;
  entity_id: string;
  action: AuditAction;
  summary: string;
  changes_json: Record<string, unknown> | null;
  created_at: Date;
}

export function toWireAuditEntry(row: AuditRow): AuditEntry {
  return {
    id: row.id,
    projectId: row.project_id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    action: row.action,
    summary: row.summary,
    changes: row.changes_json,
    createdAt: row.created_at.toISOString(),
  };
}
