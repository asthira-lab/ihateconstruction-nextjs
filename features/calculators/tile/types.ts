// Types derived from the tile calculator's zod schemas. Never hand-write.

import type { z } from "zod";
import type {
  adhesiveMethodSchema,
  areaQuantitySchema,
  areaUnitSchema,
  excludeAreaSchema,
  lengthQuantitySchema,
  lengthUnitSchema,
  massUnitSchema,
  surfaceTypeSchema,
  tileRequestSchema,
  tileResponseSchema,
  tileStandardSchema,
  volumeUnitSchema,
} from "./schema";

export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type AreaUnit = z.infer<typeof areaUnitSchema>;
export type VolumeUnit = z.infer<typeof volumeUnitSchema>;
export type MassUnit = z.infer<typeof massUnitSchema>;

export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;
export type AreaQuantity = z.infer<typeof areaQuantitySchema>;

export type SurfaceType = z.infer<typeof surfaceTypeSchema>;
export type AdhesiveMethod = z.infer<typeof adhesiveMethodSchema>;
export type ExcludeArea = z.infer<typeof excludeAreaSchema>;

export type TileStandard = z.infer<typeof tileStandardSchema>;
export type TileRequest = z.infer<typeof tileRequestSchema>;
export type TileResponse = z.infer<typeof tileResponseSchema>;

// Server-action result envelope; discriminated on `ok`.
export type TileActionResult =
  | { ok: true; data: TileResponse }
  | {
      ok: false;
      error: {
        code:
          | "VALIDATION_FAILED"
          | "UNKNOWN_SURFACE_TYPE"
          | "UNKNOWN_ADHESIVE_METHOD"
          | "EXCLUSIONS_EXCEED_SURFACE"
          | "UNKNOWN_PRESET"
          | "UNKNOWN_CUSTOM_KEY"
          | "INTERNAL";
        message: string;
        details?: unknown;
      };
    };
