"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { TileResultCard } from "@/components/calculators/tile/ResultCard";
import type {
  AdhesiveMethod,
  AreaQuantity,
  ExcludeArea,
  LengthQuantity,
  SurfaceType,
  TileActionResult,
  TileRequest,
  TileStandardsResponse,
} from "@/features/calculators/tile";
import { lengthToMeters } from "@/features/calculators/tile/units";
import { submitTileCalculation } from "./actions";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const LENGTH_UNITS = ["mm", "cm", "m", "ft", "in"] as const;
const AREA_UNITS = ["sqm", "sqft"] as const;

type TileFormDict = Dictionary["calculators"]["tile"]["form"];

interface TileCalculatorFormProps {
  initialStandards: TileStandardsResponse;
  t: TileFormDict;
  common: Dictionary["common"];
  cCommon: Dictionary["calculators"]["common"];
}

interface FormState {
  surfaceType: SurfaceType;
  surfaceLength: LengthQuantity;
  surfaceWidth: LengthQuantity;
  tileLength: LengthQuantity;
  tileWidth: LengthQuantity;
  excludeAreas: ExcludeArea[];
  presetId: string;
  useCustom: boolean;
  customWastagePercent: string;
  customAdhesiveMethod: AdhesiveMethod;
  customMortarBedThickness: LengthQuantity;
  customMortarRatio: string;
  customThinsetCoverage: AreaQuantity;
  customGroutWidth: LengthQuantity;
  customGroutDepth: LengthQuantity;
  customTileThickness: LengthQuantity;
  customGroutDepthTouched: boolean;
}

function seedCustomFromPreset(
  standards: TileStandardsResponse,
  presetId: string,
): Pick<
  FormState,
  | "customWastagePercent"
  | "customAdhesiveMethod"
  | "customMortarBedThickness"
  | "customMortarRatio"
  | "customThinsetCoverage"
  | "customGroutWidth"
  | "customGroutDepth"
  | "customTileThickness"
> {
  const preset =
    standards.presets.find((p) => p.id === presetId) ?? standards.presets[0]!;
  const p = preset.parameters;
  return {
    customWastagePercent: p.wastagePercent,
    customAdhesiveMethod: p.adhesiveMethod,
    customMortarBedThickness: p.mortarBedThickness,
    customMortarRatio: p.mortarRatio,
    customThinsetCoverage: p.thinsetCoverage,
    customGroutWidth: p.groutWidth,
    customGroutDepth: p.groutDepth,
    customTileThickness: p.tileThickness,
  };
}

function makeInitialState(standards: TileStandardsResponse): FormState {
  return {
    surfaceType: "floor",
    surfaceLength: { value: "5.0", unit: "m" },
    surfaceWidth: { value: "3.6", unit: "m" },
    tileLength: { value: "600", unit: "mm" },
    tileWidth: { value: "600", unit: "mm" },
    excludeAreas: [],
    presetId: standards.defaultPreset,
    useCustom: false,
    customGroutDepthTouched: false,
    ...seedCustomFromPreset(standards, standards.defaultPreset),
  };
}

interface FormErrors {
  surfaceLength?: string;
  surfaceWidth?: string;
  tileLength?: string;
  tileWidth?: string;
  excludeAreas?: Array<{ length?: string; width?: string } | undefined>;
  excludeAreasTotal?: string;
  customThinsetCoverage?: string;
  customMortarRatio?: string;
  customMortarBedThickness?: string;
}

