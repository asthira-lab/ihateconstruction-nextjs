// Public barrel for the Projects feature. Server-only modules (repo, service) are NOT re-exported.

export {
  projectCreateSchema,
  projectPatchSchema,
  projectStatusSchema,
  listProjectsQuerySchema,
  locationSchema,
} from "./schema";

export type {
  Project,
  ProjectRow,
  ProjectCounts,
  ProjectCreate,
  ProjectPatch,
  ProjectStatus,
  ProjectLocation,
  ProjectErrorCode,
  ProjectActionResult,
  ListProjectsActionResult,
  DeleteProjectActionResult,
  ListProjectsQuery,
} from "./types";

export { toWireProject } from "./types";
export { PROJECT_CATALOG } from "./errors";
