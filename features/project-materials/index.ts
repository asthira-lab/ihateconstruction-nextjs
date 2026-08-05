// Public barrel. Server-only modules NOT re-exported.

export {
  materialCreateSchema,
  materialPatchSchema,
  listMaterialsQuerySchema,
  materialTypeSchema,
  MATERIAL_TYPES,
  MATERIAL_UNITS,
  unitsForType,
} from "./schema";

export type { MaterialType } from "./schema";

export type {
  ProjectMaterial,
  ProjectMaterialRow,
  MaterialCreate,
  MaterialPatch,
  ListMaterialsQuery,
  MaterialErrorCode,
  MaterialActionResult,
  ListMaterialsActionResult,
  DeleteMaterialActionResult,
} from "./types";

export { toWireMaterial } from "./types";
export { MATERIAL_CATALOG } from "./errors";
