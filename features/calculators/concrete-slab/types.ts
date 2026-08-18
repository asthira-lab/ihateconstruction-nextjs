// Inferred types + action-result union for the concrete-slab calculator.

import type { z } from "zod";
import type {
  concreteSlabRequestSchema,
  concreteSlabResponseSchema,
  lengthUnitSchema,
  lengthQuantitySchema,
} from "./schema";

export type ConcreteSlabRequest = z.infer<typeof concreteSlabRequestSchema>;
export type ConcreteSlabResponse = z.infer<typeof concreteSlabResponseSchema>;
export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;

// Discriminated union returned by the server action.
export type ConcreteSlabActionResult =
  | { ok: true; data: ConcreteSlabResponse }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };