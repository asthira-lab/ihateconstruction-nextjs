"use client";

// Client-side form for the concrete-foundation calculator. Owns the input
// state, runs local validation, calls the server action, and renders the result.

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { ConcreteFoundationResultCard } from "@/components/calculators/concrete-foundation/ResultCard";
import { BlockGroup } from "@/components/calculators/ui/BlockGroup";
import { VariableRow } from "@/components/calculators/ui/VariableRow";
import { ActionPanel } from "@/components/calculators/ui/ActionPanel";
import { FeedbackBar } from "@/components/calculators/ui/FeedbackBar";
import type {
  ConcreteFoundationActionResult,
  ConcreteFoundationRequest,
  LengthQuantity,
} from "@/features/calculators/concrete-foundation";
import { lengthToMeters } from "@/features/calculators/concrete-foundation/units";
import { submitConcreteFoundationCalculation } from "./actions";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const LENGTH_UNITS = ["m", "ft", "cm", "mm", "in"] as const;

type ConcreteFoundationFormDict = Dictionary["calculators"]["concrete-foundation"]["form"];

function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

interface FormState {
  footingLength: LengthQuantity;
  footingWidth: LengthQuantity;
  footingDepth: LengthQuantity;
  stemEnabled: boolean;
  stemHeight: LengthQuantity;
  stemThickness: LengthQuantity;
  wastagePercent: string;
}

function makeInitialState(): FormState {
  return {
    footingLength: { value: "10", unit: "m" },
    footingWidth: { value: "0.45", unit: "m" },
    footingDepth: { value: "0.3", unit: "m" },
    stemEnabled: true,
    stemHeight: { value: "0.6", unit: "m" },
    stemThickness: { value: "0.23", unit: "m" },
    wastagePercent: "5",
  };
}

interface FormErrors {
  footingLength?: string;
  footingWidth?: string;
  footingDepth?: string;
  stemHeight?: string;
  stemThickness?: string;
  wastagePercent?: string;
}

function validateForm(state: FormState, e: ConcreteFoundationFormDict["errors"]): FormErrors {
  const errors: FormErrors = {};

  const wastage = parseNum(state.wastagePercent);
  if (!Number.isFinite(wastage) || wastage < 0 || wastage > 50) {
    errors.wastagePercent = e.wastageRange;
  }

  const lenM = lengthToMeters(state.footingLength);
  const widM = lengthToMeters(state.footingWidth);
  const depM = lengthToMeters(state.footingDepth);

  if (!Number.isFinite(lenM) || lenM <= 0) errors.footingLength = e.lenMin;
  else if (lenM > 500) errors.footingLength = e.lenMax;

  if (!Number.isFinite(widM) || widM <= 0) errors.footingWidth = e.widMin;
  else if (widM > 10) errors.footingWidth = e.widMax;

  if (!Number.isFinite(depM) || depM <= 0) errors.footingDepth = e.depMin;
  else if (depM > 5) errors.footingDepth = e.depMax;

  if (state.stemEnabled) {
    const thkM = lengthToMeters(state.stemThickness);
    const hgtM = lengthToMeters(state.stemHeight);

    if (!Number.isFinite(thkM) || thkM <= 0) errors.stemThickness = e.thkMin;
    else if (thkM > 5) errors.stemThickness = e.thkMax;

    if (!Number.isFinite(hgtM) || hgtM <= 0) errors.stemHeight = e.htMin;
    else if (hgtM > 10) errors.stemHeight = e.htMax;
  }

  return errors;
}

function toRequest(state: FormState): ConcreteFoundationRequest {
  return {
    footing: {
      length: state.footingLength,
      width: state.footingWidth,
      depth: state.footingDepth,
    },
    stemWall: {
      enabled: state.stemEnabled,
      height: state.stemHeight,
      thickness: state.stemThickness,
    },
    wastagePercent: state.wastagePercent,
  };
}

interface ConcreteFoundationCalculatorFormProps {
  t: ConcreteFoundationFormDict;
  common: Dictionary["common"];
  cCommon: Dictionary["calculators"]["common"];
}

export function ConcreteFoundationCalculatorForm({ t, common, cCommon }: ConcreteFoundationCalculatorFormProps) {
  const [state, setState] = useState<FormState>(makeInitialState);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const errors = useMemo(() => validateForm(state, t.errors), [state, t.errors]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<ConcreteFoundationActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<ConcreteFoundationRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (req: ConcreteFoundationRequest) =>
    startTransition(async () => {
      const res = await submitConcreteFoundationCalculation(req);
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
            <VariableRow label={t.runLength} error={errors.footingLength}>
              <QuantityInput
                value={state.footingLength}
                onChange={(q) => set("footingLength", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={500}
                step={0.1}
                decimals={2}
                ariaLabel={t.runAria}
              />
            </VariableRow>
            <VariableRow label={t.footingWidth} error={errors.footingWidth}>
              <QuantityInput
                value={state.footingWidth}
                onChange={(q) => set("footingWidth", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={10}
                step={0.05}
                decimals={2}
                ariaLabel={t.widAria}
              />
            </VariableRow>
            <VariableRow label={t.footingDepth} error={errors.footingDepth}>
              <QuantityInput
                value={state.footingDepth}
                onChange={(q) => set("footingDepth", q)}
                units={LENGTH_UNITS}
                min={0.05}
                max={5}
                step={0.05}
                decimals={2}
                ariaLabel={t.depAria}
              />
            </VariableRow>
            <p className="text-xs text-black/60 dark:text-white/60">{t.dimHint}</p>
          </div>
        </BlockGroup>

        <BlockGroup title={t.section2}>
          <div className="space-y-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-black/70 dark:text-white/70">
              <input
                type="checkbox"
                checked={state.stemEnabled}
                onChange={(e) => set("stemEnabled", e.target.checked)}
                className="accent-black dark:accent-white"
              />
              {t.stemLabel}
            </label>
            <p className="text-xs text-black/60 dark:text-white/60">{t.stemHint}</p>

            {state.stemEnabled ? (
              <div className="space-y-4">
                <VariableRow label={t.stemHeight} error={errors.stemHeight}>
                  <QuantityInput
                    value={state.stemHeight}
                    onChange={(q) => set("stemHeight", q)}
                    units={LENGTH_UNITS}
                    min={0.05}
                    max={10}
                    step={0.05}
                    decimals={2}
                    ariaLabel={t.htAria}
                  />
                </VariableRow>
                <VariableRow label={t.stemThickness} error={errors.stemThickness}>
                  <QuantityInput
                    value={state.stemThickness}
                    onChange={(q) => set("stemThickness", q)}
                    units={LENGTH_UNITS}
                    min={0.05}
                    max={5}
                    step={0.05}
                    decimals={2}
                    ariaLabel={t.thkAria}
                  />
                </VariableRow>
              </div>
            ) : null}
          </div>
        </BlockGroup>

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
            <ConcreteFoundationResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="concrete-foundation"
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