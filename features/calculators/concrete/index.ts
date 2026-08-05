/**
 * Public surface of the concrete feature.
 *
 * Consumers (the page, the form) import from this barrel — never reach into
 * individual files. Server-only modules (compute, server-compute, formula) are
 * deliberately NOT re-exported so a client file that imports the barrel
 * can't accidentally pull them in.
 */

export { CONCRETE_FAQ } from "./faq";
export type { FaqItem } from "./faq";

export {
  CONCRETE_STANDARDS,
  findConcretePreset,
} from "./standards";
export type {
  ConcreteStandardPreset,
  ConcreteStandardsResponse,
} from "./standards";

export {
  concreteRequestSchema,
  concreteResponseSchema,
  concreteStandardSchema,
  concreteOutputUnitsSchema,
  volumeQuantitySchema,
  volumeUnitSchema,
  massQuantitySchema,
  massUnitSchema,
  cementOutputUnitSchema,
  sandOutputUnitSchema,
  aggregateOutputUnitSchema,
} from "./schema";

export type {
  ConcreteRequest,
  ConcreteResponse,
  ConcreteActionResult,
  ConcreteStandard,
  ConcreteOutputUnits,
  VolumeQuantity,
  VolumeUnit,
  MassQuantity,
  MassUnit,
  CementOutputUnit,
  SandOutputUnit,
  AggregateOutputUnit,
} from "./types";
