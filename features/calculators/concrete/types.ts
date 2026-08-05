/**
 * TypeScript types for the concrete calculator — derived from the Zod schemas.
 *
 * Single source of truth: if a shape needs to change, edit schema.ts and let
 * the types re-derive. Never write these by hand.
 */

import type { z } from "zod";
import type {
  aggregateOutputUnitSchema,
  cementOutputUnitSchema,
  concreteOutputUnitsSchema,
  concreteRequestSchema,
  concreteResponseSchema,
  concreteStandardSchema,
  massQuantitySchema,
  massUnitSchema,
  sandOutputUnitSchema,
  volumeQuantitySchema,
  volumeUnitSchema,
} from "./schema";

export type VolumeUnit = z.infer<typeof volumeUnitSchema>;
export type VolumeQuantity = z.infer<typeof volumeQuantitySchema>;
export type MassUnit = z.infer<typeof massUnitSchema>;
export type MassQuantity = z.infer<typeof massQuantitySchema>;

export type CementOutputUnit = z.infer<typeof cementOutputUnitSchema>;
export type SandOutputUnit = z.infer<typeof sandOutputUnitSchema>;
export type AggregateOutputUnit = z.infer<typeof aggregateOutputUnitSchema>;

export type ConcreteStandard = z.infer<typeof concreteStandardSchema>;
export type ConcreteOutputUnits = z.infer<typeof concreteOutputUnitsSchema>;
export type ConcreteRequest = z.infer<typeof concreteRequestSchema>;
export type ConcreteResponse = z.infer<typeof concreteResponseSchema>;

/** Shape returned by the Server Action; discriminated on `ok`. */
export type ConcreteActionResult =
  | { ok: true; data: ConcreteResponse }
  | {
      ok: false;
      error: {
        code:
          | "VALIDATION_FAILED"
          | "UNKNOWN_PRESET"
          | "UNKNOWN_CUSTOM_KEY"
          | "INTERNAL";
        message: string;
        details?: unknown;
      };
    };
