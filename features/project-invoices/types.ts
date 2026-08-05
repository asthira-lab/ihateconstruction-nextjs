// TS types for invoices. Wire vs DB row split, plus action result unions.

import type { z } from "zod";
import type { invoiceCreateSchema, invoicePatchSchema, recordPaymentSchema, listInvoicesQuerySchema } from "./schema";

export type InvoiceCreate = z.infer<typeof invoiceCreateSchema>;
export type InvoicePatch = z.infer<typeof invoicePatchSchema>;
export type RecordPayment = z.infer<typeof recordPaymentSchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesQuerySchema>;

export type InvoiceStatus = "unpaid" | "partial" | "paid";

export interface Invoice {
  id: string;
  projectId: string;
  quotationId: string | null;
  invoiceNumber: string;
  name: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  currency: string;
  amountDue: string;
  amountPaid: string;
  dueDate: string | null;
  status: InvoiceStatus;
  paymentNotes: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  paidAt: string | null;
}

export interface InvoiceRow {
  id: string;
  project_id: string;
  quotation_id: string | null;
  user_id: string;
  invoice_number: string;
  name: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  currency: string;
  amount_due: string;
  amount_paid: string;
  due_date: string | null;
  status: InvoiceStatus;
  payment_notes: string | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  paid_at: Date | null;
}

export function toWireInvoice(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    projectId: row.project_id,
    quotationId: row.quotation_id,
    invoiceNumber: row.invoice_number,
    name: row.name,
    clientName: row.client_name,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    currency: row.currency,
    amountDue: row.amount_due,
    amountPaid: row.amount_paid,
    dueDate: row.due_date,
    status: row.status,
    paymentNotes: row.payment_notes,
    notes: row.notes,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    paidAt: row.paid_at?.toISOString() ?? null,
  };
}

export type InvoiceActionResult =
  | { ok: true; data: Invoice }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export type ListInvoicesActionResult =
  | { ok: true; data: { items: Invoice[]; nextCursor: string | null; hasMore: boolean } }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export type DeleteInvoiceActionResult =
  | { ok: true }
  | { ok: false; error: { code: string; message: string; details?: unknown } };
