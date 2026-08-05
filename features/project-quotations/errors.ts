// Error codes for quotation operations

import type { ErrorCatalog } from "@/features/calculators/errors";

export const QUOTATION_CATALOG = {
  UNAUTHENTICATED: "Not signed in.",
  VALIDATION_FAILED: "Validation failed.",
  UNKNOWN_FIELD: "Unknown field in request.",
  NOT_FOUND: "Quotation or project not found.",
  BOQ_NOT_FOUND: "Source BOQ not found.",
  INVALID_STATUS_TRANSITION: "Invalid status transition.",
  INVALID_CURSOR: "Malformed cursor.",
  INVALID_LIMIT: "Limit must be between 1 and 100.",
  INTERNAL: "Internal error.",
} as const satisfies ErrorCatalog<
  | "UNAUTHENTICATED"
  | "VALIDATION_FAILED"
  | "UNKNOWN_FIELD"
  | "NOT_FOUND"
  | "BOQ_NOT_FOUND"
  | "INVALID_STATUS_TRANSITION"
  | "INVALID_CURSOR"
  | "INVALID_LIMIT"
>;
