// Cement calculator math — pure, client-safe. No I/O.
// Supports slab, post hole, and free-volume modes with SI + Imperial units.

// Dry-to-wet shrinkage factor. Loose dry ingredients pack tighter as wet concrete.
const DRY_TO_WET_FACTOR = 1.54;

// Cement bulk density (kg per cubic metre) — standard for OPC + PPC.
const CEMENT_DENSITY_KG_PER_M3 = 1440;

// Standard bag weights the user can select. 94 lb is the US Portland cement bag
// (≈ 42.638 kg — a full cubic foot of loose cement). 50 kg is the Indian standard.
export const BAG_WEIGHTS = {
  "50-kg": { kg: 50, label: "50 kg bag (India / metric)" },
  "40-kg": { kg: 40, label: "40 kg bag" },
  "25-kg": { kg: 25, label: "25 kg bag" },
  "94-lb": { kg: 42.6377, label: "94 lb bag (US Portland cement)" },
  "80-lb": { kg: 36.2874, label: "80 lb bag (concrete mix)" },
  "60-lb": { kg: 27.2155, label: "60 lb bag (concrete mix)" },
} as const;

export type BagWeightKg = keyof typeof BAG_WEIGHTS;

// Common mix ratios (cement : sand : aggregate). Sand-only ratios use "0" aggregate.
export type MixRatio =
  | "1:2:4" // M15 — footings, PCC
  | "1:1.5:3" // M20 — general RCC slab/beam/column
  | "1:1:2" // M25 — moderate structural
  | "1:3:6" // M10 — non-structural
  | "1:4" // Mortar — plastering (sand + cement)
  | "1:6" // Mortar — brickwork
  | "1:3" // Rich mortar — post holes, tile bed
  | "cement-only";

const MIX_PARTS: Record<Exclude<MixRatio, "cement-only">, number[]> = {
  "1:2:4": [1, 2, 4],
  "1:1.5:3": [1, 1.5, 3],
  "1:1:2": [1, 1, 2],
  "1:3:6": [1, 3, 6],
  "1:4": [1, 4],
  "1:6": [1, 6],
  "1:3": [1, 3],
};

export interface CementPreset {
  id: string;
  label: string;
  description: string;
  mix: MixRatio;
}

// Curated presets covering every ranking keyword — slab, post hole, sand+cement, portland.
export const CEMENT_PRESETS: CementPreset[] = [
  {
    id: "slab-m20",
    label: "Concrete slab (M20 — general)",
    description: "1:1.5:3 mix. Standard house slab, driveway, garage floor.",
    mix: "1:1.5:3",
  },
  {
    id: "slab-m15",
    label: "Concrete slab (M15 — light-load)",
    description: "1:2:4 mix. Non-structural slabs, footpaths, patio.",
    mix: "1:2:4",
  },
  {
    id: "slab-m25",
    label: "Structural slab (M25)",
    description: "1:1:2 mix. RCC slab for moderate structural load.",
    mix: "1:1:2",
  },
  {
    id: "post-hole",
    label: "Post hole / fence post",
    description: "1:3 rich cement–sand mix for setting posts.",
    mix: "1:3",
  },
  {
    id: "mortar-brick",
    label: "Brickwork mortar (1:6)",
    description: "Sand and cement for laying bricks or blocks.",
    mix: "1:6",
  },
  {
    id: "mortar-plaster",
    label: "Plaster mortar (1:4)",
    description: "Sand and cement for wall plaster.",
    mix: "1:4",
  },
  {
    id: "cement-only",
    label: "Cement only (no aggregate)",
    description: "Pure Portland cement quantity from cement volume.",
    mix: "cement-only",
  },
];

export function findCementPreset(id: string): CementPreset | undefined {
  return CEMENT_PRESETS.find((p) => p.id === id);
}

export type SlabShape = {
  kind: "slab";
  lengthFt: number;
  widthFt: number;
  thicknessIn: number;
};

