// Public barrel. Server-only modules (repo, service) NOT re-exported.

export { invoiceCreateSchema, invoicePatchSchema, recordPaymentSchema, listInvoicesQuerySchema } from "./schema";
export type { Invoice, InvoiceRow, InvoiceCreate, InvoicePatch, RecordPayment, ListInvoicesQuery, InvoiceStatus, InvoiceActionResult, ListInvoicesActionResult, DeleteInvoiceActionResult } from "./types";
export { toWireInvoice } from "./types";
export { INVOICE_CATALOG } from "./errors";
export type { InvoiceErrorCode } from "./errors";
