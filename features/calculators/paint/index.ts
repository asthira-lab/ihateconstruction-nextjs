/**
 * Public surface of the paint feature.
 *
 * Consumers (the page, the form) import from this barrel — never reach into
 * individual files. Server-only modules (compute, server-compute, formula) are
 * deliberately NOT re-exported here so a client file that imports the barrel
 * can't accidentally pull them in.
 */

export { PAINT_FAQ } from "./faq";
export type { FaqItem } from "./faq";

export {
  PAINT_STANDARDS,
  findPaintPreset,
} from "./standards";
export type {
  PaintStandardPreset,
  PaintStandardsResponse,
} from "./standards";

export {
  paintRequestSchema,
  paintResponseSchema,
  lengthQuantitySchema,
  areaQuantitySchema,
  paintVolumeQuantitySchema,
  paintMassQuantitySchema,
  lengthUnitSchema,
  areaUnitSchema,
  paintVolumeUnitSchema,
  paintMassUnitSchema,
  layerSchema,
  layerStandardSchema,
  layerTypeSchema,
  openingSchema,
} from "./schema";

export type {
  PaintRequest,
  PaintResponse,
  PaintActionResult,
  PaintLayer,
  LayerType,
  LayerStandard,
  Opening,
  LengthQuantity,
  AreaQuantity,
  PaintVolumeQuantity,
  PaintMassQuantity,
  LengthUnit,
  AreaUnit,
  PaintVolumeUnit,
  PaintMassUnit,
} from "./types";
