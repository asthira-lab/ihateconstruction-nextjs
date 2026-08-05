// User-facing messages for the Projects error taxonomy. Keys must cover every code the actions throw.

import type { ErrorCatalog } from "../calculators/errors";
import type { ProjectErrorCode } from "./types";

export const PROJECT_CATALOG: ErrorCatalog<ProjectErrorCode> = {
  UNAUTHENTICATED: "You need to sign in to continue.",
  VALIDATION_FAILED: "Some of the inputs look wrong. Check the highlighted fields.",
  UNKNOWN_FIELD: "One of the fields sent isn't recognised.",
  NOT_FOUND: "That project doesn't exist or isn't yours.",
  IMMUTABLE_FIELD: "That field can't be changed after the project is created.",
  INVALID_CURSOR: "The pagination cursor is malformed. Try refreshing the list.",
  INVALID_LIMIT: "Page size must be between 1 and 100.",
  ALREADY_ARCHIVED: "This project is already archived.",
  NOT_ARCHIVED: "This project isn't archived.",
  INTERNAL: "Something went wrong. Try again.",
};
