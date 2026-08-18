"use client";

// Client-side form for the concrete-driveway calculator. Owns the input state,
// runs local validation, calls the server action, and renders the result.

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { ConcreteDrivewayResultCard } from "@/components/calculators/concrete-driveway/ResultCard";
import { BlockGroup } from "@/components/calculators/ui/BlockGroup";
import { VariableRow } from "@/components/calculators/ui/VariableRow";
import { ActionPanel } from "@/components/calculators/ui/ActionPanel";
import { FeedbackBar } from "@/components/calculators/ui/FeedbackBar";
import type {
  ConcreteDrivewayActionResult,
  ConcreteDrivewayRequest,
  LengthQuantity,
  ReinforcementType,
  RebarSize,
} from "@/features/calculators/concrete-driveway";
import { lengthToMeters } from "@/features/calculators/concrete-driveway/units";
import { submitConcreteDrivewayCalculation } from "./actions";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const LENGTH_UNITS = ["m", "ft", "cm", "mm", "in"] as const;
const REINFORCEMENT_OPTIONS: readonly ReinforcementType[] = ["none", "wire-mesh", "rebar"] as const;
const REBAR_SIZES: readonly RebarSize[] = ["10mm", "12mm", "16mm", "20mm"] as const;

type ConcreteDrivewayFormDict = Dictionary["calculators"]["concrete-driveway"]["form"];

function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

interface FormState {
  length: LengthQuantity;
  width: LengthQuantity;
  thickness: LengthQuantity;
  reinforcement: ReinforcementType;
  rebarSpacing: LengthQuantity;
  rebarSize: RebarSize;
  jointSpacing: LengthQuantity;
  wastagePercent: string;
}

function makeInitialState(): FormState {
  return {
    length: { value: "6", unit: "m" },
    width: { value: "4", unit: "m" },
    thickness: { value: "0.15", unit: "m" },
    reinforcement: "none",
    rebarSpacing: { value: "0.4", unit: "m" },
    rebarSize: "12mm",
    jointSpacing: { value: "5", unit: "m" },
    wastagePercent: "5",
  };
}

interface FormErrors {
  length?: string;
  width?: string;
  thickness?: string;
  rebarSpacing?: string;
  jointSpacing?: string;
  wastagePercent?: string;
}

function validateForm(state: FormState, e: ConcreteDrivewayFormDict["errors"]): FormErrors {
  const errors: FormErrors = {};

  const wastage = parseNum(state.wastagePercent);
  if (!Number.isFinite(wastage) || wastage < 0 || wastage > 50) {
    errors.wastagePercent = e.wastageRange;
  }

  const lenM = lengthToMeters(state.length);
  const widM = lengthToMeters(state.width);
  const thkM = lengthToMeters(state.thickness);

  if (!Number.isFinite(lenM) || lenM <= 0) errors.length = e.lenMin;
  else if (lenM > 200) errors.length = e.lenMax;

  if (!Number.isFinite(widM) || widM <= 0) errors.width = e.widMin;
  else if (widM > 200) errors.width = e.widMax;

  if (!Number.isFinite(thkM) || thkM <= 0) errors.thickness = e.thkMin;
  else if (thkM > 5) errors.thickness = e.thkMax;

  if (state.reinforcement === "rebar") {
    const spacingM = lengthToMeters(state.rebarSpacing);
    if (!Number.isFinite(spacingM) || spacingM <= 0) errors.rebarSpacing = e.rebarSpacingMin;
    else if (spacingM > 1) errors.rebarSpacing = e.rebarSpacingMax;
  }

  const jointM = lengthToMeters(state.jointSpacing);
  if (!Number.isFinite(jointM) || jointM <= 0) errors.jointSpacing = e.jointSpacingMin;
  else if (jointM > 20) errors.jointSpacing = e.jointSpacingMax;

  return errors;
}

function toRequest(state: FormState): ConcreteDrivewayRequest {
  return {
    length: state.length,
    width: state.width,
    thickness: state.thickness,
    reinforcement: state.reinforcement,
    rebarSpacing: state.reinforcement === "rebar" ? state.rebarSpacing : undefined,
    rebarSize: state.reinforcement === "rebar" ? state.rebarSize : undefined,
    jointSpacing: state.jointSpacing,
    wastagePercent: state.wastagePercent,
  };
}

const REINFORCEMENT_LABELS: Record<ReinforcementType, "reinfNone" | "reinfMesh" | "reinfRebar"> = {
  none: "reinfNone",
  "wire-mesh": "reinfMesh",
  rebar: "reinfRebar",
};

interface ConcreteDrivewayCalculatorFormProps {
  t: ConcreteDrivewayFormDict;
  common: Dictionary["common"];
  cCommon: Dictionary["calculators"]["common"];
}

export function ConcreteDrivewayCalculatorForm({ t, common, cCommon }: ConcreteDrivewayCalculatorFormProps) {
  const [state, setState] = useState<FormState>(makeInitialState);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const errors = useMemo(() => validateForm(state, t.errors), [state, t.errors]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<ConcreteDrivewayActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<ConcreteDrivewayRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (req: ConcreteDrivewayRequest) =>
    startTransition(async () => {
      const res = await submitConcreteDrivewayCalculation(req);
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
            <p className="text-xs text-black/60 dark:text-white/60">{t.dimHint}</p>
          </div>
        </BlockGroup>

        <BlockGroup title={t.section2}>
          <div className="space-y-4">
            <VariableRow label={t.reinforcement} hint={t.reinfHint}>
              <select
                value={state.reinforcement}
                onChange={(e) => set("reinforcement", e.target.value as ReinforcementType)}
                aria-label={t.reinforcement}
                className="w-full rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
              >
                {REINFORCEMENT_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {t[REINFORCEMENT_LABELS[r]]}
                  </option>
                ))}
              </select>
            </VariableRow>

            {state.reinforcement === "rebar" ? (
              <>
                <VariableRow label={t.rebarSize}>
                  <select
                    value={state.rebarSize}
                    onChange={(e) => set("rebarSize", e.target.value as RebarSize)}
                    aria-label={t.rebarSize}
                    className="w-full rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
                  >
                    {REBAR_SIZES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </VariableRow>
                <VariableRow label={t.rebarSpacing} error={errors.rebarSpacing}>
                  <QuantityInput
                    value={state.rebarSpacing}
                    onChange={(q) => set("rebarSpacing", q)}
                    units={LENGTH_UNITS}
                    min={0.1}
                    max={1}
                    step={0.05}
                    decimals={2}
                    ariaLabel={t.rebarSpacingAria}
                  />
                </VariableRow>
                <p className="text-xs text-black/60 dark:text-white/60">{t.rebarHint}</p>
              </>
            ) : null}

            <VariableRow label={t.jointSpacing} error={errors.jointSpacing} hint={t.jointHint}>
              <QuantityInput
                value={state.jointSpacing}
                onChange={(q) => set("jointSpacing", q)}
                units={LENGTH_UNITS}
                min={1}
                max={20}
                step={0.5}
                decimals={1}
                ariaLabel={t.jointSpacingAria}
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
            <ConcreteDrivewayResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="concrete-driveway"
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