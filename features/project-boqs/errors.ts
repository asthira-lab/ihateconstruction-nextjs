// Error codes for BOQ operations

import type { ErrorCatalog } from "@/features/calculators/errors";

export const BOQ_CATALOG = {
  UNAUTHENTICATED: "Not signed in.",
  VALIDATION_FAILED: "Validation failed.",
  UNKNOWN_FIELD: "Unknown field in request.",
  NOT_FOUND: "BOQ or project not found.",
  NO_CALCULATIONS: "Project has no saved calculations matching the filter.",
  IMMUTABLE_FIELD: "This field cannot be changed.",
  LINE_NOT_FOUND: "Line not found in this BOQ.",
  CONFLICT: "Operation blocked by a related resource (e.g., accepted quotation).",
  INVALID_CURSOR: "Malformed cursor.",
  INVALID_LIMIT: "Limit must be between 1 and 100.",
  INTERNAL: "Internal error.",
} as const satisfies ErrorCatalog<
  | "UNAUTHENTICATED"
  | "VALIDATION_FAILED"
  | "UNKNOWN_FIELD"
  | "NOT_FOUND"
  | "NO_CALCULATIONS"
  | "IMMUTABLE_FIELD"
  | "LINE_NOT_FOUND"
  | "CONFLICT"
  | "INVALID_CURSOR"
  | "INVALID_LIMIT"
>;
