"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { BrickResultCard } from "@/components/calculators/brick/ResultCard";
import type {
  BrickActionResult,
  BrickRequest,
  BrickStandardsResponse,
  LengthQuantity,
  Opening,
} from "@/features/calculators/brick";
import { lengthToMeters } from "@/features/calculators/brick/units";
import { submitBrickCalculation } from "./actions";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const LENGTH_UNITS = ["mm", "cm", "m", "ft", "in"] as const;
const VOLUME_UNITS = ["cum", "cft"] as const;

interface BrickCalculatorFormProps {
  initialStandards: BrickStandardsResponse;
  t: Dictionary["calculators"]["brick"]["form"];
  common: Dictionary["common"];
  cCommon: Dictionary["calculators"]["common"];
}

interface FormState {
  mode: "wall" | "volume";
  presetId: string;
  useCustom: boolean;
  wallLength: LengthQuantity;
  wallHeight: LengthQuantity;
  wallThickness: LengthQuantity;
  openings: Opening[];
  volume: { value: string; unit: "cum" | "cft" };
  customMortarThickness: LengthQuantity;
  customMortarRatio: string;
  customWastagePercent: string;
  customMortarWastagePercent: string;
  customMortarDryToWetFactor: string;
  customBrickL: LengthQuantity;
  customBrickW: LengthQuantity;
  customBrickH: LengthQuantity;
}

function makeInitialState(
  standards: BrickStandardsResponse,
  defaultDoorLabel: string,
): FormState {
  const defaultPreset =
    standards.presets.find((p) => p.id === standards.defaultPreset) ??
    standards.presets[0]!;
  const p = defaultPreset.parameters;
  return {
    mode: "wall",
    presetId: defaultPreset.id,
    useCustom: false,
    wallLength: { value: "10", unit: "m" },
    wallHeight: { value: "3", unit: "m" },
    wallThickness: { value: "230", unit: "mm" },
    openings: [
      {
        label: defaultDoorLabel,
        width: { value: "0.9", unit: "m" },
        height: { value: "2.1", unit: "m" },
      },
    ],
    volume: { value: "3.5", unit: "cum" },
    customMortarThickness: p.mortarThickness,
    customMortarRatio: p.mortarRatio,
    customWastagePercent: p.wastagePercent,
    customMortarWastagePercent: p.mortarWastagePercent,
    customMortarDryToWetFactor: p.mortarDryToWetFactor,
    customBrickL: p.brickSize.length,
    customBrickW: p.brickSize.width,
    customBrickH: p.brickSize.height,
  };
}

interface FormErrors {
  wallLength?: string;
  wallHeight?: string;
  wallThickness?: string;
  volume?: string;
  openings?: Array<{ width?: string; height?: string } | undefined>;
  openingsTotal?: string;
}

function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function validateForm(
  state: FormState,
  e: Dictionary["calculators"]["brick"]["form"]["errors"],
): FormErrors {
  const errors: FormErrors = {};

  if (state.mode === "wall") {
    const lenM = lengthToMeters(state.wallLength);
    const hgtM = lengthToMeters(state.wallHeight);
    const thkM = lengthToMeters(state.wallThickness);

    if (!Number.isFinite(lenM) || lenM <= 0) errors.wallLength = e.lenMin;
    else if (lenM > 100) errors.wallLength = e.lenMax;

    if (!Number.isFinite(hgtM) || hgtM <= 0) errors.wallHeight = e.htMin;
    else if (hgtM > 20) errors.wallHeight = e.htMax;

    if (!Number.isFinite(thkM) || thkM <= 0) errors.wallThickness = e.thickMin;
    else if (thkM < 0.05) errors.wallThickness = e.thickTooThin;
    else if (thkM > 0.5) errors.wallThickness = e.thickTooThick;

    const openingErrors: Array<{ width?: string; height?: string } | undefined> = [];
    let openingsArea = 0;
    let anyOpeningError = false;
    state.openings.forEach((op, i) => {
      const wM = lengthToMeters(op.width);
      const hM = lengthToMeters(op.height);
      const eOp: { width?: string; height?: string } = {};
      if (!Number.isFinite(wM) || wM <= 0) eOp.width = e.widMin;
      else if (Number.isFinite(lenM) && wM > lenM) eOp.width = e.opWider;
      if (!Number.isFinite(hM) || hM <= 0) eOp.height = e.htMin;
      else if (Number.isFinite(hgtM) && hM > hgtM) eOp.height = e.opTaller;
      if (Object.keys(eOp).length > 0) {
        openingErrors[i] = eOp;
        anyOpeningError = true;
      }
      if (Number.isFinite(wM) && Number.isFinite(hM)) openingsArea += wM * hM;
    });
    if (anyOpeningError) errors.openings = openingErrors;

    if (
      Number.isFinite(lenM) &&
      Number.isFinite(hgtM) &&
      openingsArea > lenM * hgtM
    ) {
      errors.openingsTotal = e.opExceeds;
    }
  } else {
    const v = parseNum(state.volume.value);
    if (!Number.isFinite(v) || v <= 0) errors.volume = e.volMin;
  }

  return errors;
}

