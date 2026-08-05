/**
 * Public surface of the brick feature.
 *
 * Consumers (the page, the form) import from this barrel — never reach into
 * individual files. Server-only modules (compute, server-compute, formula) are
 * deliberately NOT re-exported here so a client file that imports the barrel
 * can't accidentally pull them in.
 */

export { BRICK_FAQ } from "./faq";
export type { FaqItem } from "./faq";

export {
  BRICK_STANDARDS,
  findPreset,
} from "./standards";
export type { BrickStandardPreset, BrickStandardsResponse } from "./standards";

export {
  brickRequestSchema,
  brickResponseSchema,
  lengthQuantitySchema,
  volumeQuantitySchema,
  lengthUnitSchema,
  volumeUnitSchema,
  standardOverrideSchema,
  openingSchema,
} from "./schema";

export type {
  BrickRequest,
  BrickResponse,
  BrickActionResult,
  Opening,
  LengthQuantity,
  VolumeQuantity,
  LengthUnit,
  VolumeUnit,
  StandardOverride,
} from "./types";
