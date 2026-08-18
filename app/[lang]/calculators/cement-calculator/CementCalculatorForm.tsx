"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  BAG_WEIGHTS,
  CEMENT_PRESETS,
  computeCement,
  findCementPreset,
  type BagWeightKg,
  type CementInput,
  type CementOutput,
} from "@/features/calculators/cement";
import type { Dictionary } from "@/app/[lang]/dictionaries";

type Mode = "slab" | "post-hole" | "volume";
type VolumeUnit = "cuyd" | "cum" | "cft";

interface FormState {
  mode: Mode;
  presetId: string;
  bagWeight: BagWeightKg;
  wastagePercent: string;
  slabLengthFt: string;
  slabWidthFt: string;
  slabThicknessIn: string;
  postDiameterIn: string;
  postDepthFt: string;
  postCount: string;
  volumeAmount: string;
  volumeUnit: VolumeUnit;
}

const INITIAL: FormState = {
  mode: "slab",
  presetId: "slab-m20",
  bagWeight: "94-lb",
  wastagePercent: "5",
  slabLengthFt: "10",
  slabWidthFt: "10",
  slabThicknessIn: "4",
  postDiameterIn: "10",
  postDepthFt: "2",
  postCount: "4",
  volumeAmount: "1",
  volumeUnit: "cuyd",
};

function fmt(n: number, digits = 2): string {
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString(undefined, {
    maximumFractionDigits: digits,
    minimumFractionDigits: 0,
  });
}

interface Props {
  t: Dictionary["calculators"]["cement"]["form"];
  common: Dictionary["common"];
}

