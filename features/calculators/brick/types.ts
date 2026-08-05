/**
 * TypeScript types derived from the Zod schemas — single source of truth.
 *
 * Never write these by hand. If a shape needs to change, change the schema
 * and let the type flow through.
 */

import type { z } from "zod";
import type {
  brickRequestSchema,
  brickResponseSchema,
  lengthQuantitySchema,
  lengthUnitSchema,
  openingSchema,
  standardOverrideSchema,
  volumeQuantitySchema,
  volumeUnitSchema,
} from "./schema";

export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type VolumeUnit = z.infer<typeof volumeUnitSchema>;
export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;
export type VolumeQuantity = z.infer<typeof volumeQuantitySchema>;
export type Opening = z.infer<typeof openingSchema>;
export type StandardOverride = z.infer<typeof standardOverrideSchema>;
export type BrickRequest = z.infer<typeof brickRequestSchema>;
export type BrickResponse = z.infer<typeof brickResponseSchema>;

/** The shape returned by the Server Action; discriminated on `ok`. */
export type BrickActionResult =
  | { ok: true; data: BrickResponse }
  | {
      ok: false;
      error: {
        code:
          | "VALIDATION_FAILED"
          | "UNKNOWN_MODE"
          | "OPENINGS_EXCEED_WALL"
          | "UNKNOWN_PRESET"
          | "UNKNOWN_CUSTOM_KEY"
          | "INTERNAL";
        message: string;
        details?: unknown;
      };
    };
