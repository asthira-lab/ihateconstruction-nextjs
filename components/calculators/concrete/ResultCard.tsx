"use client";

// Pretty result render + one-line headline for a concrete calculation.

import type { ConcreteResponse } from "@/features/calculators/concrete/types";

export function ConcreteResultCard({ data }: { data: ConcreteResponse }) {
  const { cement, sand, aggregate } = data.quantities;
  const params = data.standardUsed.effectiveParameters;

  return (
    <div className="space-y-4 rounded border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-black">
      <div>
        <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
          Cement required
        </p>
        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
          {Number(cement.value).toLocaleString("en-IN")}{" "}
          <span className="text-base font-normal text-black/60 dark:text-white/60">
            {cement.unit}
          </span>
        </p>
        <p className="text-xs text-black/50 dark:text-white/50">
          {Number(cement.inSI.value).toLocaleString("en-IN")} {cement.inSI.unit}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 border-t border-black/10 pt-4 dark:border-white/10">
        <Stat label="Sand" value={sand.value} unit={sand.unit} />
        <Stat label="Aggregate" value={aggregate.value} unit={aggregate.unit} />
      </div>

      <div className="space-y-1 border-t border-black/10 pt-3 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
        <Row k="Dry volume" v={`${data.breakdown.dryVolume.value} ${data.breakdown.dryVolume.unit}`} />
        <Row
          k="Wastage applied"
          v={`${data.breakdown.wastageApplied.value}${data.breakdown.wastageApplied.unit}`}
        />
      </div>

      <details className="border-t border-black/10 pt-3 text-xs dark:border-white/10">
        <summary className="cursor-pointer text-black/60 dark:text-white/60">
          Parameters used
        </summary>
        <div className="mt-2 space-y-1 text-black/60 dark:text-white/60">
          <Row k="Preset" v={data.standardUsed.preset} />
          <Row k="Mix ratio" v={params.mixRatio} />
          <Row
            k="Cement density"
            v={`${params.cementDensity.value} ${params.cementDensity.unit}/cum`}
          />
          <Row k="Bag weight" v={`${params.cementBagWeight.value} ${params.cementBagWeight.unit}`} />
          <Row k="Dry-to-wet factor" v={params.dryToWetFactor} />
        </div>
        {data.breakdown.notes ? (
          <p className="mt-2 text-black/50 dark:text-white/50">{data.breakdown.notes}</p>
        ) : null}
      </details>
    </div>
  );
}

// One-line summary used in list rows — leading with cement bags is the reference metric.
export function concreteHeadline(data: ConcreteResponse): string {
  const c = data.quantities.cement;
  return `${Number(c.value).toLocaleString("en-IN")} ${c.unit}`;
}

function Stat({ label, value, unit }: { label: string; value: string; unit: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">{label}</p>
      <p className="mt-0.5 font-mono text-lg font-semibold tabular-nums">{value}</p>
      <p className="text-xs text-black/50 dark:text-white/50">{unit}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span>{k}</span>
      <span className="font-mono tabular-nums">{v}</span>
    </div>
  );
}
