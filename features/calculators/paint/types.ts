/**
 * TypeScript types derived from the Zod schemas — single source of truth.
 *
 * Never write these by hand. If a shape needs to change, change the schema
 * and let the type flow through.
 */

import type { z } from "zod";
import type {
  areaQuantitySchema,
  areaUnitSchema,
  layerSchema,
  layerStandardSchema,
  layerTypeSchema,
  lengthQuantitySchema,
  lengthUnitSchema,
  openingSchema,
  paintMassQuantitySchema,
  paintMassUnitSchema,
  paintRequestSchema,
  paintResponseSchema,
  paintVolumeQuantitySchema,
  paintVolumeUnitSchema,
} from "./schema";

export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type AreaUnit = z.infer<typeof areaUnitSchema>;
export type PaintVolumeUnit = z.infer<typeof paintVolumeUnitSchema>;
export type PaintMassUnit = z.infer<typeof paintMassUnitSchema>;

export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;
export type AreaQuantity = z.infer<typeof areaQuantitySchema>;
export type PaintVolumeQuantity = z.infer<typeof paintVolumeQuantitySchema>;
export type PaintMassQuantity = z.infer<typeof paintMassQuantitySchema>;

export type Opening = z.infer<typeof openingSchema>;

export type LayerType = z.infer<typeof layerTypeSchema>;
export type LayerStandard = z.infer<typeof layerStandardSchema>;
export type PaintLayer = z.infer<typeof layerSchema>;

export type PaintRequest = z.infer<typeof paintRequestSchema>;
export type PaintResponse = z.infer<typeof paintResponseSchema>;

/** The shape returned by the Server Action; discriminated on `ok`. */
export type PaintActionResult =
  | { ok: true; data: PaintResponse }
  | {
      ok: false;
      error: {
        code:
          | "VALIDATION_FAILED"
          | "UNKNOWN_MODE"
          | "UNKNOWN_LAYER_TYPE"
          | "OPENINGS_EXCEED_WALL"
          | "UNKNOWN_PRESET"
          | "UNKNOWN_CUSTOM_KEY"
          | "INTERNAL";
        message: string;
        details?: unknown;
      };
    };
