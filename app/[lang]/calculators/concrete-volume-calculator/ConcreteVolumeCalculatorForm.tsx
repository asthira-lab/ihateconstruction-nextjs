"use client";

// Client-side form for the concrete-volume calculator. Owns the input state,
// runs local validation, calls the server action, and renders the result.

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { ConcreteVolumeResultCard } from "@/components/calculators/concrete-volume/ResultCard";
import { BlockGroup } from "@/components/calculators/ui/BlockGroup";
import { VariableRow } from "@/components/calculators/ui/VariableRow";
import { ActionPanel } from "@/components/calculators/ui/ActionPanel";
import { FeedbackBar } from "@/components/calculators/ui/FeedbackBar";
import type {
  ConcreteVolumeActionResult,
  ConcreteVolumeRequest,
  LengthQuantity,
  Shape,
} from "@/features/calculators/concrete-volume";
import { lengthToMeters } from "@/features/calculators/concrete-volume/units";
import { submitConcreteVolumeCalculation } from "./actions";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const LENGTH_UNITS = ["m", "ft", "cm", "mm", "in"] as const;
const SHAPES: readonly Shape[] = ["rect", "cylinder"] as const;

type ConcreteVolumeFormDict = Dictionary["calculators"]["concrete-volume"]["form"];

function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

interface FormState {
  shape: Shape;
  length: LengthQuantity;
  width: LengthQuantity;
  thickness: LengthQuantity;
  diameter: LengthQuantity;
  wastagePercent: string;
}

function makeInitialState(): FormState {
  return {
    shape: "rect",
    length: { value: "6", unit: "m" },
    width: { value: "4", unit: "m" },
    thickness: { value: "0.15", unit: "m" },
    diameter: { value: "0.3", unit: "m" },
    wastagePercent: "5",
  };
}

interface FormErrors {
  length?: string;
  width?: string;
  thickness?: string;
  diameter?: string;
  wastagePercent?: string;
}

function validateForm(state: FormState, e: ConcreteVolumeFormDict["errors"]): FormErrors {
  const errors: FormErrors = {};

  const wastage = parseNum(state.wastagePercent);
  if (!Number.isFinite(wastage) || wastage < 0 || wastage > 50) {
    errors.wastagePercent = e.wastageRange;
  }

  if (state.shape === "rect") {
    const lenM = lengthToMeters(state.length);
    const widM = lengthToMeters(state.width);
    const thkM = lengthToMeters(state.thickness);

    if (!Number.isFinite(lenM) || lenM <= 0) errors.length = e.lenMin;
    else if (lenM > 200) errors.length = e.lenMax;

    if (!Number.isFinite(widM) || widM <= 0) errors.width = e.widMin;
    else if (widM > 200) errors.width = e.widMax;

    if (!Number.isFinite(thkM) || thkM <= 0) errors.thickness = e.thkMin;
    else if (thkM > 5) errors.thickness = e.thkMax;
  } else {
    const diaM = lengthToMeters(state.diameter);
    const thkM = lengthToMeters(state.thickness);

    if (!Number.isFinite(diaM) || diaM <= 0) errors.diameter = e.diaMin;
    else if (diaM > 10) errors.diameter = e.diaMax;

    if (!Number.isFinite(thkM) || thkM <= 0) errors.thickness = e.thkMin;
    else if (thkM > 5) errors.thickness = e.thkMax;
  }

  return errors;
}

function toRequest(state: FormState): ConcreteVolumeRequest {
  return {
    shape: state.shape,
    length: state.length,
    width: state.width,
    thickness: state.thickness,
    diameter: state.diameter,
    wastagePercent: state.wastagePercent,
  };
}

interface ConcreteVolumeCalculatorFormProps {
  t: ConcreteVolumeFormDict;
  common: Dictionary["common"];
  cCommon: Dictionary["calculators"]["common"];
}

