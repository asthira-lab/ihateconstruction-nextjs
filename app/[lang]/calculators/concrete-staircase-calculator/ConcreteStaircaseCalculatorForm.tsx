"use client";

// Client-side form for the concrete-staircase calculator. Owns the input state,
// runs local validation, calls the server action, and renders the result.

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { ConcreteStaircaseResultCard } from "@/components/calculators/concrete-staircase/ResultCard";
import { BlockGroup } from "@/components/calculators/ui/BlockGroup";
import { VariableRow } from "@/components/calculators/ui/VariableRow";
import { ActionPanel } from "@/components/calculators/ui/ActionPanel";
import { FeedbackBar } from "@/components/calculators/ui/FeedbackBar";
import type {
  LengthQuantity,
  ConcreteStaircaseActionResult,
  ConcreteStaircaseRequest,
} from "@/features/calculators/concrete-staircase";
import { lengthToMeters } from "@/features/calculators/concrete-staircase/units";
import { submitConcreteStaircaseCalculation } from "./actions";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const LENGTH_UNITS = ["m", "ft", "cm", "mm", "in"] as const;

type ConcreteStaircaseFormDict = Dictionary["calculators"]["concrete-staircase"]["form"];

interface FormState {
  rise: LengthQuantity;
  run: LengthQuantity;
  width: LengthQuantity;
  stepCount: string;
  wastagePercent: string;
}

function makeInitialState(): FormState {
  return {
    rise: { value: "0.175", unit: "m" },
    run: { value: "0.28", unit: "m" },
    width: { value: "1", unit: "m" },
    stepCount: "12",
    wastagePercent: "5",
  };
}

interface FormErrors {
  rise?: string;
  run?: string;
  width?: string;
  stepCount?: string;
  wastagePercent?: string;
}

function validateForm(state: FormState, e: ConcreteStaircaseFormDict["errors"]): FormErrors {
  const errors: FormErrors = {};

  const wastage = parseNum(state.wastagePercent);
  if (!Number.isFinite(wastage) || wastage < 0 || wastage > 50) {
    errors.wastagePercent = e.wastageRange;
  }

  const riseM = lengthToMeters(state.rise);
  const runM = lengthToMeters(state.run);
  const widthM = lengthToMeters(state.width);

  if (!Number.isFinite(riseM) || riseM <= 0) errors.rise = e.riseMin;
  else if (riseM > 0.5) errors.rise = e.riseMax;

  if (!Number.isFinite(runM) || runM <= 0) errors.run = e.runMin;
  else if (runM > 1) errors.run = e.runMax;

  if (!Number.isFinite(widthM) || widthM <= 0) errors.width = e.widthMin;
  else if (widthM > 10) errors.width = e.widthMax;

  const steps = Number(state.stepCount);
  if (!Number.isFinite(steps) || steps < 1 || !Number.isInteger(steps)) errors.stepCount = e.stepsInvalid;
  else if (steps > 100) errors.stepCount = e.stepsMax;

  return errors;
}

function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function toRequest(state: FormState): ConcreteStaircaseRequest {
  return {
    rise: state.rise,
    run: state.run,
    width: state.width,
    stepCount: Number(state.stepCount),
    wastagePercent: state.wastagePercent,
  };
}

interface ConcreteStaircaseCalculatorFormProps {
  t: ConcreteStaircaseFormDict;
  common: Dictionary["common"];
  cCommon: Dictionary["calculators"]["common"];
}

export function ConcreteStaircaseCalculatorForm({ t, common, cCommon }: ConcreteStaircaseCalculatorFormProps) {
  const [state, setState] = useState<FormState>(makeInitialState);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const errors = useMemo(() => validateForm(state, t.errors), [state, t.errors]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<ConcreteStaircaseActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<ConcreteStaircaseRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (req: ConcreteStaircaseRequest) =>
    startTransition(async () => {
      const res = await submitConcreteStaircaseCalculation(req);
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
            <VariableRow label={t.rise} error={errors.rise}>
              <QuantityInput
                value={state.rise}
                onChange={(q) => set("rise", q)}
                units={LENGTH_UNITS}
                min={0.05}
                max={0.5}
                step={0.005}
                decimals={3}
                ariaLabel={t.riseAria}
              />
            </VariableRow>
            <VariableRow label={t.run} error={errors.run}>
              <QuantityInput
                value={state.run}
                onChange={(q) => set("run", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={1}
                step={0.01}
                decimals={2}
                ariaLabel={t.runAria}
              />
            </VariableRow>
            <VariableRow label={common.width} error={errors.width}>
              <QuantityInput
                value={state.width}
                onChange={(q) => set("width", q)}
                units={LENGTH_UNITS}
                min={0.2}
                max={10}
                step={0.1}
                decimals={2}
                ariaLabel={t.widthAria}
              />
            </VariableRow>
            <VariableRow label={t.stepCount} error={errors.stepCount}>
              <NumberSliderInput
                value={Number(state.stepCount) || 1}
                onChange={(n) => set("stepCount", String(n))}
                min={1}
                max={100}
                step={1}
                decimals={0}
                ariaLabel={t.stepsAria}
              />
            </VariableRow>
            <p className="text-xs text-black/60 dark:text-white/60">{t.dimHint}</p>
          </div>
        </BlockGroup>

        <BlockGroup title={t.section2}>
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
            <p className="text-xs text-black/60 dark:text-white/60">{t.wastageHint}</p>
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
            <ConcreteStaircaseResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="concrete-staircase"
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