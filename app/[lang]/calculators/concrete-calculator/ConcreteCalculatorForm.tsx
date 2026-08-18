"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { ConcreteResultCard } from "@/components/calculators/concrete/ResultCard";
import type {
  AggregateOutputUnit,
  CementOutputUnit,
  ConcreteActionResult,
  ConcreteRequest,
  ConcreteStandardsResponse,
  MassQuantity,
  SandOutputUnit,
  VolumeQuantity,
} from "@/features/calculators/concrete";
import { submitConcreteCalculation } from "./actions";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const VOLUME_UNITS = ["cum", "cft"] as const;
const MASS_UNITS = ["kg"] as const;
const CEMENT_UNITS: readonly CementOutputUnit[] = ["bags", "kg"];
const SAND_UNITS: readonly SandOutputUnit[] = ["cft", "cum", "kg"];
const AGGREGATE_UNITS: readonly AggregateOutputUnit[] = ["cft", "cum", "kg"];

const MIX_RATIO_PATTERN = /^\d+(\.\d+)?:\d+(\.\d+)?:\d+(\.\d+)?$/;

interface ConcreteCalculatorFormProps {
  initialStandards: ConcreteStandardsResponse;
  t: Dictionary["calculators"]["concrete"]["form"];
  common: Dictionary["common"];
  cCommon: Dictionary["calculators"]["common"];
}

interface FormState {
  presetId: string;
  useCustom: boolean;
  volume: VolumeQuantity;
  outputCement: CementOutputUnit;
  outputSand: SandOutputUnit;
  outputAggregate: AggregateOutputUnit;
  customMixRatio: string;
  customWastagePercent: string;
  customCementDensity: MassQuantity;
  customCementBagWeight: MassQuantity;
  customDryToWetFactor: string;
}

function makeInitialState(standards: ConcreteStandardsResponse): FormState {
  const defaultPreset =
    standards.presets.find((p) => p.id === standards.defaultPreset) ??
    standards.presets[0]!;
  const p = defaultPreset.parameters;
  return {
    presetId: defaultPreset.id,
    useCustom: false,
    volume: { value: "10", unit: "cum" },
    outputCement: "bags",
    outputSand: "cft",
    outputAggregate: "cft",
    customMixRatio: p.mixRatio,
    customWastagePercent: p.wastagePercent,
    customCementDensity: p.cementDensity,
    customCementBagWeight: p.cementBagWeight,
    customDryToWetFactor: p.dryToWetFactor,
  };
}

interface FormErrors {
  volume?: string;
  customMixRatio?: string;
  customWastagePercent?: string;
  customCementDensity?: string;
  customCementBagWeight?: string;
  customDryToWetFactor?: string;
}

function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function validateForm(
  state: FormState,
  e: Dictionary["calculators"]["concrete"]["form"]["errors"],
): FormErrors {
  const errors: FormErrors = {};

  const v = parseNum(state.volume.value);
  if (!Number.isFinite(v) || v <= 0) errors.volume = e.volMin;
  else if (v > 10_000) errors.volume = e.volMax;

  if (state.useCustom) {
    if (!MIX_RATIO_PATTERN.test(state.customMixRatio.trim())) {
      errors.customMixRatio = e.ratioFmt;
    } else {
      const parts = state.customMixRatio.split(":").map(Number);
      if (parts.some((p) => !Number.isFinite(p) || p <= 0)) {
        errors.customMixRatio = e.ratioPos;
      }
    }

    const w = parseNum(state.customWastagePercent);
    if (!Number.isFinite(w) || w < 0) errors.customWastagePercent = e.wastageRange;
    else if (w > 50) errors.customWastagePercent = e.wastageMax;

    const dw = parseNum(state.customDryToWetFactor);
    if (!Number.isFinite(dw) || dw <= 1) errors.customDryToWetFactor = e.dtwMin;
    else if (dw > 2) errors.customDryToWetFactor = e.dtwMax;

    const cd = parseNum(state.customCementDensity.value);
    if (!Number.isFinite(cd) || cd <= 0) errors.customCementDensity = e.density;

    const bw = parseNum(state.customCementBagWeight.value);
    if (!Number.isFinite(bw) || bw <= 0) errors.customCementBagWeight = e.bag;
  }

  return errors;
}

function toConcreteRequest(state: FormState): ConcreteRequest {
  const standard = state.useCustom
    ? {
        preset: state.presetId,
        custom: {
          mixRatio: state.customMixRatio,
          wastagePercent: state.customWastagePercent,
          cementDensity: state.customCementDensity,
          cementBagWeight: state.customCementBagWeight,
          dryToWetFactor: state.customDryToWetFactor,
        },
      }
    : { preset: state.presetId };

  return {
    volume: state.volume,
    standard,
    outputUnits: {
      cement: state.outputCement,
      sand: state.outputSand,
      aggregate: state.outputAggregate,
    },
  };
}

