// Public barrel for the tile feature. Server-only modules are NOT re-exported.

export { TILE_FAQ } from "./faq";
export type { FaqItem } from "./faq";

export {
  TILE_STANDARDS,
  findTilePreset,
  resolveTileStandard,
} from "./standards";
export type {
  TileStandardPreset,
  TileStandardsResponse,
  TileEffectiveParams,
} from "./standards";

export {
  tileRequestSchema,
  tileResponseSchema,
  lengthQuantitySchema,
  areaQuantitySchema,
  lengthUnitSchema,
  areaUnitSchema,
  surfaceTypeSchema,
  adhesiveMethodSchema,
  excludeAreaSchema,
  tileStandardSchema,
} from "./schema";

export type {
  TileRequest,
  TileResponse,
  TileActionResult,
  LengthQuantity,
  AreaQuantity,
  LengthUnit,
  AreaUnit,
  SurfaceType,
  AdhesiveMethod,
  ExcludeArea,
  TileStandard,
} from "./types";