function toBrickRequest(state: FormState): BrickRequest {
  const standard = state.useCustom
    ? {
        preset: state.presetId,
        custom: {
          brickSize: {
            length: state.customBrickL,
            width: state.customBrickW,
            height: state.customBrickH,
          },
          mortarThickness: state.customMortarThickness,
          mortarRatio: state.customMortarRatio,
          wastagePercent: state.customWastagePercent,
          mortarWastagePercent: state.customMortarWastagePercent,
          mortarDryToWetFactor: state.customMortarDryToWetFactor,
        },
      }
    : { preset: state.presetId };

  if (state.mode === "wall") {
    return {
      mode: "wall",
      wall: {
        length: state.wallLength,
        height: state.wallHeight,
        thickness: state.wallThickness,
      },
      openings: state.openings,
      standard,
    };
  }
  return {
    mode: "volume",
    volume: state.volume,
    standard,
  };
}

export function BrickCalculatorForm({
  initialStandards,
  t,
  common,
  cCommon,
}: BrickCalculatorFormProps) {
  const [state, setState] = useState<FormState>(() =>
    makeInitialState(initialStandards, t.defaultDoor),
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const changePreset = (id: string) => {
    const preset = initialStandards.presets.find((p) => p.id === id);
    if (!preset) return;
    const p = preset.parameters;
    setState((s) => ({
      ...s,
      presetId: id,
      customMortarThickness: p.mortarThickness,
      customMortarRatio: p.mortarRatio,
      customWastagePercent: p.wastagePercent,
      customMortarWastagePercent: p.mortarWastagePercent,
      customMortarDryToWetFactor: p.mortarDryToWetFactor,
      customBrickL: p.brickSize.length,
      customBrickW: p.brickSize.width,
      customBrickH: p.brickSize.height,
    }));
  };

  const addOpening = () =>
    set("openings", [
      ...state.openings,
      {
        label: t.openingN.replace("{n}", String(state.openings.length + 1)),
        width: { value: "1", unit: "m" },
        height: { value: "1", unit: "m" },
      },
    ]);
  const removeOpening = (i: number) =>
    set(
      "openings",
      state.openings.filter((_, idx) => idx !== i),
    );
  const patchOpening = (i: number, patch: Partial<Opening>) =>
    set(
      "openings",
      state.openings.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    );

  const errors = useMemo(() => validateForm(state, t.errors), [state, t.errors]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<BrickActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<BrickRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;
    const req = toBrickRequest(state);
    startTransition(async () => {
      const res = await submitBrickCalculation(req);
      setResult(res);
      if (res.ok) setSavedRequest(req);
      else setSavedRequest(null);
    });
  };

  const errCode = result && !result.ok ? result.error.code : null;
  const errMsg = result && !result.ok ? result.error.message : null;

  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
      <form onSubmit={onSubmit} className="space-y-8" noValidate>
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">{t.mode}</legend>
          <div className="flex gap-2">
            {(["wall", "volume"] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => set("mode", m)}
                aria-pressed={state.mode === m}
                className={`flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors ${
                  state.mode === m
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/15 bg-white text-black hover:bg-black/[.04] dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/[.06]"
                }`}
              >
                {m === "wall" ? t.modes.dims : t.modes.vol}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">{t.standard}</legend>
          <select
            value={state.presetId}
            onChange={(e) => changePreset(e.target.value)}
            className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white dark:focus:ring-white"
          >
            {initialStandards.presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-black/60 dark:text-white/60">
            {initialStandards.presets.find((p) => p.id === state.presetId)?.description}
          </p>
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs">
            <input
              type="checkbox"
              checked={state.useCustom}
              onChange={(e) => set("useCustom", e.target.checked)}
              className="accent-black dark:accent-white"
            />
            {t.customStd}
          </label>
        </fieldset>

        {state.mode === "wall" ? (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">{t.wallDims}</legend>
            <LabeledRow label={common.length} error={errors.wallLength}>
              <QuantityInput
                value={state.wallLength}
                onChange={(q) => set("wallLength", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={100}
                step={0.1}
                decimals={2}
                ariaLabel={common.length}
              />
            </LabeledRow>
            <LabeledRow label={common.height} error={errors.wallHeight}>
              <QuantityInput
                value={state.wallHeight}
                onChange={(q) => set("wallHeight", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={20}
                step={0.1}
                decimals={2}
                ariaLabel={common.height}
              />
            </LabeledRow>
            <LabeledRow label={common.thickness} error={errors.wallThickness}>
              <QuantityInput
                value={state.wallThickness}
                onChange={(q) => set("wallThickness", q)}
                units={LENGTH_UNITS}
                min={50}
                max={500}
                step={5}
                decimals={0}
                ariaLabel={common.thickness}
              />
            </LabeledRow>

            <div className="space-y-2 border-t border-black/10 pt-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">{t.openings}</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addOpening}
                  type="button"
                >
                  {t.addOpening}
                </Button>
              </div>
              {state.openings.length === 0 ? (
                <p className="text-xs text-black/50 dark:text-white/50">
                  {t.noOpenings}
                </p>
              ) : (
                <div className="space-y-4">
                  {errors.openingsTotal ? (
                    <p
                      role="alert"
                      className="text-xs text-red-600 dark:text-red-400"
                    >
                      {errors.openingsTotal}
                    </p>
                  ) : null}
                  {state.openings.map((op, i) => (
                    <div
                      key={i}
                      className="rounded border border-black/10 p-3 dark:border-white/10"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <input
                          value={op.label ?? ""}
                          onChange={(e) => patchOpening(i, { label: e.target.value })}
                          placeholder={t.labelPh}
                          className="w-40 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm focus:border-black/15 focus:outline-none dark:focus:border-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeOpening(i)}
                          className="text-xs text-red-600 hover:underline dark:text-red-400"
                          aria-label={t.removeOpAria.replace("{i}", String(i + 1))}
                        >
                          {common.remove}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <LabeledRow label={common.width} compact error={errors.openings?.[i]?.width}>
                          <QuantityInput
                            value={op.width}
                            onChange={(q) => patchOpening(i, { width: q })}
                            units={LENGTH_UNITS}
                            min={0.1}
                            max={20}
                            step={0.1}
                            decimals={2}
                            ariaLabel={`${t.openingN.replace("{n}", String(i + 1))} ${common.width}`}
                          />
                        </LabeledRow>
                        <LabeledRow label={common.height} compact error={errors.openings?.[i]?.height}>
                          <QuantityInput
                            value={op.height}
                            onChange={(q) => patchOpening(i, { height: q })}
                            units={LENGTH_UNITS}
                            min={0.1}
                            max={10}
                            step={0.1}
                            decimals={2}
                            ariaLabel={`${t.openingN.replace("{n}", String(i + 1))} ${common.height}`}
                          />
                        </LabeledRow>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </fieldset>
        ) : (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">{t.totalVol}</legend>
            <LabeledRow label={common.volume} error={errors.volume}>
              <QuantityInput
                value={state.volume}
                onChange={(q) => set("volume", q)}
                units={VOLUME_UNITS}
                min={0.1}
                max={500}
                step={0.1}
                decimals={2}
                ariaLabel={t.volAria}
              />
            </LabeledRow>
          </fieldset>
        )}

        {state.useCustom ? (
          <fieldset className="space-y-4 rounded border border-black/10 p-4 dark:border-white/10">
            <legend className="px-1 text-sm font-semibold">{cCommon.customParams}</legend>

            <LabeledRow label={t.mortarThickness}>
              <QuantityInput
                value={state.customMortarThickness}
                onChange={(q) => set("customMortarThickness", q)}
                units={LENGTH_UNITS}
                min={1}
                max={30}
                step={1}
                decimals={0}
                ariaLabel={t.mortarThicknessAria}
              />
            </LabeledRow>

            <LabeledRow label={t.mortarRatio}>
              <input
                value={state.customMortarRatio}
                onChange={(e) => set("customMortarRatio", e.target.value)}
                placeholder="1:6"
                className="w-24 rounded border border-black/15 bg-white px-2 py-1.5 text-right font-mono text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
              />
            </LabeledRow>

            <LabeledRow label={t.brickWastage}>
              <NumberSliderInput
                value={Number(state.customWastagePercent)}
                onChange={(n) => set("customWastagePercent", String(n))}
                min={0}
                max={20}
                step={0.5}
                decimals={1}
                suffix="%"
                ariaLabel={t.brickWastageAria}
              />
            </LabeledRow>

            <LabeledRow label={t.mortarWastage}>
              <NumberSliderInput
                value={Number(state.customMortarWastagePercent)}
                onChange={(n) => set("customMortarWastagePercent", String(n))}
                min={0}
                max={40}
                step={1}
                decimals={0}
                suffix="%"
                ariaLabel={t.mortarWastageAria}
              />
            </LabeledRow>

            <LabeledRow label={t.dtw}>
              <NumberSliderInput
                value={Number(state.customMortarDryToWetFactor)}
                onChange={(n) => set("customMortarDryToWetFactor", String(n))}
                min={1}
                max={1.6}
                step={0.01}
                decimals={2}
                ariaLabel={t.dtwAria}
              />
            </LabeledRow>

            <div className="border-t border-black/10 pt-3 dark:border-white/10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
                {t.brickSize}
              </p>
              <div className="space-y-2">
                <LabeledRow label={common.length} compact>
                  <QuantityInput
                    value={state.customBrickL}
                    onChange={(q) => set("customBrickL", q)}
                    units={LENGTH_UNITS}
                    min={50}
                    max={800}
                    step={5}
                    decimals={0}
                    ariaLabel={t.customBrickLen}
                  />
                </LabeledRow>
                <LabeledRow label={common.width} compact>
                  <QuantityInput
                    value={state.customBrickW}
                    onChange={(q) => set("customBrickW", q)}
                    units={LENGTH_UNITS}
                    min={50}
                    max={400}
                    step={5}
                    decimals={0}
                    ariaLabel={t.customBrickWid}
                  />
                </LabeledRow>
                <LabeledRow label={common.height} compact>
                  <QuantityInput
                    value={state.customBrickH}
                    onChange={(q) => set("customBrickH", q)}
                    units={LENGTH_UNITS}
                    min={50}
                    max={400}
                    step={5}
                    decimals={0}
                    ariaLabel={t.customBrickHt}
                  />
                </LabeledRow>
              </div>
            </div>
          </fieldset>
        ) : null}

        <div className="space-y-3">
          {errCode ? (
            <div
              role="alert"
              className="rounded border border-red-500/40 bg-red-500/[.06] px-4 py-3 text-sm text-red-700 dark:text-red-300"
            >
              <p className="font-semibold">{errCode.replaceAll("_", " ")}</p>
              <p>{errMsg}</p>
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={isPending || hasErrors} size="md">
              {isPending ? common.calculating : common.calculate}
            </Button>
            {hasErrors ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                {common.fixHighlighted}
              </p>
            ) : null}
          </div>
        </div>
      </form>

      <aside aria-live="polite" className="md:sticky md:top-6 md:self-start">
        {result?.ok ? (
          <>
            <BrickResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="brick"
                request={savedRequest as unknown as Record<string, unknown>}
                result={result.data as unknown as Record<string, unknown>}
              />
            </div>
          </>
        ) : (
          <div className="rounded border border-dashed border-black/15 p-6 text-sm text-black/60 dark:border-white/20 dark:text-white/60">
            {isPending ? common.calculating : cCommon.fillForm}
          </div>
        )}
      </aside>
    </div>
  );
}

function LabeledRow({
  label,
  compact,
  error,
  children,
}: {
  label: string;
  compact?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`grid gap-2 ${compact ? "sm:grid-cols-[7rem_1fr]" : "sm:grid-cols-[9rem_1fr]"} sm:items-start`}
    >
      <label className="pt-2 text-sm text-black/70 dark:text-white/70">{label}</label>
      <div>
        {children}
        {error ? (
          <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>
  );
}
