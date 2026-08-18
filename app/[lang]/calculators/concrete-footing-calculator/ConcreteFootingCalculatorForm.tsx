"use client";

// Client-side form for the concrete-footing calculator. Owns the input state,
// runs local validation, calls the server action, and renders the result.

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { ConcreteFootingResultCard } from "@/components/calculators/concrete-footing/ResultCard";
import { BlockGroup } from "@/components/calculators/ui/BlockGroup";
import { VariableRow } from "@/components/calculators/ui/VariableRow";
import { ActionPanel } from "@/components/calculators/ui/ActionPanel";
import { FeedbackBar } from "@/components/calculators/ui/FeedbackBar";
import type {
  ConcreteFootingActionResult,
  ConcreteFootingRequest,
  FootingType,
  LengthQuantity,
} from "@/features/calculators/concrete-footing";
import { lengthToMeters } from "@/features/calculators/concrete-footing/units";
import { submitConcreteFootingCalculation } from "./actions";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const LENGTH_UNITS = ["m", "ft", "cm", "mm", "in"] as const;
const FOOTING_TYPES: readonly FootingType[] = ["continuous", "spread", "pier"] as const;

type ConcreteFootingFormDict = Dictionary["calculators"]["concrete-footing"]["form"];

function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

interface FormState {
  footingType: FootingType;
  length: LengthQuantity;
  width: LengthQuantity;
  height: LengthQuantity;
  diameter: LengthQuantity;
  quantity: string;
  wastagePercent: string;
}

function makeInitialState(): FormState {
  return {
    footingType: "continuous",
    length: { value: "8", unit: "m" },
    width: { value: "0.6", unit: "m" },
    height: { value: "0.5", unit: "m" },
    diameter: { value: "0.3", unit: "m" },
    quantity: "1",
    wastagePercent: "5",
  };
}

interface FormErrors {
  length?: string;
  width?: string;
  height?: string;
  diameter?: string;
  quantity?: string;
  wastagePercent?: string;
}

function validateForm(state: FormState, e: ConcreteFootingFormDict["errors"]): FormErrors {
  const errors: FormErrors = {};

  const wastage = parseNum(state.wastagePercent);
  if (!Number.isFinite(wastage) || wastage < 0 || wastage > 50) {
    errors.wastagePercent = e.wastageRange;
  }

  const qty = parseNum(state.quantity);
  if (!Number.isFinite(qty) || qty < 1) errors.quantity = e.qtyMin;
  else if (qty > 1000) errors.quantity = e.qtyMax;

  const lenM = lengthToMeters(state.length);
  const widM = lengthToMeters(state.width);
  const hgtM = lengthToMeters(state.height);
  const diaM = lengthToMeters(state.diameter);

  if (state.footingType === "pier") {
    if (!Number.isFinite(diaM) || diaM <= 0) errors.diameter = e.diaMin;
    else if (diaM > 10) errors.diameter = e.diaMax;

    if (!Number.isFinite(hgtM) || hgtM <= 0) errors.height = e.hgtMin;
    else if (hgtM > 5) errors.height = e.hgtMax;
  } else {
    if (!Number.isFinite(lenM) || lenM <= 0) errors.length = e.lenMin;
    else if (lenM > 200) errors.length = e.lenMax;

    if (!Number.isFinite(widM) || widM <= 0) errors.width = e.widMin;
    else if (widM > (state.footingType === "continuous" ? 5 : 10)) errors.width = e.widMax;

    if (!Number.isFinite(hgtM) || hgtM <= 0) errors.height = e.hgtMin;
    else if (hgtM > 3) errors.height = e.hgtMax;
  }

  return errors;
}

function toRequest(state: FormState): ConcreteFootingRequest {
  return {
    footingType: state.footingType,
    length: state.length,
    width: state.width,
    height: state.height,
    diameter: state.diameter,
    quantity: state.quantity,
    wastagePercent: state.wastagePercent,
  };
}

const TYPE_LABELS: Record<FootingType, "typeContinuous" | "typeSpread" | "typePier"> = {
  continuous: "typeContinuous",
  spread: "typeSpread",
  pier: "typePier",
};

interface ConcreteFootingCalculatorFormProps {
  t: ConcreteFootingFormDict;
  common: Dictionary["common"];
  cCommon: Dictionary["calculators"]["common"];
}

export function ConcreteFootingCalculatorForm({ t, common, cCommon }: ConcreteFootingCalculatorFormProps) {
  const [state, setState] = useState<FormState>(makeInitialState);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const errors = useMemo(() => validateForm(state, t.errors), [state, t.errors]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<ConcreteFootingActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<ConcreteFootingRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (req: ConcreteFootingRequest) =>
    startTransition(async () => {
      const res = await submitConcreteFootingCalculation(req);
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
            <VariableRow label={t.footingType} hint={t.typeHint}>
              <select
                value={state.footingType}
                onChange={(e) => set("footingType", e.target.value as FootingType)}
                aria-label={t.footingType}
                className="w-full rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
              >
                {FOOTING_TYPES.map((f) => (
                  <option key={f} value={f}>
                    {t[TYPE_LABELS[f]]}
                  </option>
                ))}
              </select>
            </VariableRow>
          </div>
        </BlockGroup>

        <BlockGroup title={t.section2}>
          <div className="space-y-4">
            {state.footingType === "pier" ? (
              <>
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
                <VariableRow label={t.height} error={errors.height}>
                  <QuantityInput
                    value={state.height}
                    onChange={(q) => set("height", q)}
                    units={LENGTH_UNITS}
                    min={0.05}
                    max={5}
                    step={0.05}
                    decimals={2}
                    ariaLabel={t.hgtAria}
                  />
                </VariableRow>
                <p className="text-xs text-black/60 dark:text-white/60">{t.pierHint}</p>
              </>
            ) : (
              <>
                <VariableRow label={common.length} error={errors.length}>
                  <QuantityInput
                    value={state.length}
                    onChange={(q) => set("length", q)}
                    units={LENGTH_UNITS}
                    min={0.1}
                    max={state.footingType === "continuous" ? 200 : 10}
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
                    max={state.footingType === "continuous" ? 5 : 10}
                    step={0.1}
                    decimals={2}
                    ariaLabel={t.widAria}
                  />
                </VariableRow>
                <VariableRow label={t.height} error={errors.height}>
                  <QuantityInput
                    value={state.height}
                    onChange={(q) => set("height", q)}
                    units={LENGTH_UNITS}
                    min={0.05}
                    max={3}
                    step={0.05}
                    decimals={2}
                    ariaLabel={t.hgtAria}
                  />
                </VariableRow>
                <p className="text-xs text-black/60 dark:text-white/60">
                  {state.footingType === "continuous" ? t.continuousHint : t.spreadHint}
                </p>
              </>
            )}

            <VariableRow label={t.quantity} error={errors.quantity} hint={t.qtyHint}>
              <NumberSliderInput
                value={Number(state.quantity) || 1}
                onChange={(n) => set("quantity", String(n))}
                min={1}
                max={1000}
                step={1}
                decimals={0}
                ariaLabel={t.qtyAria}
              />
            </VariableRow>
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
            <ConcreteFootingResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="concrete-footing"
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