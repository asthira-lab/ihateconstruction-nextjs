"use client";

// Switches on calc.calculator to render the right shared ResultCard, and exports a headline picker.

import type { SavedCalculation } from "@/features/project-calculations";
import { BrickResultCard, brickHeadline } from "@/components/calculators/brick/ResultCard";
import { ConcreteResultCard, concreteHeadline } from "@/components/calculators/concrete/ResultCard";
import { SteelResultCard, steelHeadline } from "@/components/calculators/steel/ResultCard";
import { PaintResultCard, paintHeadline } from "@/components/calculators/paint/ResultCard";
import { TileResultCard, tileHeadline } from "@/components/calculators/tile/ResultCard";
import { RebarResultCard, rebarHeadline } from "@/components/calculators/rebar/ResultCard";
import { ConcreteVolumeResultCard, concreteVolumeHeadline } from "@/components/calculators/concrete-volume/ResultCard";
import { ConcreteSlabResultCard, concreteSlabHeadline } from "@/components/calculators/concrete-slab/ResultCard";
import type { BrickResponse } from "@/features/calculators/brick/types";
import type { ConcreteResponse } from "@/features/calculators/concrete/types";
import type { SteelResponse } from "@/features/calculators/steel/types";
import type { PaintResponse } from "@/features/calculators/paint/types";
import type { TileResponse } from "@/features/calculators/tile/types";
import type { RebarResponse } from "@/features/calculators/rebar/types";
import type { ConcreteVolumeResponse } from "@/features/calculators/concrete-volume/types";
import type { ConcreteSlabResponse } from "@/features/calculators/concrete-slab/types";

// Renders the pretty ResultCard for whichever calculator produced this row.
export function CalculationResult({ calc }: { calc: SavedCalculation }) {
  switch (calc.calculator) {
    case "brick":
      return <BrickResultCard data={calc.result as unknown as BrickResponse} />;
    case "concrete":
      return <ConcreteResultCard data={calc.result as unknown as ConcreteResponse} />;
    case "steel":
      return <SteelResultCard data={calc.result as unknown as SteelResponse} />;
    case "paint":
      return <PaintResultCard data={calc.result as unknown as PaintResponse} />;
    case "tile":
      return <TileResultCard data={calc.result as unknown as TileResponse} />;
    case "rebar":
      return <RebarResultCard data={calc.result as unknown as RebarResponse} />;
    case "concrete-volume":
      return <ConcreteVolumeResultCard data={calc.result as unknown as ConcreteVolumeResponse} />;
    case "concrete-slab":
      return <ConcreteSlabResultCard data={calc.result as unknown as ConcreteSlabResponse} />;
    default:
      return (
        <div className="rounded border border-dashed border-black/15 p-4 text-xs text-black/60 dark:border-white/20 dark:text-white/60">
          No preview available for this calculator type.
        </div>
      );
  }
}

// One-line summary for a saved calc — used in list rows.
export function calculationHeadline(calc: SavedCalculation): string {
  try {
    switch (calc.calculator) {
      case "brick":
        return brickHeadline(calc.result as unknown as BrickResponse);
      case "concrete":
        return concreteHeadline(calc.result as unknown as ConcreteResponse);
      case "steel":
        return steelHeadline(calc.result as unknown as SteelResponse);
      case "paint":
        return paintHeadline(calc.result as unknown as PaintResponse);
      case "tile":
        return tileHeadline(calc.result as unknown as TileResponse);
      case "rebar":
        return rebarHeadline(calc.result as unknown as RebarResponse);
      case "concrete-volume":
        return concreteVolumeHeadline(calc.result as unknown as ConcreteVolumeResponse);
      case "concrete-slab":
        return concreteSlabHeadline(calc.result as unknown as ConcreteSlabResponse);
      default:
        return "";
    }
  } catch {
    // A malformed stored result shouldn't crash the row — just show nothing.
    return "";
  }
}
