"use client";

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { SteelResultCard } from "@/components/calculators/steel/ResultCard";
import { BlockGroup } from "@/components/calculators/ui/BlockGroup";
import { VariableRow } from "@/components/calculators/ui/VariableRow";
import { ActionPanel } from "@/components/calculators/ui/ActionPanel";
import { FeedbackBar } from "@/components/calculators/ui/FeedbackBar";
import type {
  BarDiameter,
  LengthQuantity,
  Member,
  SteelActionResult,
  SteelBar,
  SteelRequest,
  SteelStandardsResponse,
  VolumeQuantity,
} from "@/features/calculators/steel";
import { lengthToMeters } from "@/features/calculators/steel/units";
import { submitSteelCalculation } from "./actions";
import type { Dictionary } from "@/app/[lang]/dictionaries";

const LENGTH_UNITS = ["mm", "cm", "m", "ft"] as const;
const VOLUME_UNITS = ["cum", "cft"] as const;
const MEMBERS: readonly Member[] = [
  "slab",
  "beam",
  "column",
  "footing",
  "staircase",
] as const;
const COMMON_DIAMETERS = ["6", "8", "10", "12", "16", "20", "25", "32"] as const;

interface BarRow {
  label: string;
  diameter: BarDiameter;
  length: LengthQuantity;
  count: number;
}

interface FormState {
  mode: "barSchedule" | "thumbRule";
  presetId: string;
  useCustom: boolean;
  bars: BarRow[];
  member: Member;
  concreteVolume: VolumeQuantity;
  customWastagePercent: string;
  customThumbRuleKgPerCum: string;
}

type SteelFormDict = Dictionary["calculators"]["steel"]["form"];

function makeBar(
  diameter: string,
  length: string,
  count: number,
  label: string,
): BarRow {
  return {
    label,
    diameter: { value: diameter, unit: "mm" },
    length: { value: length, unit: "m" },
    count,
  };
}

function makeInitialState(
  standards: SteelStandardsResponse,
  t: SteelFormDict,
): FormState {
  const defaultPreset =
    standards.presets.find((p) => p.id === standards.defaultPreset) ??
    standards.presets[0]!;
  return {
    mode: "barSchedule",
    presetId: defaultPreset.id,
    useCustom: false,
    bars: [
      makeBar("12", "5.0", 20, t.barLabels.mainBottom),
      makeBar("8", "3.2", 32, t.barLabels.distribution),
    ],
    member: "slab",
    concreteVolume: { value: "10", unit: "cum" },
    customWastagePercent: defaultPreset.parameters.wastagePercent,
    customThumbRuleKgPerCum: standards.thumbRuleDefaults.slab.value,
  };
}

interface FormErrors {
  bars?: Array<
    { diameter?: string; length?: string; count?: string } | undefined
  >;
  concreteVolume?: string;
}

function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function validateForm(state: FormState, e: SteelFormDict["errors"]): FormErrors {
  const errors: FormErrors = {};

  if (state.mode === "barSchedule") {
    const barErrors: Array<
      { diameter?: string; length?: string; count?: string } | undefined
    > = [];
    let anyBarError = false;
    state.bars.forEach((b, i) => {
      const err: { diameter?: string; length?: string; count?: string } = {};
      const d = parseNum(b.diameter.value);
      if (!Number.isFinite(d) || d <= 0) err.diameter = e.diaMin;
      else if (d > 100) err.diameter = e.diaMax;
      const lenM = lengthToMeters(b.length);
      if (!Number.isFinite(lenM) || lenM <= 0) err.length = e.lenMin;
      else if (lenM > 50) err.length = e.lenMax;
      if (!Number.isFinite(b.count) || b.count < 1) err.count = e.countMin;
      if (Object.keys(err).length > 0) {
        barErrors[i] = err;
        anyBarError = true;
      }
    });
    if (anyBarError) errors.bars = barErrors;
  } else {
    const v = parseNum(state.concreteVolume.value);
    if (!Number.isFinite(v) || v <= 0) errors.concreteVolume = e.volMin;
  }
  return errors;
}

function toSteelRequest(state: FormState): SteelRequest {
  const standard = state.useCustom
    ? {
        preset: state.presetId,
        custom: {
          wastagePercent: state.customWastagePercent,
          ...(state.mode === "thumbRule"
            ? { thumbRuleKgPerCum: state.customThumbRuleKgPerCum }
            : {}),
        },
      }
    : { preset: state.presetId };

  if (state.mode === "barSchedule") {
    return {
      mode: "barSchedule",
      bars: state.bars.map<SteelBar>((b) => ({
        label: b.label,
        diameter: b.diameter,
        length: b.length,
        count: b.count,
      })),
      standard,
    };
  }
  return {
    mode: "thumbRule",
    member: state.member,
    concreteVolume: state.concreteVolume,
    standard,
  };
}