function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function validateForm(state: FormState, e: TileFormDict["errors"]): FormErrors {
  const errors: FormErrors = {};

  const sLen = lengthToMeters(state.surfaceLength);
  const sWid = lengthToMeters(state.surfaceWidth);
  const tLen = lengthToMeters(state.tileLength);
  const tWid = lengthToMeters(state.tileWidth);

  if (!Number.isFinite(sLen) || sLen <= 0) errors.surfaceLength = e.lenMin;
  else if (sLen > 500) errors.surfaceLength = e.lenMax;
  if (!Number.isFinite(sWid) || sWid <= 0) errors.surfaceWidth = e.widMin;
  else if (sWid > 500) errors.surfaceWidth = e.widMax;
  if (!Number.isFinite(tLen) || tLen <= 0) errors.tileLength = e.tileLen;
  if (!Number.isFinite(tWid) || tWid <= 0) errors.tileWidth = e.tileWid;

  const excludeErrors: Array<{ length?: string; width?: string } | undefined> = [];
  let excludedSum = 0;
  let anyExcludeError = false;
  state.excludeAreas.forEach((ex, i) => {
    const eL = lengthToMeters(ex.length);
    const eW = lengthToMeters(ex.width);
    const err: { length?: string; width?: string } = {};
    if (!Number.isFinite(eL) || eL <= 0) err.length = e.exLen;
    if (!Number.isFinite(eW) || eW <= 0) err.width = e.exWid;
    if (Object.keys(err).length > 0) {
      excludeErrors[i] = err;
      anyExcludeError = true;
    }
    if (Number.isFinite(eL) && Number.isFinite(eW)) excludedSum += eL * eW;
  });
  if (anyExcludeError) errors.excludeAreas = excludeErrors;

  const grossArea = Number.isFinite(sLen) && Number.isFinite(sWid) ? sLen * sWid : NaN;
  if (Number.isFinite(grossArea) && excludedSum >= grossArea) {
    errors.excludeAreasTotal = e.exAll;
  }

  if (state.useCustom) {
    if (state.customAdhesiveMethod === "thin-set") {
      const cov = parseNum(state.customThinsetCoverage.value);
      if (!Number.isFinite(cov) || cov <= 0) {
        errors.customThinsetCoverage = e.coverage;
      }
    } else {
      const th = lengthToMeters(state.customMortarBedThickness);
      if (!Number.isFinite(th) || th <= 0) {
        errors.customMortarBedThickness = e.thickness;
      }
      if (!/^\d+:\d+$/.test(state.customMortarRatio.trim())) {
        errors.customMortarRatio = e.ratio;
      }
    }
  }

  return errors;
}

function toTileRequest(state: FormState): TileRequest {
  return {
    surface: {
      type: state.surfaceType,
      length: state.surfaceLength,
      width: state.surfaceWidth,
    },
    excludeAreas: state.excludeAreas,
    tile: { length: state.tileLength, width: state.tileWidth },
    standard: state.useCustom
      ? {
          preset: state.presetId,
          custom: {
            wastagePercent: state.customWastagePercent,
            adhesiveMethod: state.customAdhesiveMethod,
            mortarBedThickness: state.customMortarBedThickness,
            mortarRatio: state.customMortarRatio,
            thinsetCoverage: state.customThinsetCoverage,
            groutWidth: state.customGroutWidth,
            ...(state.customGroutDepthTouched
              ? { groutDepth: state.customGroutDepth }
              : {}),
            tileThickness: state.customTileThickness,
          },
        }
      : { preset: state.presetId },
  };
}

