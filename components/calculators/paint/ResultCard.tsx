"use client";

// Pretty result render + one-line headline for a paint calculation.

import type { PaintResponse } from "@/features/calculators/paint/types";

export function PaintResultCard({ data }: { data: PaintResponse }) {
  const totalLitres = data.totals.totalLitres;
  const totalPuttyKg = data.totals.totalPuttyKg;
  const hasPaint = Number(totalLitres.value) > 0;
  const hasPutty = Number(totalPuttyKg.value) > 0;
  return (
    <div className="space-y-4 rounded border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-black">
      <div>
        <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
          Total required
        </p>
        {hasPaint ? (
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
            {Number(totalLitres.value).toLocaleString("en-IN")}{" "}
            <span className="text-base font-normal text-black/60 dark:text-white/60">
              {totalLitres.unit}
            </span>
          </p>
        ) : null}
        {hasPutty ? (
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
            {Number(totalPuttyKg.value).toLocaleString("en-IN")}{" "}
            <span className="text-base font-normal text-black/60 dark:text-white/60">
              {totalPuttyKg.unit} putty
            </span>
          </p>
        ) : null}
        {!hasPaint && !hasPutty ? (
          <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
            0{" "}
            <span className="text-base font-normal text-black/60 dark:text-white/60">
              {totalLitres.unit}
            </span>
          </p>
        ) : null}
      </div>

      {data.surface ? (
        <div className="space-y-1 border-t border-black/10 pt-3 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
          <Row
            k="Wall gross"
            v={`${data.surface.wallGrossArea.value} ${data.surface.wallGrossArea.unit}`}
          />
          {Number(data.surface.ceilingArea.value) > 0 ? (
            <Row
              k="Ceiling"
              v={`${data.surface.ceilingArea.value} ${data.surface.ceilingArea.unit}`}
            />
          ) : null}
          <Row
            k="Openings"
            v={`− ${data.surface.openingsArea.value} ${data.surface.openingsArea.unit}`}
          />
          <Row
            k="Net paintable"
            v={`${data.surface.netArea.value} ${data.surface.netArea.unit}`}
          />
        </div>
      ) : null}

      <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
        <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">By layer</p>
        {data.layers.map((l, i) => {
          const isPutty = l.type === "putty";
          const qty = isPutty ? l.kg : l.litres;
          return (
            <div key={i} className="text-xs text-black/70 dark:text-white/70">
              <div className="flex items-baseline justify-between">
                <span className="font-medium capitalize">
                  {l.type} · {l.coats} coat{l.coats > 1 ? "s" : ""}
                </span>
                <span className="font-mono tabular-nums">
                  {qty.value} {qty.unit}
                </span>
              </div>
              <p className="text-[11px] text-black/50 dark:text-white/50">
                {l.standardUsed.preset} ·{" "}
                {isPutty
                  ? `${l.standardUsed.effectiveParameters.kgPerSqm} kg/sqm`
                  : `${l.standardUsed.effectiveParameters.coveragePerLitre.value} ${l.standardUsed.effectiveParameters.coveragePerLitre.unit}/L`}
                , +{l.standardUsed.effectiveParameters.wastagePercent}% wastage
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// One-line summary — picks the headline metric that isn't zero (paint dominates when both exist).
export function paintHeadline(data: PaintResponse): string {
  const l = data.totals.totalLitres;
  const k = data.totals.totalPuttyKg;
  const hasPaint = Number(l.value) > 0;
  const hasPutty = Number(k.value) > 0;
  if (hasPaint) return `${Number(l.value).toLocaleString("en-IN")} ${l.unit}`;
  if (hasPutty) return `${Number(k.value).toLocaleString("en-IN")} ${k.unit} putty`;
  return `0 ${l.unit}`;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span>{k}</span>
      <span className="font-mono tabular-nums">{v}</span>
    </div>
  );
}
