"use client";

// SteelCalculatorForm — client island. All math runs on the server.

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { SteelResultCard } from "@/components/calculators/steel/ResultCard";
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

const LENGTH_UNITS = ["mm", "cm", "m", "ft"] as const;
const VOLUME_UNITS = ["cum", "cft"] as const;
const MEMBERS: readonly Member[] = [
  "slab",
  "beam",
  "column",
  "footing",
  "staircase",
] as const;
// Common Indian TMT bar diameters — dropdown, not free text.
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
  // Bar schedule fields.
  bars: BarRow[];
  // Thumb rule fields.
  member: Member;
  concreteVolume: VolumeQuantity;
  // Custom overrides (any mode).
  customWastagePercent: string;
  customThumbRuleKgPerCum: string;
}

function makeBar(diameter: string, length: string, count: number): BarRow {
  return {
    label: `${diameter}mm bar`,
    diameter: { value: diameter, unit: "mm" },
    length: { value: length, unit: "m" },
    count,
  };
}

function makeInitialState(standards: SteelStandardsResponse): FormState {
  const defaultPreset =
    standards.presets.find((p) => p.id === standards.defaultPreset) ??
    standards.presets[0]!;
  return {
    mode: "barSchedule",
    presetId: defaultPreset.id,
    useCustom: false,
    bars: [
      { ...makeBar("12", "5.0", 20), label: "Main bars — bottom" },
      { ...makeBar("8", "3.2", 32), label: "Distribution bars" },
    ],
    member: "slab",
    concreteVolume: { value: "10", unit: "cum" },
    customWastagePercent: defaultPreset.parameters.wastagePercent,
    customThumbRuleKgPerCum: standards.thumbRuleDefaults.slab.value,
  };
}

// ---- validation ----

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

