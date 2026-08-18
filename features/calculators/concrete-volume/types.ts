// Inferred types + action-result union for the concrete-volume calculator.

import type { z } from "zod";
import type {
  concreteVolumeRequestSchema,
  concreteVolumeResponseSchema,
  lengthUnitSchema,
  lengthQuantitySchema,
  shapeSchema,
} from "./schema";

export type ConcreteVolumeRequest = z.infer<typeof concreteVolumeRequestSchema>;
export type ConcreteVolumeResponse = z.infer<typeof concreteVolumeResponseSchema>;
export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;
export type Shape = z.infer<typeof shapeSchema>;

// Discriminated union returned by the server action.
export type ConcreteVolumeActionResult =
  | { ok: true; data: ConcreteVolumeResponse }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };