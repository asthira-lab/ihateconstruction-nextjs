"use client";

// Pretty result render + one-line headline for a steel calculation.

import type { SteelResponse } from "@/features/calculators/steel/types";

export function SteelResultCard({ data }: { data: SteelResponse }) {
  const t = data.totals;
  return (
    <div className="space-y-4 rounded border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-black">
      <div>
        <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
          Total steel required
        </p>
        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
          {Number(t.totalWeight.value).toLocaleString("en-IN")}{" "}
          <span className="text-base font-normal text-black/60 dark:text-white/60">
            {t.totalWeight.unit}
          </span>
        </p>
      </div>

      <div className="space-y-1 border-t border-black/10 pt-3 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
        <Row
          k="Before wastage"
          v={`${t.weightBeforeWastage.value} ${t.weightBeforeWastage.unit}`}
        />
        <Row k="Wastage" v={`+ ${t.wastage.value} ${t.wastage.unit}`} />
      </div>

      {data.bars && data.bars.length > 0 ? (
        <div className="space-y-2 border-t border-black/10 pt-3 dark:border-white/10">
          <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">By bar</p>
          {data.bars.map((b, i) => (
            <div key={i} className="text-xs text-black/70 dark:text-white/70">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{b.label ?? `Bar ${i + 1}`}</span>
                <span className="font-mono tabular-nums">
                  {b.weight.value} {b.weight.unit}
                </span>
              </div>
              <p className="text-[11px] text-black/50 dark:text-white/50">
                {b.count} × {b.diameter.value}mm × {b.length.value}
                {b.length.unit} · {b.weightPerMetre.value} {b.weightPerMetre.unit}
                /m · total length {b.totalLength.value} {b.totalLength.unit}
              </p>
            </div>
          ))}
        </div>
      ) : null}

      {data.disclaimer ? (
        <p className="rounded border border-amber-500/30 bg-amber-500/[.05] px-3 py-2 text-xs text-amber-800 dark:text-amber-300">
          {data.disclaimer}
        </p>
      ) : null}
    </div>
  );
}

// One-line summary used in list rows.
export function steelHeadline(data: SteelResponse): string {
  const w = data.totals.totalWeight;
  return `${Number(w.value).toLocaleString("en-IN")} ${w.unit}`;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span>{k}</span>
      <span className="font-mono tabular-nums">{v}</span>
    </div>
  );
}
