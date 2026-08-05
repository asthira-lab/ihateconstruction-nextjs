// User-facing messages for invoice errors.

import type { ErrorCatalog } from "@/features/calculators/errors";

export type InvoiceErrorCode =
  | "UNAUTHENTICATED"
  | "VALIDATION_FAILED"
  | "UNKNOWN_FIELD"
  | "NOT_FOUND"
  | "QUOTATION_NOT_FOUND"
  | "INVALID_PAYMENT"
  | "INVALID_CURSOR"
  | "INVALID_LIMIT"
  | "INTERNAL";

export const INVOICE_CATALOG: ErrorCatalog<
  "UNAUTHENTICATED" | "VALIDATION_FAILED" | "UNKNOWN_FIELD" | "NOT_FOUND" | "QUOTATION_NOT_FOUND" | "INVALID_PAYMENT" | "INVALID_CURSOR" | "INVALID_LIMIT"
> = {
  UNAUTHENTICATED: "Not signed in.",
  VALIDATION_FAILED: "Validation failed.",
  UNKNOWN_FIELD: "Unknown field in request.",
  NOT_FOUND: "Invoice or project not found.",
  QUOTATION_NOT_FOUND: "Source quotation not found.",
  INVALID_PAYMENT: "Payment amount invalid.",
  INVALID_CURSOR: "Malformed cursor.",
  INVALID_LIMIT: "Limit must be between 1 and 100.",
  INTERNAL: "Internal error.",
} as const;
