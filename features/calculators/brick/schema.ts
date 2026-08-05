/**
 * Zod schemas mirroring the backend API contract for the brick calculator.
 *
 * Source of truth for both:
 *   - client-side form validation (via @hookform/resolvers/zod)
 *   - server-side re-validation inside the Server Action
 *
 * The `Quantity` object always uses string-encoded decimals to match the API's
 * BigDecimal-friendly wire format and avoid float precision surprises.
 * See docs/API_BRICK_CALCULATOR.md (or the phase-1 spec) for the full contract.
 */

import { z } from "zod";

// --- primitives ---------------------------------------------------------

/**
 * A stringified positive decimal. Accepts "10", "0.5", "230". Rejects empty,
 * negative, non-numeric, and NaN. Uses string to preserve precision on the
 * wire and to stay compatible with the backend's BigDecimal handling.
 */
const positiveDecimalString = z
  .string()
  .refine((s) => s.trim().length > 0, { message: "Required" })
  .refine(
    (s) => {
      const n = Number(s);
      return Number.isFinite(n) && n > 0;
    },
    { message: "Must be a positive number" },
  );

const nonNegativeDecimalString = z
  .string()
  .refine((s) => s.trim().length > 0, { message: "Required" })
  .refine(
    (s) => {
      const n = Number(s);
      return Number.isFinite(n) && n >= 0;
    },
    { message: "Must be zero or a positive number" },
  );

export const lengthUnitSchema = z.enum(["mm", "cm", "m", "ft", "in"]);
export const volumeUnitSchema = z.enum(["cum", "cft"]);

export const lengthQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: lengthUnitSchema,
});

export const volumeQuantitySchema = z.object({
  value: positiveDecimalString,
  unit: volumeUnitSchema,
});

// --- request ------------------------------------------------------------

export const openingSchema = z.object({
  label: z.string().optional(),
  width: lengthQuantitySchema,
  height: lengthQuantitySchema,
});

export const brickSizeSchema = z.object({
  length: lengthQuantitySchema,
  width: lengthQuantitySchema,
  height: lengthQuantitySchema,
});

/**
 * The `standard` field on the request. Two shapes:
 *   - { preset: "modular-indian" }
 *   - { preset: "modular-indian", custom: { …overrides… } }
 * Presets are validated by ID here; the compute step validates the ID against
 * the known preset registry and throws UNKNOWN_PRESET if it doesn't match.
 */
export const standardOverrideSchema = z.object({
  preset: z.string().min(1),
  custom: z
    .object({
      brickSize: brickSizeSchema.optional(),
      mortarThickness: lengthQuantitySchema.optional(),
      mortarRatio: z
        .string()
        .regex(/^\d+:\d+$/, { message: 'Format "a:b" e.g. "1:6"' })
        .optional(),
      wastagePercent: nonNegativeDecimalString.optional(),
      mortarWastagePercent: nonNegativeDecimalString.optional(),
      mortarDryToWetFactor: positiveDecimalString.optional(),
    })
    .passthrough()
    .optional(),
});

const wallBodySchema = z.object({
  mode: z.literal("wall"),
  wall: z.object({
    length: lengthQuantitySchema,
    height: lengthQuantitySchema,
    thickness: lengthQuantitySchema,
  }),
  openings: z.array(openingSchema).optional().default([]),
  standard: standardOverrideSchema.optional(),
});

const volumeBodySchema = z.object({
  mode: z.literal("volume"),
  volume: volumeQuantitySchema,
  standard: standardOverrideSchema.optional(),
});

/**
 * Discriminated union on `mode` — Zod will produce a clean error path when
 * the wrong shape shows up, and TypeScript narrows on `mode` downstream.
 */
export const brickRequestSchema = z.discriminatedUnion("mode", [
  wallBodySchema,
  volumeBodySchema,
]);

// --- response -----------------------------------------------------------

const bricksResultSchema = z.object({
  value: z.string(),
  unit: z.literal("pcs"),
  beforeWastage: z.string(),
  wastagePercent: z.string(),
});

const mortarResultSchema = z.object({
  volume: volumeQuantitySchema,
  cement: z.object({ value: z.string(), unit: z.literal("bags") }),
  sand: z.object({ value: z.string(), unit: z.literal("cft") }),
  wastageIncluded: z.string(),
});

export const brickResponseSchema = z.object({
  input: z.object({ mode: z.enum(["wall", "volume"]) }),
  standardUsed: z.object({
    preset: z.string(),
    effectiveParameters: z.object({
      brickSize: brickSizeSchema,
      mortarThickness: lengthQuantitySchema,
      mortarRatio: z.string(),
      wastagePercent: z.string(),
      mortarWastagePercent: z.string(),
    }),
  }),
  // Only present when mode === "wall". Server omits it entirely for volume mode.
  wall: z
    .object({
      grossArea: z.object({ value: z.string(), unit: z.literal("sqm") }),
      openingsArea: z.object({ value: z.string(), unit: z.literal("sqm") }),
      netArea: z.object({ value: z.string(), unit: z.literal("sqm") }),
      volume: volumeQuantitySchema,
    })
    .optional(),
  quantities: z.object({
    bricks: bricksResultSchema,
    mortar: mortarResultSchema,
  }),
});