export function ConcreteVolumeCalculatorForm({ t, common, cCommon }: ConcreteVolumeCalculatorFormProps) {
  const [state, setState] = useState<FormState>(makeInitialState);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const errors = useMemo(() => validateForm(state, t.errors), [state, t.errors]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<ConcreteVolumeActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<ConcreteVolumeRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (req: ConcreteVolumeRequest) =>
    startTransition(async () => {
      const res = await submitConcreteVolumeCalculation(req);
      setResult(res);
      setSavedRequest(res.ok ? req : null);
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;
    run(toRequest(state));
  };

  const onReload = () => {
    if (hasErrors) return;
    run(toRequest(state));
  };

  const onClear = () => {
    setState(makeInitialState());
    setResult(null);
    setSavedRequest(null);
  };

  const errCode = result && !result.ok ? result.error.code : null;
  const errMsg = result && !result.ok ? result.error.message : null;

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <BlockGroup title={t.section1}>
          <div className="space-y-4">
            <VariableRow label={t.shape} hint={t.shapeHint}>
              <select
                value={state.shape}
                onChange={(e) => set("shape", e.target.value as Shape)}
                aria-label={t.shape}
                className="w-full rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
              >
                {SHAPES.map((s) => (
                  <option key={s} value={s} className="capitalize">
                    {t[`shape${s === "rect" ? "Rect" : "Cylinder"}`]}
                  </option>
                ))}
              </select>
            </VariableRow>
          </div>
        </BlockGroup>

        {state.shape === "rect" ? (
          <BlockGroup title={t.section2}>
            <div className="space-y-4">
              <VariableRow label={common.length} error={errors.length}>
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
              </VariableRow>
              <VariableRow label={common.width} error={errors.width}>
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
              </VariableRow>
              <VariableRow label={t.thickness} error={errors.thickness}>
                <QuantityInput
                  value={state.thickness}
                  onChange={(q) => set("thickness", q)}
                  units={LENGTH_UNITS}
                  min={0.05}
                  max={5}
                  step={0.05}
                  decimals={2}
                  ariaLabel={t.thkAria}
                />
              </VariableRow>
              <p className="text-xs text-black/60 dark:text-white/60">{t.rectHint}</p>
            </div>
          </BlockGroup>
        ) : (
          <BlockGroup title={t.section2}>
            <div className="space-y-4">
              <VariableRow label={t.diameter} error={errors.diameter}>
                <QuantityInput
                  value={state.diameter}
                  onChange={(q) => set("diameter", q)}
                  units={LENGTH_UNITS}
                  min={0.05}
                  max={10}
                  step={0.05}
                  decimals={2}
                  ariaLabel={t.diaAria}
                />
              </VariableRow>
              <VariableRow label={t.depth} error={errors.thickness}>
                <QuantityInput
                  value={state.thickness}
                  onChange={(q) => set("thickness", q)}
                  units={LENGTH_UNITS}
                  min={0.05}
                  max={5}
                  step={0.05}
                  decimals={2}
                  ariaLabel={t.thkAria}
                />
              </VariableRow>
              <p className="text-xs text-black/60 dark:text-white/60">{t.cylHint}</p>
            </div>
          </BlockGroup>
        )}

        <BlockGroup title={t.section3}>
          <div className="space-y-4">
            <VariableRow label={t.wastage} error={errors.wastagePercent}>
              <NumberSliderInput
                value={Number(state.wastagePercent)}
                onChange={(n) => set("wastagePercent", String(n))}
                min={0}
                max={50}
                step={0.5}
                decimals={1}
                suffix="%"
                ariaLabel={t.wastageAria}
              />
            </VariableRow>
            <p className="text-xs text-black/60 dark:text-white/60">{t.examples.fill1}</p>
          </div>
        </BlockGroup>

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

      <div aria-live="polite">
        {result?.ok ? (
          <>
            <ConcreteVolumeResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="concrete-volume"
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
      </div>

      <ActionPanel
        reloadLabel={cCommon.reload}
        clearLabel={cCommon.clearAll}
        onReload={onReload}
        onClear={onClear}
      />

      <FeedbackBar
        question={cCommon.didWeSolve}
        yesLabel={common.yes}
        noLabel={common.no}
      />
    </div>
  );
}