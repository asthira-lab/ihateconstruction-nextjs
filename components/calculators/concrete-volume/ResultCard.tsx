"use client";

// Renders the computed result of the concrete-volume calculator.

import type { ConcreteVolumeResponse } from "@/features/calculators/concrete-volume";

interface Props {
  data: ConcreteVolumeResponse;
}

export function ConcreteVolumeResultCard({ data }: Props) {
  const b = data.volume.beforeWastage;
  const w = data.volume.withWastage;
  return (
    <div className="space-y-4 rounded border border-black/10 bg-white p-5 dark:border-black dark:bg-black">
      <div>
        <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
          Concrete volume
        </p>
        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
          {Number(w.m3).toLocaleString("en-IN")}{" "}
          <span className="text-base font-normal text-black/60 dark:text-white/60">m³</span>
        </p>
      </div>

      <div className="space-y-1 border-t border-black/10 pt-3 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
        <Row k="Cubic metres" v={w.m3} />
        <Row k="Cubic feet" v={w.ft3} />
        <Row k="Cubic yards" v={w.yd3} />
      </div>

      <div className="space-y-1 border-t border-black/10 pt-3 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
        <Row
          k={`Wastage (${data.standardUsed.wastagePercent}%)`}
          v={`+${(Number(w.m3) - Number(b.m3)).toFixed(2)} m³`}
        />
        <Row k="Weight (2400 kg/m³)" v={`${Number(data.weight.kg).toLocaleString("en-IN")} kg`} />
        <Row k="Tonnes" v={data.weight.tonnes} />
      </div>

      {data.disclaimer ? (
        <p className="rounded border border-amber-500/30 bg-amber-500/[.05] px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          {data.disclaimer}
        </p>
      ) : null}
    </div>
  );
}

// One-line summary used in list rows.
export function concreteVolumeHeadline(data: ConcreteVolumeResponse): string {
  return `${data.volume.withWastage.m3} m³ concrete`;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span>{k}</span>
      <span className="font-mono tabular-nums">{v}</span>
    </div>
  );
}