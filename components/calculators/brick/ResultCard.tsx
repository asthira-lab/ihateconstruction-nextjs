"use client";

// Pretty result render + one-line headline for a brick calculation.

import type { BrickResponse } from "@/features/calculators/brick/types";

export function BrickResultCard({ data }: { data: BrickResponse }) {
  const bricks = data.quantities.bricks;
  const mortar = data.quantities.mortar;
  const params = data.standardUsed.effectiveParameters;

  return (
    <div className="space-y-4 rounded border border-black/10 bg-white p-5 dark:border-white/10 dark:bg-black">
      <div>
        <p className="text-xs uppercase tracking-wide text-black/60 dark:text-white/60">
          Bricks required
        </p>
        <p className="mt-1 font-mono text-3xl font-semibold tabular-nums">
          {Number(bricks.value).toLocaleString("en-IN")}{" "}
          <span className="text-base font-normal text-black/60 dark:text-white/60">
            {bricks.unit}
          </span>
        </p>
        <p className="text-xs text-black/50 dark:text-white/50">
          {Number(bricks.beforeWastage).toLocaleString("en-IN")} before {bricks.wastagePercent}% wastage
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3 border-t border-black/10 pt-4 dark:border-white/10">
        <Stat label="Mortar" value={mortar.volume.value} unit={mortar.volume.unit} />
        <Stat label="Cement" value={mortar.cement.value} unit={mortar.cement.unit} />
        <Stat label="Sand" value={mortar.sand.value} unit={mortar.sand.unit} />
      </div>

      {data.wall ? (
        <div className="space-y-1 border-t border-black/10 pt-3 text-xs text-black/60 dark:border-white/10 dark:text-white/60">
          <Row k="Gross wall area" v={`${data.wall.grossArea.value} ${data.wall.grossArea.unit}`} />
          <Row k="Openings" v={`${data.wall.openingsArea.value} ${data.wall.openingsArea.unit}`} />
          <Row k="Net area" v={`${data.wall.netArea.value} ${data.wall.netArea.unit}`} />
          <Row k="Masonry volume" v={`${data.wall.volume.value} ${data.wall.volume.unit}`} />
        </div>
      ) : null}

      <details className="border-t border-black/10 pt-3 text-xs dark:border-white/10">
        <summary className="cursor-pointer text-black/60 dark:text-white/60">
          Parameters used
        </summary>
        <div className="mt-2 space-y-1 text-black/60 dark:text-white/60">
          <Row k="Preset" v={data.standardUsed.preset} />
          <Row
            k="Brick"
            v={`${params.brickSize.length.value}×${params.brickSize.width.value}×${params.brickSize.height.value} ${params.brickSize.length.unit}`}
          />
          <Row k="Joint" v={`${params.mortarThickness.value} ${params.mortarThickness.unit}`} />
          <Row k="Mortar ratio" v={params.mortarRatio} />
          <Row k="Brick wastage" v={`${params.wastagePercent}%`} />
          <Row k="Mortar wastage" v={`${params.mortarWastagePercent}%`} />
        </div>
      </details>
    </div>
  );
}

// One-line summary used in list rows.
export function brickHeadline(data: BrickResponse): string {
  const b = data.quantities.bricks;
  return `${Number(b.value).toLocaleString("en-IN")} ${b.unit}`;
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
