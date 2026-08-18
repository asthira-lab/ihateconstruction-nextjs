// Inferred types + action-result union for the concrete-footing calculator.

import type { z } from "zod";
import type {
  concreteFootingRequestSchema,
  concreteFootingResponseSchema,
  footingTypeSchema,
  lengthUnitSchema,
  lengthQuantitySchema,
} from "./schema";

export type ConcreteFootingRequest = z.infer<typeof concreteFootingRequestSchema>;
export type ConcreteFootingResponse = z.infer<typeof concreteFootingResponseSchema>;
export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;
export type FootingType = z.infer<typeof footingTypeSchema>;

// Discriminated union returned by the server action.
export type ConcreteFootingActionResult =
  | { ok: true; data: ConcreteFootingResponse }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };