// Inferred types + action-result union for the concrete-staircase calculator.

import type { z } from "zod";
import type {
  concreteStaircaseRequestSchema,
  concreteStaircaseResponseSchema,
  lengthUnitSchema,
  lengthQuantitySchema,
} from "./schema";

export type ConcreteStaircaseRequest = z.infer<typeof concreteStaircaseRequestSchema>;
export type ConcreteStaircaseResponse = z.infer<typeof concreteStaircaseResponseSchema>;
export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;

// Discriminated union returned by the server action.
export type ConcreteStaircaseActionResult =
  | { ok: true; data: ConcreteStaircaseResponse }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };