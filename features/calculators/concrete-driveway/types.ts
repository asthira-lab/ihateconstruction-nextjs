// Inferred types + action-result union for the concrete-driveway calculator.

import type { z } from "zod";
import type {
  concreteDrivewayRequestSchema,
  concreteDrivewayResponseSchema,
  lengthUnitSchema,
  lengthQuantitySchema,
  reinforcementTypeSchema,
  rebarSizeSchema,
} from "./schema";

export type ConcreteDrivewayRequest = z.infer<typeof concreteDrivewayRequestSchema>;
export type ConcreteDrivewayResponse = z.infer<typeof concreteDrivewayResponseSchema>;
export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;
export type ReinforcementType = z.infer<typeof reinforcementTypeSchema>;
export type RebarSize = z.infer<typeof rebarSizeSchema>;

// Discriminated union returned by the server action.
export type ConcreteDrivewayActionResult =
  | { ok: true; data: ConcreteDrivewayResponse }
  | {
      ok: false;
      error: {
        code: string;
        message: string;
        details?: unknown;
      };
    };