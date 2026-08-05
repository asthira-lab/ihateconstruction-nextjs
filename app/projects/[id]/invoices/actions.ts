"use server";

// Server Actions for invoices. Wraps service + normalizeCalcError.

import { normalizeCalcError } from "@/features/calculators/errors";
import { INVOICE_CATALOG } from "@/features/project-invoices";
import type { InvoiceActionResult, ListInvoicesActionResult, DeleteInvoiceActionResult } from "@/features/project-invoices";
import { generateInvoice, getInvoice, listInvoices, patchInvoice, recordPayment, deleteInvoice } from "@/features/project-invoices/service";

export async function generateInvoiceAction(
  projectId: string,
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const data = await generateInvoice(projectId, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, INVOICE_CATALOG) as InvoiceActionResult;
  }
}

export async function getInvoiceAction(id: string): Promise<InvoiceActionResult> {
  try {
    const data = await getInvoice(id);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, INVOICE_CATALOG) as InvoiceActionResult;
  }
}

export async function listInvoicesAction(
  projectId: string,
  rawQuery: unknown,
): Promise<ListInvoicesActionResult> {
  try {
    const data = await listInvoices(projectId, rawQuery);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, INVOICE_CATALOG) as ListInvoicesActionResult;
  }
}

export async function patchInvoiceAction(
  id: string,
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const data = await patchInvoice(id, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, INVOICE_CATALOG) as InvoiceActionResult;
  }
}

export async function recordPaymentAction(
  id: string,
  raw: unknown,
): Promise<InvoiceActionResult> {
  try {
    const data = await recordPayment(id, raw);
    return { ok: true, data };
  } catch (e) {
    return normalizeCalcError(e, INVOICE_CATALOG) as InvoiceActionResult;
  }
}

export async function deleteInvoiceAction(id: string): Promise<DeleteInvoiceActionResult> {
  try {
    await deleteInvoice(id);
    return { ok: true };
  } catch (e) {
    return normalizeCalcError(e, INVOICE_CATALOG) as DeleteInvoiceActionResult;
  }
}