export type PostHoleShape = {
  kind: "post-hole";
  diameterIn: number;
  depthFt: number;
  count: number;
};

export type VolumeShape = {
  kind: "volume";
  // Wet volume in cubic yards. The form converts cft / cum / cuyd before calling.
  wetVolumeYd3: number;
};

export interface CementInput {
  shape: SlabShape | PostHoleShape | VolumeShape;
  preset: CementPreset;
  bagWeight: BagWeightKg;
  wastagePercent: number;
}

export interface CementOutput {
  // Volumes echoed in three units so the UI can pick whichever the user picked.
  wetVolumeYd3: number;
  wetVolumeM3: number;
  wetVolumeFt3: number;

  dryVolumeM3: number;

  cementKg: number;
  cementBags: number;
  cementLb: number;

  sandKg: number;
  sandFt3: number;

  aggregateKg: number;
  aggregateFt3: number;

  mixLabel: string;
}

// Unit conversion constants.
const YD3_TO_M3 = 0.764555;
const M3_TO_YD3 = 1 / YD3_TO_M3;
const M3_TO_FT3 = 35.3146667;
const KG_TO_LB = 2.20462;

// Bulk densities used only when reporting sand + aggregate in weight (kg).
const SAND_BULK_KG_PER_M3 = 1600;
const AGGREGATE_BULK_KG_PER_M3 = 1500;

/** Wet volume in cubic metres for whichever shape the user picked. */
function wetVolumeM3(shape: CementInput["shape"]): number {
  if (shape.kind === "slab") {
    // length × width × thickness — feet × feet × (in / 12) = cubic feet.
    const ft3 = shape.lengthFt * shape.widthFt * (shape.thicknessIn / 12);
    return ft3 / M3_TO_FT3;
  }
  if (shape.kind === "post-hole") {
    // π r² × depth × count.
    const radiusFt = shape.diameterIn / 12 / 2;
    const ft3 =
      Math.PI * radiusFt * radiusFt * shape.depthFt * shape.count;
    return ft3 / M3_TO_FT3;
  }
  return shape.wetVolumeYd3 * YD3_TO_M3;
}

export function computeCement(input: CementInput): CementOutput {
  const wetM3 = wetVolumeM3(input.shape);
  const dryM3 = wetM3 * DRY_TO_WET_FACTOR * (1 + input.wastagePercent / 100);

  const bagKg = BAG_WEIGHTS[input.bagWeight].kg;

  let cementM3 = 0;
  let sandM3 = 0;
  let aggregateM3 = 0;
  let mixLabel = "";

  if (input.preset.mix === "cement-only") {
    // Treat the wet volume as the cement volume itself (advanced case).
    cementM3 = dryM3;
    mixLabel = "Cement only";
  } else {
    const parts = MIX_PARTS[input.preset.mix];
    const total = parts.reduce((s, n) => s + n, 0);
    cementM3 = (dryM3 * parts[0]!) / total;
    sandM3 = (dryM3 * (parts[1] ?? 0)) / total;
    aggregateM3 = (dryM3 * (parts[2] ?? 0)) / total;
    mixLabel = input.preset.mix;
  }

  const cementKg = cementM3 * CEMENT_DENSITY_KG_PER_M3;
  const cementBags = Math.ceil(cementKg / bagKg);

  return {
    wetVolumeYd3: wetM3 * M3_TO_YD3,
    wetVolumeM3: wetM3,
    wetVolumeFt3: wetM3 * M3_TO_FT3,

    dryVolumeM3: dryM3,

    cementKg,
    cementLb: cementKg * KG_TO_LB,
    cementBags,

    sandKg: sandM3 * SAND_BULK_KG_PER_M3,
    sandFt3: sandM3 * M3_TO_FT3,

    aggregateKg: aggregateM3 * AGGREGATE_BULK_KG_PER_M3,
    aggregateFt3: aggregateM3 * M3_TO_FT3,

    mixLabel,
  };
}
