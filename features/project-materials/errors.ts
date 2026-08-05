// User-facing messages for project material errors.

import type { ErrorCatalog } from "../calculators/errors";
import type { MaterialErrorCode } from "./types";

export const MATERIAL_CATALOG: ErrorCatalog<MaterialErrorCode> = {
  UNAUTHENTICATED: "You need to sign in to manage materials.",
  VALIDATION_FAILED: "Some of the inputs look wrong. Check the highlighted fields.",
  UNKNOWN_FIELD: "One of the fields sent isn't recognised.",
  UNIT_NOT_ALLOWED_FOR_TYPE: "That unit isn't valid for this material type.",
  NOT_FOUND: "That material doesn't exist or isn't yours.",
  IMMUTABLE_FIELD: "That field can't be changed after the material is created.",
  INVALID_CURSOR: "The pagination cursor is malformed. Try refreshing the list.",
  INVALID_LIMIT: "Page size must be between 1 and 100.",
  PROJECT_ARCHIVED: "You can't add materials to an archived project. Unarchive it first.",
  INTERNAL: "Something went wrong. Try again.",
};
