"use client";

// Pretty result render + one-line headline for a tile calculation.

import type { TileResponse } from "@/features/calculators/tile/types";

export function TileResultCard({ data }: { data: TileResponse }) {
  return (
    <div className="space-y-4 rounded border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-black">
      <div>
        <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Tiles to order</p>
        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
          {Number(data.tile.count).toLocaleString("en-IN")}{" "}
          <span className="text-base font-normal text-black/60 dark:text-white/60">tiles</span>
        </p>
        <p className="mt-1 text-[11px] text-black/50 dark:text-white/50">
          {data.tile.countBeforeWastage} before + {data.tile.wastagePercent}% wastage
        </p>
      </div>

      <div className="space-y-1 border-t border-black/10 pt-3 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
        <Row k="Gross area" v={`${data.surface.grossArea.value} ${data.surface.grossArea.unit}`} />
        {Number(data.surface.excludedArea.value) > 0 ? (
          <Row k="Excluded" v={`− ${data.surface.excludedArea.value} ${data.surface.excludedArea.unit}`} />
        ) : null}
        <Row k="Net tileable" v={`${data.surface.netArea.value} ${data.surface.netArea.unit}`} />
        <Row
          k="Tile size"
          v={`${data.tile.size.length.value}${data.tile.size.length.unit} × ${data.tile.size.width.value}${data.tile.size.width.unit}`}
        />
      </div>

      {data.adhesive.method === "thin-set" ? (
        <div className="space-y-1 border-t border-black/10 pt-3 dark:border-white/10">
          <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Thin-set adhesive</p>
          <div className="flex items-baseline justify-between text-sm">
            <span>Quantity</span>
            <span className="font-mono tabular-nums">
              {data.adhesive.quantity.value} {data.adhesive.quantity.unit}
            </span>
          </div>
        </div>
      ) : (
        <div className="space-y-1 border-t border-black/10 pt-3 dark:border-white/10">
          <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
            Mortar bed ({data.adhesive.thickness.value} {data.adhesive.thickness.unit}, {data.adhesive.mortarRatio})
          </p>
          <Row k="Volume (wet)" v={`${data.adhesive.mortarVolume.value} ${data.adhesive.mortarVolume.unit}`} />
          <Row k="Cement" v={`${data.adhesive.cement.value} ${data.adhesive.cement.unit}`} />
          <Row k="Sand" v={`${data.adhesive.sand.value} ${data.adhesive.sand.unit}`} />
        </div>
      )}

      <div className="space-y-1 border-t border-black/10 pt-3 dark:border-white/10">
        <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">Grout</p>
        <Row k="Volume" v={`${data.grout.volume.value} ${data.grout.volume.unit}`} />
        <Row k="Estimated weight" v={`${data.grout.estimatedWeight.value} ${data.grout.estimatedWeight.unit}`} />
        <p className="mt-1 text-[11px] text-black/50 dark:text-white/50">{data.grout.note}</p>
      </div>
    </div>
  );
}

// One-line summary used in list rows.
export function tileHeadline(data: TileResponse): string {
  return `${Number(data.tile.count).toLocaleString("en-IN")} tiles`;
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-sm">
      <span className="text-xs text-black/60 dark:text-white/60">{k}</span>
      <span className="font-mono tabular-nums">{v}</span>
    </div>
  );
}