export function TileCalculatorForm({
  initialStandards,
  t,
  common,
  cCommon,
}: TileCalculatorFormProps) {
  const [state, setState] = useState<FormState>(() => makeInitialState(initialStandards));
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const errors = useMemo(() => validateForm(state, t.errors), [state, t.errors]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<TileActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<TileRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const changePreset = (presetId: string) => {
    setState((s) => ({
      ...s,
      presetId,
      customGroutDepthTouched: false,
      ...seedCustomFromPreset(initialStandards, presetId),
    }));
  };

  const addExclude = () =>
    set("excludeAreas", [
      ...state.excludeAreas,
      {
        label: t.cutoutN.replace("{n}", String(state.excludeAreas.length + 1)),
        length: { value: "0.4", unit: "m" },
        width: { value: "0.4", unit: "m" },
      },
    ]);
  const removeExclude = (i: number) =>
    set(
      "excludeAreas",
      state.excludeAreas.filter((_, idx) => idx !== i),
    );
  const patchExclude = (i: number, patch: Partial<ExcludeArea>) =>
    set(
      "excludeAreas",
      state.excludeAreas.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)),
    );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;
    const req = toTileRequest(state);
    startTransition(async () => {
      const res = await submitTileCalculation(req);
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
          <legend className="text-sm font-semibold">{t.surface}</legend>
          <div className="flex gap-2">
            {(["floor", "wall"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => set("surfaceType", s)}
                aria-pressed={state.surfaceType === s}
                className={`flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors ${
                  state.surfaceType === s
                    ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                    : "border-black/15 bg-white text-black hover:bg-black/[.04] dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/[.06]"
                }`}
              >
                {s === "floor" ? t.modes.floor : t.modes.wall}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold">
            {state.surfaceType === "floor" ? t.floorDims : t.wallDims}
          </legend>
          <LabeledRow label={common.length} error={errors.surfaceLength}>
            <QuantityInput
              value={state.surfaceLength}
              onChange={(q) => set("surfaceLength", q)}
              units={LENGTH_UNITS}
              min={0.1}
              max={500}
              step={0.1}
              decimals={2}
              ariaLabel={common.length}
            />
          </LabeledRow>
          <LabeledRow
            label={state.surfaceType === "wall" ? common.height : common.width}
            error={errors.surfaceWidth}
          >
            <QuantityInput
              value={state.surfaceWidth}
              onChange={(q) => set("surfaceWidth", q)}
              units={LENGTH_UNITS}
              min={0.1}
              max={500}
              step={0.1}
              decimals={2}
              ariaLabel={common.width}
            />
          </LabeledRow>

          <div className="space-y-2 border-t border-black/10 pt-4 dark:border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">{t.excluded}</span>
              <Button variant="secondary" size="sm" onClick={addExclude} type="button">
                {t.addEx}
              </Button>
            </div>
            {state.excludeAreas.length === 0 ? (
              <p className="text-xs text-black/50 dark:text-white/50">{t.noEx}</p>
            ) : (
              <div className="space-y-4">
                {errors.excludeAreasTotal ? (
                  <p role="alert" className="text-xs text-red-600 dark:text-red-400">
                    {errors.excludeAreasTotal}
                  </p>
                ) : null}
                {state.excludeAreas.map((ex, i) => {
                  const idx = String(i + 1);
                  return (
                    <div key={i} className="rounded border border-black/10 p-3 dark:border-white/10">
                      <div className="mb-2 flex items-center justify-between">
                        <input
                          value={ex.label ?? ""}
                          onChange={(e) => patchExclude(i, { label: e.target.value })}
                          placeholder={t.labelPh}
                          className="w-40 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm focus:border-black/15 focus:outline-none dark:focus:border-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeExclude(i)}
                          className="text-xs text-red-600 hover:underline dark:text-red-400"
                          aria-label={`${common.remove} ${t.cutoutN.replace("{n}", idx)}`}
                        >
                          {common.remove}
                        </button>
                      </div>
                      <div className="space-y-2">
                        <LabeledRow label={common.length} compact error={errors.excludeAreas?.[i]?.length}>
                          <QuantityInput
                            value={ex.length}
                            onChange={(q) => patchExclude(i, { length: q })}
                            units={LENGTH_UNITS}
                            min={0.01}
                            max={100}
                            step={0.05}
                            decimals={2}
                            ariaLabel={`${t.cutoutN.replace("{n}", idx)} ${common.length}`}
                          />
                        </LabeledRow>
                        <LabeledRow label={common.width} compact error={errors.excludeAreas?.[i]?.width}>
                          <QuantityInput
                            value={ex.width}
                            onChange={(q) => patchExclude(i, { width: q })}
                            units={LENGTH_UNITS}
                            min={0.01}
                            max={100}
                            step={0.05}
                            decimals={2}
                            ariaLabel={`${t.cutoutN.replace("{n}", idx)} ${common.width}`}
                          />
                        </LabeledRow>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold">{t.tileSize}</legend>
          <LabeledRow label={common.length} error={errors.tileLength}>
            <QuantityInput
              value={state.tileLength}
              onChange={(q) => set("tileLength", q)}
              units={LENGTH_UNITS}
              min={10}
              max={2000}
              step={10}
              decimals={0}
              ariaLabel={common.length}
            />
          </LabeledRow>
          <LabeledRow label={common.width} error={errors.tileWidth}>
            <QuantityInput
              value={state.tileWidth}
              onChange={(q) => set("tileWidth", q)}
              units={LENGTH_UNITS}
              min={10}
              max={2000}
              step={10}
              decimals={0}
              ariaLabel={common.width}
            />
          </LabeledRow>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold">{t.standard}</legend>
          <LabeledRow label={common.preset}>
            <select
              value={state.presetId}
              onChange={(e) => changePreset(e.target.value)}
              className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
            >
              {initialStandards.presets.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
          </LabeledRow>
          <p className="text-xs text-black/60 dark:text-white/60">
            {initialStandards.presets.find((p) => p.id === state.presetId)?.description}
          </p>

          <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm">
            <input
              type="checkbox"
              checked={state.useCustom}
              onChange={(e) => set("useCustom", e.target.checked)}
              className="accent-black dark:accent-white"
            />
            {cCommon.customParams}
          </label>

          {state.useCustom ? (
            <div className="space-y-3 rounded border border-black/10 p-3 dark:border-white/10">
              <LabeledRow label={t.wastage} compact>
                <NumberSliderInput
                  value={Number(state.customWastagePercent)}
                  onChange={(n) => set("customWastagePercent", String(n))}
                  min={0}
                  max={30}
                  step={0.5}
                  decimals={1}
                  suffix="%"
                  ariaLabel={t.wastage}
                />
              </LabeledRow>

              <LabeledRow label={t.method} compact>
                <div className="flex gap-2">
                  {(["thin-set", "mortar-bed"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set("customAdhesiveMethod", m)}
                      aria-pressed={state.customAdhesiveMethod === m}
                      className={`flex-1 rounded border px-2 py-1.5 text-xs font-medium transition-colors ${
                        state.customAdhesiveMethod === m
                          ? "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black"
                          : "border-black/15 bg-white text-black hover:bg-black/[.04] dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/[.06]"
                      }`}
                    >
                      {m === "thin-set" ? t.methods.thinset : t.methods.bed}
                    </button>
                  ))}
                </div>
              </LabeledRow>

              {state.customAdhesiveMethod === "thin-set" ? (
                <LabeledRow label={t.coveragePerKg} compact error={errors.customThinsetCoverage}>
                  <QuantityInput
                    value={state.customThinsetCoverage}
                    onChange={(q) => set("customThinsetCoverage", q)}
                    units={AREA_UNITS}
                    min={0.5}
                    max={10}
                    step={0.1}
                    decimals={1}
                    ariaLabel={t.coveragePerKg}
                  />
                </LabeledRow>
              ) : (
                <>
                  <LabeledRow label={t.bedThickness} compact error={errors.customMortarBedThickness}>
                    <QuantityInput
                      value={state.customMortarBedThickness}
                      onChange={(q) => set("customMortarBedThickness", q)}
                      units={LENGTH_UNITS}
                      min={5}
                      max={100}
                      step={1}
                      decimals={0}
                      ariaLabel={t.bedThickness}
                    />
                  </LabeledRow>
                  <LabeledRow label={t.mortarRatio} compact error={errors.customMortarRatio}>
                    <input
                      value={state.customMortarRatio}
                      onChange={(e) => set("customMortarRatio", e.target.value)}
                      placeholder="1:4"
                      className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
                      aria-label={t.mortarRatio}
                    />
                  </LabeledRow>
                </>
              )}

              <LabeledRow label={t.groutWidth} compact>
                <QuantityInput
                  value={state.customGroutWidth}
                  onChange={(q) => set("customGroutWidth", q)}
                  units={LENGTH_UNITS}
                  min={1}
                  max={30}
                  step={0.5}
                  decimals={1}
                  ariaLabel={t.groutWidth}
                />
              </LabeledRow>
              <LabeledRow label={t.groutDepth} compact>
                <QuantityInput
                  value={
                    state.customGroutDepthTouched
                      ? state.customGroutDepth
                      : state.customTileThickness
                  }
                  onChange={(q) =>
                    setState((s) => ({
                      ...s,
                      customGroutDepth: q,
                      customGroutDepthTouched: true,
                    }))
                  }
                  units={LENGTH_UNITS}
                  min={1}
                  max={30}
                  step={0.5}
                  decimals={1}
                  ariaLabel={t.groutDepth}
                />
                {!state.customGroutDepthTouched ? (
                  <p className="mt-1 text-[11px] text-black/50 dark:text-white/50">
                    {t.groutDepthHelp}
                  </p>
                ) : null}
              </LabeledRow>
              <LabeledRow label={t.tileThickness} compact>
                <QuantityInput
                  value={state.customTileThickness}
                  onChange={(q) => set("customTileThickness", q)}
                  units={LENGTH_UNITS}
                  min={2}
                  max={30}
                  step={0.5}
                  decimals={1}
                  ariaLabel={t.tileThickness}
                />
              </LabeledRow>
            </div>
          ) : null}
        </fieldset>

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
            <TileResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="tile"
                request={savedRequest as unknown as Record<string, unknown>}
                result={result.data as unknown as Record<string, unknown>}
              />
            </div>
          </>
        ) : (
          <div className="rounded border border-dashed border-black/15 p-6 text-sm text-black/60 dark:border-white/20 dark:text-white/60">
            {isPending ? common.calculating : cCommon.fillFormTile}
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
    <div className={`grid gap-2 ${compact ? "sm:grid-cols-[7rem_1fr]" : "sm:grid-cols-[9rem_1fr]"} sm:items-start`}>
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
