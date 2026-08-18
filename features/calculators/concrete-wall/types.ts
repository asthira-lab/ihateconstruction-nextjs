// Inferred types + action-result union for the concrete-wall calculator.

import type { z } from "zod";
import type {
  concreteWallRequestSchema,
  concreteWallResponseSchema,
  lengthUnitSchema,
  lengthQuantitySchema,
} from "./schema";

export type ConcreteWallRequest = z.infer<typeof concreteWallRequestSchema>;
export type ConcreteWallResponse = z.infer<typeof concreteWallResponseSchema>;
export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;

// Discriminated union returned by the server action.
export type ConcreteWallActionResult =
  | { ok: true; data: ConcreteWallResponse }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };