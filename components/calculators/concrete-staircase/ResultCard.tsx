"use client";

// Renders the computed result of the concrete-staircase calculator.

import type { ConcreteStaircaseResponse } from "@/features/calculators/concrete-staircase";

interface Props {
  data: ConcreteStaircaseResponse;
}

export function ConcreteStaircaseResultCard({ data }: Props) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <h3 className="text-base font-semibold tracking-tight">Results</h3>
      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <dt className="text-black/60 dark:text-white/60">Stair Volume</dt>
        <dd className="tabular-nums text-right font-medium">
          {data.volume.value} {data.volume.unit}
        </dd>
        <dt className="text-black/60 dark:text-white/60">Concrete (with wastage)</dt>
        <dd className="tabular-nums text-right font-medium">
          {data.totals.concreteVolume.value} {data.totals.concreteVolume.unit}
        </dd>
        <dt className="text-black/60 dark:text-white/60">Cement (25 kg bags)</dt>
        <dd className="tabular-nums text-right">
          {data.totals.cementBags25kg.value} {data.totals.cementBags25kg.unit}
        </dd>
        <dt className="text-black/60 dark:text-white/60">Cement (50 kg bags)</dt>
        <dd className="tabular-nums text-right">
          {data.totals.cementBags50kg.value} {data.totals.cementBags50kg.unit}
        </dd>
        <dt className="text-black/60 dark:text-white/60">Sand</dt>
        <dd className="tabular-nums text-right">
          {data.totals.sandVolume.value} {data.totals.sandVolume.unit}
        </dd>
        <dt className="text-black/60 dark:text-white/60">Aggregate</dt>
        <dd className="tabular-nums text-right">
          {data.totals.aggregateVolume.value} {data.totals.aggregateVolume.unit}
        </dd>
        <dt className="text-black/60 dark:text-white/60">Wastage applied</dt>
        <dd className="tabular-nums text-right">{data.standardUsed.wastagePercent}%</dd>
        <dt className="text-black/60 dark:text-white/60">Mix ratio</dt>
        <dd className="tabular-nums text-right">{data.standardUsed.mixRatio}</dd>
      </dl>
      {data.disclaimer ? (
        <p className="mt-4 text-xs text-black/50 dark:text-white/50">{data.disclaimer}</p>
      ) : null}
    </div>
  );
}