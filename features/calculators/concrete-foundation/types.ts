// Inferred types + action-result union for the concrete-foundation calculator.

import type { z } from "zod";
import type {
  concreteFoundationRequestSchema,
  concreteFoundationResponseSchema,
  lengthUnitSchema,
  lengthQuantitySchema,
} from "./schema";

export type ConcreteFoundationRequest = z.infer<typeof concreteFoundationRequestSchema>;
export type ConcreteFoundationResponse = z.infer<typeof concreteFoundationResponseSchema>;
export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;

// Discriminated union returned by the server action.
export type ConcreteFoundationActionResult =
  | { ok: true; data: ConcreteFoundationResponse }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };