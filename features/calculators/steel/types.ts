// Types inferred from the Zod schemas — single source of truth.

import type {z} from "zod";
import type {
    barDiameterSchema,
    barSchema,
    lengthQuantitySchema,
    lengthUnitSchema,
    massQuantitySchema,
    massUnitSchema,
    memberSchema,
    steelRequestSchema,
    steelResponseSchema,
    steelStandardSchema,
    volumeQuantitySchema,
    volumeUnitSchema,
    weightPerMetreFormulaSchema,
} from "./schema";

export type LengthUnit = z.infer<typeof lengthUnitSchema>;
export type VolumeUnit = z.infer<typeof volumeUnitSchema>;
export type MassUnit = z.infer<typeof massUnitSchema>;

export type LengthQuantity = z.infer<typeof lengthQuantitySchema>;
export type VolumeQuantity = z.infer<typeof volumeQuantitySchema>;
export type MassQuantity = z.infer<typeof massQuantitySchema>;
export type BarDiameter = z.infer<typeof barDiameterSchema>;

export type Member = z.infer<typeof memberSchema>;
export type WeightPerMetreFormula = z.infer<typeof weightPerMetreFormulaSchema>;

export type SteelStandard = z.infer<typeof steelStandardSchema>;
export type SteelBar = z.infer<typeof barSchema>;
export type SteelRequest = z.infer<typeof steelRequestSchema>;
export type SteelResponse = z.infer<typeof steelResponseSchema>;

export type SteelActionResult =
    | { ok: true; data: SteelResponse }
    | {
    ok: false;
    error: {
        code:
            | "VALIDATION_FAILED"
            | "UNKNOWN_MODE"
            | "UNKNOWN_MEMBER"
            | "UNKNOWN_PRESET"
            | "UNKNOWN_CUSTOM_KEY"
            | "INTERNAL";
        message: string;
        details?: unknown;
    };
};
