"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { RebarResultCard } from "@/components/calculators/rebar/ResultCard";
import type {
  LengthQuantity,
  Member,
  RebarActionResult,
  RebarRequest,
} from "@/features/calculators/rebar";
import { COMMON_DIAMETERS_MM } from "@/features/calculators/rebar";
import { lengthToMeters } from "@/features/calculators/rebar/units";
import { submitRebarCalculation } from "./actions";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const LENGTH_UNITS = ["m", "ft", "cm", "mm", "in"] as const;
const SPACING_UNITS = ["mm", "cm", "in", "m"] as const;
const MEMBERS: readonly Member[] = ["slab", "footing", "wall", "foundation"] as const;

type RebarFormDict = Dictionary["calculators"]["rebar"]["form"];

function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

interface FormState {
  member: Member;
  length: LengthQuantity;
  width: LengthQuantity;
  spacing: LengthQuantity;
  edgeSpacing: LengthQuantity;
  barDiameter: string;
  barLength: LengthQuantity;
  wastagePercent: string;
}

function makeInitialState(): FormState {
  return {
    member: "slab",
    length: { value: "6", unit: "m" },
    width: { value: "4", unit: "m" },
    spacing: { value: "150", unit: "mm" },
    edgeSpacing: { value: "75", unit: "mm" },
    barDiameter: "12",
    barLength: { value: "12", unit: "m" },
    wastagePercent: "3",
  };
}

interface FormErrors {
  length?: string;
  width?: string;
  spacing?: string;
  edgeSpacing?: string;
  barLength?: string;
}

function validateForm(state: FormState, e: RebarFormDict["errors"]): FormErrors {
  const errors: FormErrors = {};

  const lenM = lengthToMeters(state.length);
  const widM = lengthToMeters(state.width);
  const spM = lengthToMeters(state.spacing);
  const edgeM = lengthToMeters(state.edgeSpacing);
  const barLenM = lengthToMeters(state.barLength);
  const wastage = parseNum(state.wastagePercent);

  if (!Number.isFinite(lenM) || lenM <= 0) errors.length = e.lenMin;
  else if (lenM > 200) errors.length = e.lenMax;

  if (!Number.isFinite(widM) || widM <= 0) errors.width = e.widMin;
  else if (widM > 200) errors.width = e.widMax;

  if (!Number.isFinite(spM) || spM <= 0) errors.spacing = e.spMin;
  else if (spM > 2) errors.spacing = e.spMax;

  if (!Number.isFinite(edgeM) || edgeM < 0) errors.edgeSpacing = e.edgeMin;
  else if (
    Number.isFinite(lenM) &&
    Number.isFinite(widM) &&
    edgeM >= Math.min(lenM, widM) / 2
  )
    errors.edgeSpacing = e.edgeMax;

  if (!Number.isFinite(barLenM) || barLenM <= 0) errors.barLength = e.barLenMin;
  else if (barLenM > 60) errors.barLength = e.barLenMax;

  if (!Number.isFinite(wastage) || wastage < 0 || wastage > 20) {
    errors.spacing = errors.spacing ?? e.wastageRange;
  }

  return errors;
}

function toRebarRequest(state: FormState): RebarRequest {
  return {
    member: state.member,
    length: state.length,
    width: state.width,
    spacing: state.spacing,
    edgeSpacing: state.edgeSpacing,
    barDiameter: { value: state.barDiameter, unit: "mm" },
    barLength: state.barLength,
    wastagePercent: state.wastagePercent,
  };
}

interface RebarCalculatorFormProps {
  t: RebarFormDict;
  common: Dictionary["common"];
  cCommon: Dictionary["calculators"]["common"];
}