export function CementCalculatorForm({ t, common }: Props) {
  const [state, setState] = useState<FormState>(INITIAL);

  const result: CementOutput | null = useMemo(() => {
    const preset = findCementPreset(state.presetId);
    if (!preset) return null;

    const wastage = Number(state.wastagePercent) || 0;

    let shape: CementInput["shape"];
    if (state.mode === "slab") {
      const L = Number(state.slabLengthFt);
      const W = Number(state.slabWidthFt);
      const T = Number(state.slabThicknessIn);
      if (!L || !W || !T) return null;
      shape = { kind: "slab", lengthFt: L, widthFt: W, thicknessIn: T };
    } else if (state.mode === "post-hole") {
      const D = Number(state.postDiameterIn);
      const H = Number(state.postDepthFt);
      const N = Number(state.postCount);
      if (!D || !H || !N) return null;
      shape = { kind: "post-hole", diameterIn: D, depthFt: H, count: N };
    } else {
      const A = Number(state.volumeAmount);
      if (!A) return null;
      const yd3 =
        state.volumeUnit === "cuyd"
          ? A
          : state.volumeUnit === "cum"
            ? A * 1.30795
            : A / 27;
      shape = { kind: "volume", wetVolumeYd3: yd3 };
    }

    return computeCement({
      shape,
      preset,
      bagWeight: state.bagWeight,
      wastagePercent: wastage,
    });
  }, [state]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) =>
    setState((s) => ({ ...s, [k]: v }));

  const modeLabel = (m: Mode): string =>
    m === "slab" ? t.modes.slab : m === "post-hole" ? t.modes.post : t.modes.free;

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6 rounded-lg border border-black/10 p-6 dark:border-white/10">
        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">
            {t.pouring}
          </legend>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {(["slab", "post-hole", "volume"] as Mode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => update("mode", m)}
                className={`rounded border px-3 py-2 text-sm ${
                  state.mode === m
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/15 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
                }`}
              >
                {modeLabel(m)}
              </button>
            ))}
          </div>
        </fieldset>

        {state.mode === "slab" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NumField
              label={t.lengthFt}
              value={state.slabLengthFt}
              onChange={(v) => update("slabLengthFt", v)}
            />
            <NumField
              label={t.widthFt}
              value={state.slabWidthFt}
              onChange={(v) => update("slabWidthFt", v)}
            />
            <NumField
              label={t.thicknessIn}
              value={state.slabThicknessIn}
              onChange={(v) => update("slabThicknessIn", v)}
            />
          </div>
        )}

        {state.mode === "post-hole" && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <NumField
              label={t.diameterIn}
              value={state.postDiameterIn}
              onChange={(v) => update("postDiameterIn", v)}
            />
            <NumField
              label={t.depthFt}
              value={state.postDepthFt}
              onChange={(v) => update("postDepthFt", v)}
            />
            <NumField
              label={t.posts}
              value={state.postCount}
              onChange={(v) => update("postCount", v)}
            />
          </div>
        )}

        {state.mode === "volume" && (
          <div className="grid grid-cols-2 gap-3">
            <NumField
              label={t.wetVolume}
              value={state.volumeAmount}
              onChange={(v) => update("volumeAmount", v)}
            />
            <label className="flex flex-col text-sm">
              <span className="mb-1 text-xs font-medium text-black/70 dark:text-white/70">
                {t.unit}
              </span>
              <select
                value={state.volumeUnit}
                onChange={(e) =>
                  update("volumeUnit", e.target.value as VolumeUnit)
                }
                className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
              >
                <option value="cuyd">{t.units.yd3}</option>
                <option value="cum">{t.units.m3}</option>
                <option value="cft">{t.units.ft3}</option>
              </select>
            </label>
          </div>
        )}

        <label className="flex flex-col text-sm">
          <span className="mb-1 text-xs font-medium text-black/70 dark:text-white/70">
            {t.ratio}
          </span>
          <select
            value={state.presetId}
            onChange={(e) => update("presetId", e.target.value)}
            className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
          >
            {CEMENT_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="mt-1 text-xs text-black/60 dark:text-white/60">
            {findCementPreset(state.presetId)?.description}
          </span>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col text-sm">
            <span className="mb-1 text-xs font-medium text-black/70 dark:text-white/70">
              {t.bagSize}
            </span>
            <select
              value={state.bagWeight}
              onChange={(e) => update("bagWeight", e.target.value as BagWeightKg)}
              className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
            >
              {Object.entries(BAG_WEIGHTS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </select>
          </label>
          <NumField
            label={t.wastage}
            value={state.wastagePercent}
            onChange={(v) => update("wastagePercent", v)}
          />
        </div>

        <Button type="button" variant="secondary" onClick={() => setState(INITIAL)}>
          {common.reset}
        </Button>
      </div>

      <aside
        aria-label={t.resultAria}
        className="rounded-lg border border-black/10 p-6 dark:border-white/10"
      >
        <h2 className="text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">
          {t.youNeed}
        </h2>
        {result ? (
          <div className="mt-4 space-y-4">
            <div>
              <p className="text-4xl font-semibold tracking-tight">
                {result.cementBags}
              </p>
              <p className="text-sm text-black/60 dark:text-white/60">
                {t.bags}{BAG_WEIGHTS[state.bagWeight].label})
              </p>
            </div>

            <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
              <dt className="text-black/60 dark:text-white/60">{t.cementKg}</dt>
              <dd className="text-right font-medium">
                {fmt(result.cementKg, 1)}
              </dd>
              <dt className="text-black/60 dark:text-white/60">{t.cementLb}</dt>
              <dd className="text-right font-medium">
                {fmt(result.cementLb, 1)}
              </dd>
              {result.sandKg > 0 && (
                <>
                  <dt className="text-black/60 dark:text-white/60">{common.sand}</dt>
                  <dd className="text-right font-medium">
                    {fmt(result.sandKg, 0)} kg / {fmt(result.sandFt3, 1)} cft
                  </dd>
                </>
              )}
              {result.aggregateKg > 0 && (
                <>
                  <dt className="text-black/60 dark:text-white/60">{common.aggregate}</dt>
                  <dd className="text-right font-medium">
                    {fmt(result.aggregateKg, 0)} kg /{" "}
                    {fmt(result.aggregateFt3, 1)} cft
                  </dd>
                </>
              )}
            </dl>

            <div className="border-t border-black/10 pt-3 text-xs text-black/60 dark:text-white/60 dark:border-white/10">
              <p>
                {t.wetVol} {fmt(result.wetVolumeYd3, 2)} yd³ ·{" "}
                {fmt(result.wetVolumeM3, 2)} m³ · {fmt(result.wetVolumeFt3, 1)}{" "}
                ft³
              </p>
              <p className="mt-1">
                {t.mixLabel} {result.mixLabel} {t.dry}{" "}
                {state.wastagePercent}%
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-black/60 dark:text-white/60">
            {t.empty}
          </p>
        )}
      </aside>
    </div>
  );
}

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col text-sm">
      <span className="mb-1 text-xs font-medium text-black/70 dark:text-white/70">
        {label}
      </span>
      <input
        type="number"
        inputMode="decimal"
        min="0"
        step="any"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-black/15 bg-transparent px-3 py-2 text-sm dark:border-white/15"
      />
    </label>
  );
}