function validateForm(state: FormState): FormErrors {
  const errors: FormErrors = {};

  if (state.mode === "barSchedule") {
    const barErrors: Array<
      { diameter?: string; length?: string; count?: string } | undefined
    > = [];
    let anyBarError = false;
    state.bars.forEach((b, i) => {
      const e: { diameter?: string; length?: string; count?: string } = {};
      const d = parseNum(b.diameter.value);
      if (!Number.isFinite(d) || d <= 0) {
        e.diameter = "Enter a diameter greater than 0.";
      } else if (d > 100) {
        e.diameter = "Diameter must be 100 mm or less.";
      }
      const lenM = lengthToMeters(b.length);
      if (!Number.isFinite(lenM) || lenM <= 0) {
        e.length = "Enter a length greater than 0.";
      } else if (lenM > 50) {
        e.length = "Length must be 50 m or less.";
      }
      if (!Number.isFinite(b.count) || b.count < 1) {
        e.count = "At least 1 bar.";
      }
      if (Object.keys(e).length > 0) {
        barErrors[i] = e;
        anyBarError = true;
      }
    });
    if (anyBarError) errors.bars = barErrors;
  } else {
    const v = parseNum(state.concreteVolume.value);
    if (!Number.isFinite(v) || v <= 0) {
      errors.concreteVolume = "Enter a volume greater than 0.";
    }
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

// ---- component ----

interface SteelCalculatorFormProps {
  initialStandards: SteelStandardsResponse;
}

export function SteelCalculatorForm({
  initialStandards,
}: SteelCalculatorFormProps) {
  const [state, setState] = useState<FormState>(() =>
    makeInitialState(initialStandards),
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  // --- preset change resets custom fields to that preset's values ---
  const changePreset = (id: string) => {
    const preset = initialStandards.presets.find((p) => p.id === id);
    if (!preset) return;
    setState((s) => ({
      ...s,
      presetId: id,
      customWastagePercent: preset.parameters.wastagePercent,
    }));
  };

  // Changing the member updates thumb-rule kg/cum default too.
  const changeMember = (m: Member) => {
    setState((s) => ({
      ...s,
      member: m,
      customThumbRuleKgPerCum: initialStandards.thumbRuleDefaults[m].value,
    }));
  };

  // --- bar helpers ---
  const addBar = () =>
    set("bars", [
      ...state.bars,
      { ...makeBar("10", "3.0", 1), label: `Bar ${state.bars.length + 1}` },
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

  const errors = useMemo(() => validateForm(state), [state]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<SteelActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<SteelRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;
    const req = toSteelRequest(state);
    startTransition(async () => {
      const res = await submitSteelCalculation(req);
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
        {/* Mode toggle */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Input mode</legend>
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
                {m === "barSchedule" ? "By bar schedule" : "By thumb rule"}
              </button>
            ))}
          </div>
          <p className="text-xs text-black/60 dark:text-white/60">
            {state.mode === "barSchedule"
              ? "Accurate. Use when you have the drawing."
              : "Rough (±20%). Use for pricing estimates only."}
          </p>
        </fieldset>

        {/* Standard preset */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Steel standard</legend>
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
            Customise this standard
          </label>
        </fieldset>

        {/* Bar schedule or thumb rule */}
        {state.mode === "barSchedule" ? (
          <fieldset className="space-y-4">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-semibold">Bar schedule</legend>
              <Button
                variant="secondary"
                size="sm"
                onClick={addBar}
                type="button"
              >
                + Add bar
              </Button>
            </div>
            <div className="space-y-4">
              {state.bars.map((bar, i) => (
                <div
                  key={i}
                  className="space-y-3 rounded border border-black/10 p-4 dark:border-white/10"
                >
                  <div className="flex items-center justify-between gap-2">
                    <input
                      value={bar.label}
                      onChange={(e) =>
                        patchBar(i, { label: e.target.value })
                      }
                      placeholder={`Bar ${i + 1}`}
                      className="w-52 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold focus:border-black/15 focus:outline-none dark:focus:border-white/20"
                    />
                    {state.bars.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeBar(i)}
                        className="text-xs text-red-600 hover:underline dark:text-red-400"
                        aria-label={`Remove bar ${i + 1}`}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <LabeledRow
                    label="Diameter"
                    compact
                    error={errors.bars?.[i]?.diameter}
                  >
                    <select
                      value={bar.diameter.value}
                      onChange={(e) =>
                        patchBar(i, {
                          diameter: { value: e.target.value, unit: "mm" },
                        })
                      }
                      className="w-24 rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
                      aria-label={`Bar ${i + 1} diameter (mm)`}
                    >
                      {COMMON_DIAMETERS.map((d) => (
                        <option key={d} value={d}>
                          {d} mm
                        </option>
                      ))}
                    </select>
                  </LabeledRow>

                  <LabeledRow
                    label="Length"
                    compact
                    error={errors.bars?.[i]?.length}
                  >
                    <QuantityInput
                      value={bar.length}
                      onChange={(q) => patchBar(i, { length: q })}
                      units={LENGTH_UNITS}
                      min={0.1}
                      max={50}
                      step={0.1}
                      decimals={2}
                      ariaLabel={`Bar ${i + 1} length`}
                    />
                  </LabeledRow>

                  <LabeledRow
                    label="Count"
                    compact
                    error={errors.bars?.[i]?.count}
                  >
                    <NumberSliderInput
                      value={bar.count}
                      onChange={(n) => patchBar(i, { count: n })}
                      min={1}
                      max={500}
                      step={1}
                      decimals={0}
                      ariaLabel={`Bar ${i + 1} count`}
                    />
                  </LabeledRow>
                </div>
              ))}
            </div>
          </fieldset>
        ) : (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">Member + volume</legend>
            <LabeledRow label="Member type">
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
            </LabeledRow>
            <LabeledRow label="Concrete volume" error={errors.concreteVolume}>
              <QuantityInput
                value={state.concreteVolume}
                onChange={(q) => set("concreteVolume", q)}
                units={VOLUME_UNITS}
                min={0.1}
                max={100_000}
                step={0.5}
                decimals={2}
                ariaLabel="Concrete volume"
              />
            </LabeledRow>
            <p className="text-xs text-black/60 dark:text-white/60">
              Default rate: {initialStandards.thumbRuleDefaults[state.member].value} kg/cum for {state.member}. Turn on Customise to override.
            </p>
          </fieldset>
        )}

        {/* Custom overrides */}
        {state.useCustom ? (
          <fieldset className="space-y-4 rounded border border-black/10 p-4 dark:border-white/10">
            <legend className="px-1 text-sm font-semibold">
              Custom parameters
            </legend>
            <LabeledRow label="Wastage">
              <NumberSliderInput
                value={Number(state.customWastagePercent)}
                onChange={(n) => set("customWastagePercent", String(n))}
                min={0}
                max={20}
                step={0.5}
                decimals={1}
                suffix="%"
                ariaLabel="Wastage percent"
              />
            </LabeledRow>
            {state.mode === "thumbRule" ? (
              <LabeledRow label="kg / cum">
                <NumberSliderInput
                  value={Number(state.customThumbRuleKgPerCum)}
                  onChange={(n) => set("customThumbRuleKgPerCum", String(n))}
                  min={30}
                  max={300}
                  step={1}
                  decimals={0}
                  ariaLabel="Kilograms per cubic metre of concrete"
                />
              </LabeledRow>
            ) : null}
          </fieldset>
        ) : null}

        {/* Submit + error banner */}
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
              {isPending ? "Calculating…" : "Calculate"}
            </Button>
            {hasErrors ? (
              <p className="text-xs text-red-600 dark:text-red-400">
                Fix the highlighted fields to continue.
              </p>
            ) : null}
          </div>
        </div>
      </form>

      <aside aria-live="polite" className="md:sticky md:top-6 md:self-start">
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
            {isPending
              ? "Calculating…"
              : "Fill the form and press Calculate to see the steel weight."}
          </div>
        )}
      </aside>
    </div>
  );
}

// ---- helpers ----

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
      <label className="pt-2 text-sm text-black/70 dark:text-white/70">
        {label}
      </label>
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
