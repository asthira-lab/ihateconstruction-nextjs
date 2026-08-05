// User-facing messages for saved calculation errors.

import type { ErrorCatalog } from "../calculators/errors";
import type { CalculationErrorCode } from "./types";

export const CALCULATION_CATALOG: ErrorCatalog<CalculationErrorCode> = {
  UNAUTHENTICATED: "You need to sign in to save calculations.",
  VALIDATION_FAILED: "Some of the inputs look wrong. Check the highlighted fields.",
  UNKNOWN_FIELD: "One of the fields sent isn't recognised.",
  UNKNOWN_CALCULATOR: "That calculator isn't recognised.",
  NOT_FOUND: "That calculation doesn't exist or isn't yours.",
  IMMUTABLE_FIELD: "That field can't be changed after the calculation is created.",
  INVALID_CURSOR: "The pagination cursor is malformed. Try refreshing the list.",
  INVALID_LIMIT: "Page size must be between 1 and 100.",
  PROJECT_ARCHIVED: "You can't add calculations to an archived project. Unarchive it first.",
  COMPUTE_FAILED: "The calculator couldn't compute this. Check the inputs.",
  INTERNAL: "Something went wrong. Try again.",
};