interface SteelCalculatorFormProps {
  initialStandards: SteelStandardsResponse;
  t: SteelFormDict;
  common: Dictionary["common"];
  cCommon: Dictionary["calculators"]["common"];
}

export function SteelCalculatorForm({
  initialStandards,
  t,
  common,
  cCommon,
}: SteelCalculatorFormProps) {
  const [state, setState] = useState<FormState>(() =>
    makeInitialState(initialStandards, t),
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const changePreset = (id: string) => {
    const preset = initialStandards.presets.find((p) => p.id === id);
    if (!preset) return;
    setState((s) => ({
      ...s,
      presetId: id,
      customWastagePercent: preset.parameters.wastagePercent,
    }));
  };

  const changeMember = (m: Member) => {
    setState((s) => ({
      ...s,
      member: m,
      customThumbRuleKgPerCum: initialStandards.thumbRuleDefaults[m].value,
    }));
  };

  const addBar = () =>
    set("bars", [
      ...state.bars,
      makeBar(
        "10",
        "3.0",
        1,
        t.barLabels.generic.replace("{n}", String(state.bars.length + 1)),
      ),
    ]);
  const removeBar = (i: number) => {
    if (state.bars.length <= 1) return;
    set(
      "bars",
      state.bars.filter((_, idx) => idx !== i),
    );
  };
  const patchBar = (i: number, patch: Partial<BarRow>) =>
    set(
      "bars",
      state.bars.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    );

  const errors = useMemo(() => validateForm(state, t.errors), [state, t.errors]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<SteelActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<SteelRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const run = (req: SteelRequest) =>
    startTransition(async () => {
      const res = await submitSteelCalculation(req);
      setResult(res);
      setSavedRequest(res.ok ? req : null);
    });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;
    run(toSteelRequest(state));
  };

  const onReload = () => {
    if (hasErrors) return;
    run(toSteelRequest(state));
  };

  const onClear = () => {
    setState(makeInitialState(initialStandards, t));
    setResult(null);
    setSavedRequest(null);
  };

  const errCode = result && !result.ok ? result.error.code : null;
  const errMsg = result && !result.ok ? result.error.message : null;

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <BlockGroup title={t.mode}>
          <div className="space-y-3">
            <div className="flex gap-2">
              {(["barSchedule", "thumbRule"] as const).map((m) => (
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
                  {m === "barSchedule" ? t.modes.schedule : t.modes.thumb}
                </button>
              ))}
            </div>
            <p className="text-xs text-black/60 dark:text-white/60">
              {state.mode === "barSchedule" ? t.modeHint1 : t.modeHint2}
            </p>
          </div>
        </BlockGroup>

        <BlockGroup title={t.standard}>
          <div className="space-y-3">
            <VariableRow label={t.standard}>
              <select
                value={state.presetId}
                onChange={(e) => changePreset(e.target.value)}
                aria-label={t.standard}
                className="w-full rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
              >
                {initialStandards.presets.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </VariableRow>
            <p className="text-xs text-black/60 dark:text-white/60">
              {
                initialStandards.presets.find((p) => p.id === state.presetId)
                  ?.description
              }
            </p>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-black/70 dark:text-white/70">
              <input
                type="checkbox"
                checked={state.useCustom}
                onChange={(e) => set("useCustom", e.target.checked)}
                className="accent-black dark:accent-white"
              />
              {t.customStd}
            </label>
          </div>
        </BlockGroup>

        {state.mode === "barSchedule" ? (
          <BlockGroup title={t.schedule}>
            <div className="space-y-4">
              <Button variant="secondary" size="sm" onClick={addBar} type="button">
                {t.addBar}
              </Button>
              {state.bars.map((bar, i) => {
                const idx = String(i + 1);
                return (
                  <div
                    key={i}
                    className="space-y-3 rounded border border-black/10 p-4 dark:border-white/10"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        value={bar.label}
                        onChange={(e) => patchBar(i, { label: e.target.value })}
                        placeholder={t.barPh.replace("{i}", idx)}
                        className="w-52 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold focus:border-black/15 focus:outline-none dark:focus:border-white/20"
                      />
                      {state.bars.length > 1 ? (
                        <button
                          type="button"
                          onClick={() => removeBar(i)}
                          className="text-xs text-red-600 hover:underline dark:text-red-400"
                          aria-label={t.removeBarAria.replace("{i}", idx)}
                        >
                          {common.remove}
                        </button>
                      ) : null}
                    </div>

                    <VariableRow label={t.diameter} error={errors.bars?.[i]?.diameter}>
                      <select
                        value={bar.diameter.value}
                        onChange={(e) =>
                          patchBar(i, {
                            diameter: { value: e.target.value, unit: "mm" },
                          })
                        }
                        className="w-24 rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
                        aria-label={t.diaAria.replace("{i}", idx)}
                      >
                        {COMMON_DIAMETERS.map((d) => (
                          <option key={d} value={d}>
                            {t.diaOption.replace("{d}", d)}
                          </option>
                        ))}
                      </select>
                    </VariableRow>

                    <VariableRow label={common.length} error={errors.bars?.[i]?.length}>
                      <QuantityInput
                        value={bar.length}
                        onChange={(q) => patchBar(i, { length: q })}
                        units={LENGTH_UNITS}
                        min={0.1}
                        max={50}
                        step={0.1}
                        decimals={2}
                        ariaLabel={t.lenAria.replace("{i}", idx)}
                      />
                    </VariableRow>

                    <VariableRow label={t.count} error={errors.bars?.[i]?.count}>
                      <NumberSliderInput
                        value={bar.count}
                        onChange={(n) => patchBar(i, { count: n })}
                        min={1}
                        max={500}
                        step={1}
                        decimals={0}
                        ariaLabel={t.countAria.replace("{i}", idx)}
                      />
                    </VariableRow>
                  </div>
                );
              })}
            </div>
          </BlockGroup>
        ) : (
          <BlockGroup title={t.member}>
            <div className="space-y-4">
              <VariableRow label={t.memberType}>
                <select
                  value={state.member}
                  onChange={(e) => changeMember(e.target.value as Member)}
                  className="w-40 rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
                >
                  {MEMBERS.map((m) => (
                    <option key={m} value={m} className="capitalize">
                      {m}
                    </option>
                  ))}
                </select>
              </VariableRow>
              <VariableRow label={t.concreteVol} error={errors.concreteVolume}>
                <QuantityInput
                  value={state.concreteVolume}
                  onChange={(q) => set("concreteVolume", q)}
                  units={VOLUME_UNITS}
                  min={0.1}
                  max={100_000}
                  step={0.5}
                  decimals={2}
                  ariaLabel={t.volAria}
                />
              </VariableRow>
              <p className="text-xs text-black/60 dark:text-white/60">
                {t.defaultRate
                  .replace(
                    "{value}",
                    initialStandards.thumbRuleDefaults[state.member].value,
                  )
                  .replace("{member}", state.member)}
              </p>
            </div>
          </BlockGroup>
        )}

        {state.useCustom ? (
          <BlockGroup title={cCommon.customParams}>
            <div className="space-y-4">
              <VariableRow label={t.wastage}>
                <NumberSliderInput
                  value={Number(state.customWastagePercent)}
                  onChange={(n) => set("customWastagePercent", String(n))}
                  min={0}
                  max={20}
                  step={0.5}
                  decimals={1}
                  suffix="%"
                  ariaLabel={t.wastageAria}
                />
              </VariableRow>
              {state.mode === "thumbRule" ? (
                <VariableRow label={t.kgPerCum}>
                  <NumberSliderInput
                    value={Number(state.customThumbRuleKgPerCum)}
                    onChange={(n) => set("customThumbRuleKgPerCum", String(n))}
                    min={30}
                    max={300}
                    step={1}
                    decimals={0}
                    ariaLabel={t.kgPerCumAria}
                  />
                </VariableRow>
              ) : null}
            </div>
          </BlockGroup>
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

      <div aria-live="polite">
        {result?.ok ? (
          <>
            <SteelResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="steel"
                request={savedRequest as unknown as Record<string, unknown>}
                result={result.data as unknown as Record<string, unknown>}
              />
            </div>
          </>
        ) : (
          <div className="rounded border border-dashed border-black/15 p-6 text-sm text-black/60 dark:border-white/20 dark:text-white/60">
            {isPending ? common.calculating : cCommon.fillFormSteel}
          </div>
        )}
      </div>

      <ActionPanel
        reloadLabel={cCommon.reload}
        clearLabel={cCommon.clearAll}
        onReload={onReload}
        onClear={onClear}
      />

      <FeedbackBar question={cCommon.didWeSolve} yesLabel={common.yes} noLabel={common.no} />
    </div>
  );
}