export function RebarCalculatorForm({ t, common, cCommon }: RebarCalculatorFormProps) {
  const [state, setState] = useState<FormState>(makeInitialState);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const errors = useMemo(() => validateForm(state, t.errors), [state, t.errors]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<RebarActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<RebarRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;
    const req = toRebarRequest(state);
    startTransition(async () => {
      const res = await submitRebarCalculation(req);
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
        <fieldset className="space-y-4 rounded border border-black/10 p-4 dark:border-white/10">
          <legend className="px-1 text-sm font-semibold">{t.section1}</legend>
          <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
            <LabeledRow label={t.member} hint={t.memberHint}>
              <select
                value={state.member}
                onChange={(e) => set("member", e.target.value as Member)}
                aria-label={t.member}
                className="w-full rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
              >
                {MEMBERS.map((m) => (
                  <option key={m} value={m} className="capitalize">
                    {m}
                  </option>
                ))}
              </select>
            </LabeledRow>
            <div className="hidden sm:block" />
            <LabeledRow label={common.length} error={errors.length}>
              <QuantityInput
                value={state.length}
                onChange={(q) => set("length", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={200}
                step={0.1}
                decimals={2}
                ariaLabel={t.lenAria}
              />
            </LabeledRow>
            <LabeledRow label={common.width} error={errors.width}>
              <QuantityInput
                value={state.width}
                onChange={(q) => set("width", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={200}
                step={0.1}
                decimals={2}
                ariaLabel={t.widAria}
              />
            </LabeledRow>
          </div>
          <p className="text-xs text-black/60 dark:text-white/60">{t.dimHint}</p>
        </fieldset>

        <fieldset className="space-y-4 rounded border border-black/10 p-4 dark:border-white/10">
          <legend className="px-1 text-sm font-semibold">{t.section2}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledRow label={t.spacing} error={errors.spacing}>
              <QuantityInput
                value={state.spacing}
                onChange={(q) => set("spacing", q)}
                units={SPACING_UNITS}
                min={25}
                max={2000}
                step={5}
                decimals={0}
                ariaLabel={t.spacingAria}
              />
            </LabeledRow>
            <LabeledRow label={t.edgeSpacing} error={errors.edgeSpacing}>
              <QuantityInput
                value={state.edgeSpacing}
                onChange={(q) => set("edgeSpacing", q)}
                units={SPACING_UNITS}
                min={0}
                max={500}
                step={5}
                decimals={0}
                ariaLabel={t.edgeAria}
              />
            </LabeledRow>
          </div>
        </fieldset>

        <fieldset className="space-y-4 rounded border border-black/10 p-4 dark:border-white/10">
          <legend className="px-1 text-sm font-semibold">{t.section3}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <LabeledRow label={t.barDiameter}>
              <select
                value={state.barDiameter}
                onChange={(e) => set("barDiameter", e.target.value)}
                aria-label={t.barDiameter}
                className="w-full rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
              >
                {COMMON_DIAMETERS_MM.map((d) => (
                  <option key={d} value={d}>
                    {d} mm
                  </option>
                ))}
              </select>
            </LabeledRow>
            <LabeledRow label={t.barLength} error={errors.barLength}>
              <QuantityInput
                value={state.barLength}
                onChange={(q) => set("barLength", q)}
                units={LENGTH_UNITS}
                min={1}
                max={60}
                step={1}
                decimals={1}
                ariaLabel={t.barLengthAria}
              />
            </LabeledRow>
          </div>
          <fieldset className="space-y-3 rounded border border-black/10 p-4 dark:border-white/10">
            <legend className="px-1 text-sm font-semibold">{cCommon.customParams}</legend>
            <LabeledRow label={t.wastage}>
              <NumberSliderInput
                value={Number(state.wastagePercent)}
                onChange={(n) => set("wastagePercent", String(n))}
                min={0}
                max={20}
                step={0.5}
                decimals={1}
                suffix="%"
                ariaLabel={t.wastageAria}
              />
            </LabeledRow>
            <p className="text-xs text-black/60 dark:text-white/60">{t.examples.fill1}</p>
          </fieldset>
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
            <RebarResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="rebar"
                request={savedRequest as unknown as Record<string, unknown>}
                result={result.data as unknown as Record<string, unknown>}
              />
            </div>
          </>
        ) : (
          <div className="rounded border border-dashed border-black/15 p-6 text-sm text-black/60 dark:border-white/20 dark:text-white/60">
            {isPending ? common.calculating : t.placeholder}
          </div>
        )}
      </aside>
    </div>
  );
}

function LabeledRow({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div>
        <label className="text-sm text-black/70 dark:text-white/70">{label}</label>
        {hint ? (
          <p className="mt-0.5 text-[11px] text-black/50 dark:text-white/50">{hint}</p>
        ) : null}
      </div>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}