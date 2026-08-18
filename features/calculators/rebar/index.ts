// Public surface of the rebar feature. Server-only modules NOT re-exported.

export {
  rebarRequestSchema,
  rebarResponseSchema,
  lengthUnitSchema,
  lengthQuantitySchema,
  barDiameterSchema,
  memberSchema,
} from "./schema";
export type {
  RebarRequest,
  RebarResponse,
  RebarActionResult,
  Member,
  LengthUnit,
  LengthQuantity,
  RebarBarDiameter,
} from "./types";

export {
  REBAR_SIZES,
  COMMON_DIAMETERS_MM,
  DEFAULT_SPACING_MM,
  DEFAULT_WASTAGE_PERCENT,
  DEFAULT_BAR_LENGTH_M,
} from "./sizes";
export type { RebarSize } from "./sizes";

export { resolveWastage } from "./standards";
