// Types inferred from the Zod schemas — single source of truth.

import type { z } from "zod";
import type {
  barDiameterSchema,
  lengthQuantitySchema,
  lengthUnitSchema,
  memberSchema,
  rebarRequestSchema,
  rebarResponseSchema,
} from "./schema";

export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;
export type Member = z.infer<typeof memberSchema>;
export type RebarBarDiameter = z.infer<typeof barDiameterSchema>;
export type RebarRequest = z.infer<typeof rebarRequestSchema>;
export type RebarResponse = z.infer<typeof rebarResponseSchema>;

export type RebarActionResult =
  | { ok: true; data: RebarResponse }
  | {
      ok: false;
      error: {
        code:
          | "VALIDATION_FAILED"
          | "UNKNOWN_MEMBER"
          | "UNKNOWN_CUSTOM_KEY"
          | "INTERNAL";
        message: string;
        details?: unknown;
      };
    };
