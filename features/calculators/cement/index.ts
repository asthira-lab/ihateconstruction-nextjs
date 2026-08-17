// Public surface of the cement feature — pure client-safe math + FAQ + presets.

export { CEMENT_FAQ } from "./faq";
export type { FaqItem } from "./faq";

export {
  CEMENT_PRESETS,
  BAG_WEIGHTS,
  computeCement,
  findCementPreset,
} from "./formula";
export type {
  CementPreset,
  CementInput,
  CementOutput,
  BagWeightKg,
  SlabShape,
  PostHoleShape,
  MixRatio,
} from "./formula";