export function ConcreteCalculatorForm({
  initialStandards,
  t,
  common,
  cCommon,
}: ConcreteCalculatorFormProps) {
  const [state, setState] = useState<FormState>(() =>
    makeInitialState(initialStandards),
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
      customMixRatio: p.mixRatio,
      customWastagePercent: p.wastagePercent,
      customCementDensity: p.cementDensity,
      customCementBagWeight: p.cementBagWeight,
      customDryToWetFactor: p.dryToWetFactor,
    }));
  };

  const errors = useMemo(() => validateForm(state, t.errors), [state, t.errors]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<ConcreteActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<ConcreteRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;
    const req = toConcreteRequest(state);
    startTransition(async () => {
      const res = await submitConcreteCalculation(req);
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
          <legend className="text-sm font-semibold">{t.grade}</legend>
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
            {
              initialStandards.presets.find((p) => p.id === state.presetId)
                ?.description
            }
          </p>
          <label className="flex cursor-pointer items-center gap-2 pt-1 text-xs">
            <input
              type="checkbox"
              checked={state.useCustom}
              onChange={(e) => set("useCustom", e.target.checked)}
              className="accent-black dark:accent-white"
            />
            {t.customGrade}
          </label>
        </fieldset>

        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold">{t.volume}</legend>
          <LabeledRow label={t.wetVol} error={errors.volume}>
            <QuantityInput
              value={state.volume}
              onChange={(q) => set("volume", q)}
              units={VOLUME_UNITS}
              min={0.1}
              max={1000}
              step={0.1}
              decimals={2}
              ariaLabel={t.volAria}
            />
          </LabeledRow>
          <p className="text-xs text-black/50 dark:text-white/50">{t.volHelp}</p>
        </fieldset>

        <fieldset className="space-y-3">
          <legend className="text-sm font-semibold">{t.outputs}</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <UnitSelect
              label={common.cement}
              value={state.outputCement}
              onChange={(v) => set("outputCement", v as CementOutputUnit)}
              options={CEMENT_UNITS}
            />
            <UnitSelect
              label={common.sand}
              value={state.outputSand}
              onChange={(v) => set("outputSand", v as SandOutputUnit)}
              options={SAND_UNITS}
            />
            <UnitSelect
              label={common.aggregate}
              value={state.outputAggregate}
              onChange={(v) => set("outputAggregate", v as AggregateOutputUnit)}
              options={AGGREGATE_UNITS}
            />
          </div>
        </fieldset>

        {state.useCustom ? (
          <fieldset className="space-y-4 rounded border border-black/10 p-4 dark:border-white/10">
            <legend className="px-1 text-sm font-semibold">{cCommon.customParams}</legend>

            <LabeledRow label={t.ratio} error={errors.customMixRatio}>
              <input
                value={state.customMixRatio}
                onChange={(e) => set("customMixRatio", e.target.value)}
                placeholder="1:1.5:3"
                className="w-32 rounded border border-black/15 bg-white px-2 py-1.5 text-right font-mono text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
              />
            </LabeledRow>

            <LabeledRow label={t.wastage} error={errors.customWastagePercent}>
              <NumberSliderInput
                value={Number(state.customWastagePercent)}
                onChange={(n) => set("customWastagePercent", String(n))}
                min={0}
                max={50}
                step={0.5}
                decimals={1}
                suffix="%"
                ariaLabel={t.wastageAria}
              />
            </LabeledRow>

            <LabeledRow label={t.dtw} error={errors.customDryToWetFactor}>
              <NumberSliderInput
                value={Number(state.customDryToWetFactor)}
                onChange={(n) => set("customDryToWetFactor", String(n))}
                min={1.3}
                max={1.8}
                step={0.01}
                decimals={2}
                ariaLabel={t.dtwAria}
              />
            </LabeledRow>

            <LabeledRow label={t.density} error={errors.customCementDensity}>
              <QuantityInput
                value={state.customCementDensity}
                onChange={(q) => set("customCementDensity", q)}
                units={MASS_UNITS}
                min={1000}
                max={2000}
                step={10}
                decimals={0}
                ariaLabel={t.densityAria}
              />
            </LabeledRow>

            <LabeledRow label={t.bag} error={errors.customCementBagWeight}>
              <QuantityInput
                value={state.customCementBagWeight}
                onChange={(q) => set("customCementBagWeight", q)}
                units={MASS_UNITS}
                min={10}
                max={100}
                step={1}
                decimals={0}
                ariaLabel={t.bagAria}
              />
            </LabeledRow>
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
            <ConcreteResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="concrete"
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

function UnitSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="text-black/70 dark:text-white/70">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}
