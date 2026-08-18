"use client";

// Pretty result render + one-line headline for a rebar calculation.

import type { RebarResponse } from "@/features/calculators/rebar/types";

export function RebarResultCard({ data }: { data: RebarResponse }) {
  const t = data.totals;
  return (
    <div className="space-y-4 rounded border border-black/10 bg-white p-5 dark:border-black dark:bg-black">
      <div>
        <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
          Total rebar weight
        </p>
        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
          {Number(t.totalWeight.value).toLocaleString("en-IN")}{" "}
          <span className="text-base font-normal text-black/60 dark:text-white/60">
            {t.totalWeight.unit}
          </span>
        </p>
      </div>

      <div className="space-y-1 border-t border-black/10 pt-3 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
        <Row k="Rebar grid length" v={`${data.grid.gridLength.value} ${data.grid.gridLength.unit}`} />
        <Row k="Rebar grid width" v={`${data.grid.gridWidth.value} ${data.grid.gridWidth.unit}`} />
        <Row k="Total rebar length" v={`${data.totalLength.value} ${data.totalLength.unit}`} />
        <Row k="Rebar pieces (12 m bars)" v={`${data.pieces}`} />
        <Row k="Rebar per m²" v={`${data.area.perSqm.value} ${data.area.perSqm.unit}`} />
        <Row k="Rebar per ft²" v={`${data.area.perSqft.value} ${data.area.perSqft.unit}`} />
      </div>

      <div className="space-y-1 border-t border-black/10 pt-3 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
        <Row
          k="Before wastage"
          v={`${t.weightBeforeWastage.value} ${t.weightBeforeWastage.unit}`}
        />
        <Row k={`Wastage (${data.standardUsed.wastagePercent}%)`} v={`+ ${t.wastage.value} ${t.wastage.unit}`} />
      </div>

      <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
        <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Bars by direction</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded border border-black/10 p-2 dark:border-white/10">
            <p className="text-black/60 dark:text-white/60">Main (length)</p>
            <p className="mt-1 font-mono text-base font-semibold tabular-nums">{data.longitudinal.count}</p>
            <p className="text-[11px] text-black/50 dark:text-white/50">× {data.longitudinal.barLength.value} m bars</p>
          </div>
          <div className="rounded border border-black/10 p-2 dark:border-white/10">
            <p className="text-black/60 dark:text-white/60">Distribution</p>
            <p className="mt-1 font-mono text-base font-semibold tabular-nums">{data.transverse.count}</p>
            <p className="text-[11px] text-black/50 dark:text-white/50">× {data.transverse.barLength.value} m bars</p>
          </div>
        </div>
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
export function rebarHeadline(data: RebarResponse): string {
  const w = data.totals.totalWeight;
  return `${Number(w.value).toLocaleString("en-IN")} ${w.unit} rebar`;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span>{k}</span>
      <span className="font-mono tabular-nums">{v}</span>
    </div>
  );
}
