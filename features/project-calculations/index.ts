// Public barrel. Server-only modules (repo, service) NOT re-exported.

export {
  savedCalculationCreateSchema,
  savedCalculationPatchSchema,
  listCalculationsQuerySchema,
  calculatorSlugSchema,
  CALCULATOR_SLUGS,
} from "./schema";

export type {
  SavedCalculation,
  SavedCalculationRow,
  SavedCalculationCreate,
  SavedCalculationPatch,
  ListCalculationsQuery,
  CalculationErrorCode,
  CalculationActionResult,
  ListCalculationsActionResult,
  DeleteCalculationActionResult,
} from "./types";

export type { CalculatorSlug } from "./schema";
export { toWireCalculation } from "./types";
export { CALCULATION_CATALOG } from "./errors";
