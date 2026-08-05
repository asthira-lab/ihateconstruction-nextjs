"use client";

/**
 * BrickCalculatorForm — the client-side island.
 *
 * Renders the form, holds transient input state, calls the Server Action, and
 * paints the response. Contains ZERO business logic — every calculation is
 * performed on the server.
 */

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { BrickResultCard } from "@/components/calculators/brick/ResultCard";
import type {
  BrickActionResult,
  BrickRequest,
  BrickStandardsResponse,
  LengthQuantity,
  Opening,
} from "@/features/calculators/brick";
import { lengthToMeters } from "@/features/calculators/brick/units";
import { submitBrickCalculation } from "./actions";

const LENGTH_UNITS = ["mm", "cm", "m", "ft", "in"] as const;
const VOLUME_UNITS = ["cum", "cft"] as const;

interface BrickCalculatorFormProps {
  initialStandards: BrickStandardsResponse;
}

interface FormState {
  mode: "wall" | "volume";
  presetId: string;
  useCustom: boolean;
  // Wall mode fields.
  wallLength: LengthQuantity;
  wallHeight: LengthQuantity;
  wallThickness: LengthQuantity;
  openings: Opening[];
  // Volume mode fields.
  volume: { value: string; unit: "cum" | "cft" };
  // Custom overrides (only sent when useCustom = true).
  customMortarThickness: LengthQuantity;
  customMortarRatio: string;
  customWastagePercent: string;
  customMortarWastagePercent: string;
  customMortarDryToWetFactor: string;
  customBrickL: LengthQuantity;
  customBrickW: LengthQuantity;
  customBrickH: LengthQuantity;
}

function makeInitialState(standards: BrickStandardsResponse): FormState {
  const defaultPreset =
    standards.presets.find((p) => p.id === standards.defaultPreset) ??
    standards.presets[0]!;
  const p = defaultPreset.parameters;
  return {
    mode: "wall",
    presetId: defaultPreset.id,
    useCustom: false,
    wallLength: { value: "10", unit: "m" },
    wallHeight: { value: "3", unit: "m" },
    wallThickness: { value: "230", unit: "mm" },
    openings: [
      {
        label: "Door",
        width: { value: "0.9", unit: "m" },
        height: { value: "2.1", unit: "m" },
      },
    ],
    volume: { value: "3.5", unit: "cum" },
    customMortarThickness: p.mortarThickness,
    customMortarRatio: p.mortarRatio,
    customWastagePercent: p.wastagePercent,
    customMortarWastagePercent: p.mortarWastagePercent,
    customMortarDryToWetFactor: p.mortarDryToWetFactor,
    customBrickL: p.brickSize.length,
    customBrickW: p.brickSize.width,
    customBrickH: p.brickSize.height,
  };
}

// ---- validation ---------------------------------------------------------
//
// Client-side, per-field. All comparisons happen in meters so mixed units
// (2100 mm door vs 3 m wall) compare correctly.

interface FormErrors {
  wallLength?: string;
  wallHeight?: string;
  wallThickness?: string;
  volume?: string;
  openings?: Array<{ width?: string; height?: string } | undefined>;
  openingsTotal?: string;
}

/** Parse a decimal-string field. Returns NaN for empty / bad input. */
function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function validateForm(state: FormState): FormErrors {
  const errors: FormErrors = {};

  if (state.mode === "wall") {
    const lenM = lengthToMeters(state.wallLength);
    const hgtM = lengthToMeters(state.wallHeight);
    const thkM = lengthToMeters(state.wallThickness);

    if (!Number.isFinite(lenM) || lenM <= 0) {
      errors.wallLength = "Enter a length greater than 0.";
    } else if (lenM > 100) {
      errors.wallLength = "Length must be 100 m or less.";
    }

    if (!Number.isFinite(hgtM) || hgtM <= 0) {
      errors.wallHeight = "Enter a height greater than 0.";
    } else if (hgtM > 20) {
      errors.wallHeight = "Height must be 20 m or less.";
    }

    if (!Number.isFinite(thkM) || thkM <= 0) {
      errors.wallThickness = "Enter a thickness greater than 0.";
    } else if (thkM < 0.05) {
      errors.wallThickness = "Thickness must be at least 50 mm.";
    } else if (thkM > 0.5) {
      errors.wallThickness = "Thickness must be 500 mm or less.";
    }

    // Openings — width vs wall length, height vs wall height.
    const openingErrors: Array<{ width?: string; height?: string } | undefined> = [];
    let openingsArea = 0;
    let anyOpeningError = false;
    state.openings.forEach((op, i) => {
      const wM = lengthToMeters(op.width);
      const hM = lengthToMeters(op.height);
      const e: { width?: string; height?: string } = {};
      if (!Number.isFinite(wM) || wM <= 0) {
        e.width = "Enter a width greater than 0.";
      } else if (Number.isFinite(lenM) && wM > lenM) {
        e.width = "Opening is wider than the wall.";
      }
      if (!Number.isFinite(hM) || hM <= 0) {
        e.height = "Enter a height greater than 0.";
      } else if (Number.isFinite(hgtM) && hM > hgtM) {
        e.height = "Opening is taller than the wall.";
      }
      if (Object.keys(e).length > 0) {
        openingErrors[i] = e;
        anyOpeningError = true;
      }
      if (Number.isFinite(wM) && Number.isFinite(hM)) {
        openingsArea += wM * hM;
      }
    });
    if (anyOpeningError) errors.openings = openingErrors;

    // Combined check: total openings area can't exceed the wall.
    if (
      Number.isFinite(lenM) &&
      Number.isFinite(hgtM) &&
      openingsArea > lenM * hgtM
    ) {
      errors.openingsTotal =
        "Total openings area exceeds the wall area.";
    }
  } else {
    const v = parseNum(state.volume.value);
    if (!Number.isFinite(v) || v <= 0) {
      errors.volume = "Enter a volume greater than 0.";
    }
  }

  return errors;
}

function toBrickRequest(state: FormState): BrickRequest {
  const standard = state.useCustom
    ? {
        preset: state.presetId,
        custom: {
          brickSize: {
            length: state.customBrickL,
            width: state.customBrickW,
            height: state.customBrickH,
          },
          mortarThickness: state.customMortarThickness,
          mortarRatio: state.customMortarRatio,
          wastagePercent: state.customWastagePercent,
          mortarWastagePercent: state.customMortarWastagePercent,
          mortarDryToWetFactor: state.customMortarDryToWetFactor,
        },
      }
    : { preset: state.presetId };

  if (state.mode === "wall") {
    return {
      mode: "wall",
      wall: {
        length: state.wallLength,
        height: state.wallHeight,
        thickness: state.wallThickness,
      },
      openings: state.openings,
      standard,
    };
  }
  return {
    mode: "volume",
    volume: state.volume,
    standard,
  };
}

export function BrickCalculatorForm({ initialStandards }: BrickCalculatorFormProps) {
  const [state, setState] = useState<FormState>(() =>
    makeInitialState(initialStandards),
  );

  // Helper: patch state without rewriting the whole object every time.
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  // Reset custom params when the preset changes so the "Custom" toggle
  // starts from the freshly-selected preset's values, not the previous one's.
  const changePreset = (id: string) => {
    const preset = initialStandards.presets.find((p) => p.id === id);
    if (!preset) return;
    const p = preset.parameters;
    setState((s) => ({
      ...s,
      presetId: id,
      customMortarThickness: p.mortarThickness,
      customMortarRatio: p.mortarRatio,
      customWastagePercent: p.wastagePercent,
      customMortarWastagePercent: p.mortarWastagePercent,
      customMortarDryToWetFactor: p.mortarDryToWetFactor,
      customBrickL: p.brickSize.length,
      customBrickW: p.brickSize.width,
      customBrickH: p.brickSize.height,
    }));
  };

  const addOpening = () =>
    set("openings", [
      ...state.openings,
      {
        label: `Opening ${state.openings.length + 1}`,
        width: { value: "1", unit: "m" },
        height: { value: "1", unit: "m" },
      },
    ]);
  const removeOpening = (i: number) =>
    set(
      "openings",
      state.openings.filter((_, idx) => idx !== i),
    );
  const patchOpening = (i: number, patch: Partial<Opening>) =>
    set(
      "openings",
      state.openings.map((o, idx) => (idx === i ? { ...o, ...patch } : o)),
    );

  // ---- Client-side validation ---------------------------------------------
  //
  // The server is still the source of truth — but we shouldn't make a round
  // trip to learn that "door taller than wall" is nonsense. Errors here are
  // per-field, computed on every render, and shown inline. Submit is blocked
  // until they clear.
  //
  // Everything is normalised to meters for comparison so a 2100 mm door and
  // a 3 m wall compare correctly across units.
  const errors = useMemo(
    () => validateForm(state),
    [state],
  );
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<BrickActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<BrickRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;
    const req = toBrickRequest(state);
    startTransition(async () => {
      const res = await submitBrickCalculation(req);
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
            {(["wall", "volume"] as const).map((m) => (
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
                {m === "wall" ? "By wall dimensions" : "By total volume"}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Standards preset chooser */}
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold">Brick standard</legend>
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
            {initialStandards.presets.find((p) => p.id === state.presetId)?.description}
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

        {/* Wall or volume inputs */}
        {state.mode === "wall" ? (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">Wall dimensions</legend>
            <LabeledRow label="Length" error={errors.wallLength}>
              <QuantityInput
                value={state.wallLength}
                onChange={(q) => set("wallLength", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={100}
                step={0.1}
                decimals={2}
                ariaLabel="Wall length"
              />
            </LabeledRow>
            <LabeledRow label="Height" error={errors.wallHeight}>
              <QuantityInput
                value={state.wallHeight}
                onChange={(q) => set("wallHeight", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={20}
                step={0.1}
                decimals={2}
                ariaLabel="Wall height"
              />
            </LabeledRow>
            <LabeledRow label="Thickness" error={errors.wallThickness}>
              <QuantityInput
                value={state.wallThickness}
                onChange={(q) => set("wallThickness", q)}
                units={LENGTH_UNITS}
                min={50}
                max={500}
                step={5}
                decimals={0}
                ariaLabel="Wall thickness"
              />
            </LabeledRow>

            <div className="space-y-2 border-t border-black/10 pt-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Openings (doors, windows)</span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={addOpening}
                  type="button"
                >
                  + Add opening
                </Button>
              </div>
              {state.openings.length === 0 ? (
                <p className="text-xs text-black/50 dark:text-white/50">
                  No openings — the whole wall counts.
                </p>
              ) : (
                <div className="space-y-4">
                  {errors.openingsTotal ? (
                    <p
                      role="alert"
                      className="text-xs text-red-600 dark:text-red-400"
                    >
                      {errors.openingsTotal}
                    </p>
                  ) : null}
                  {state.openings.map((op, i) => (
                    <div
                      key={i}
                      className="rounded border border-black/10 p-3 dark:border-white/10"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <input
                          value={op.label ?? ""}
                          onChange={(e) => patchOpening(i, { label: e.target.value })}
                          placeholder="Label (optional)"
                          className="w-40 rounded border border-transparent bg-transparent px-1 py-0.5 text-sm focus:border-black/15 focus:outline-none dark:focus:border-white/20"
                        />
                        <button
                          type="button"
                          onClick={() => removeOpening(i)}
                          className="text-xs text-red-600 hover:underline dark:text-red-400"
                          aria-label={`Remove opening ${i + 1}`}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="space-y-2">
                        <LabeledRow label="Width" compact error={errors.openings?.[i]?.width}>
                          <QuantityInput
                            value={op.width}
                            onChange={(q) => patchOpening(i, { width: q })}
                            units={LENGTH_UNITS}
                            min={0.1}
                            max={20}
                            step={0.1}
                            decimals={2}
                            ariaLabel={`Opening ${i + 1} width`}
                          />
                        </LabeledRow>
                        <LabeledRow label="Height" compact error={errors.openings?.[i]?.height}>
                          <QuantityInput
                            value={op.height}
                            onChange={(q) => patchOpening(i, { height: q })}
                            units={LENGTH_UNITS}
                            min={0.1}
                            max={10}
                            step={0.1}
                            decimals={2}
                            ariaLabel={`Opening ${i + 1} height`}
                          />
                        </LabeledRow>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </fieldset>
        ) : (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">Total volume</legend>
            <LabeledRow label="Volume" error={errors.volume}>
              <QuantityInput
                value={state.volume}
                onChange={(q) => set("volume", q)}
                units={VOLUME_UNITS}
                min={0.1}
                max={500}
                step={0.1}
                decimals={2}
                ariaLabel="Total volume"
              />
            </LabeledRow>
          </fieldset>
        )}

        {/* Custom overrides */}
        {state.useCustom ? (
          <fieldset className="space-y-4 rounded border border-black/10 p-4 dark:border-white/10">
            <legend className="px-1 text-sm font-semibold">Custom parameters</legend>

            <LabeledRow label="Mortar thickness">
              <QuantityInput
                value={state.customMortarThickness}
                onChange={(q) => set("customMortarThickness", q)}
                units={LENGTH_UNITS}
                min={1}
                max={30}
                step={1}
                decimals={0}
                ariaLabel="Mortar joint thickness"
              />
            </LabeledRow>

            <LabeledRow label="Mortar ratio (cement : sand)">
              <input
                value={state.customMortarRatio}
                onChange={(e) => set("customMortarRatio", e.target.value)}
                placeholder="1:6"
                className="w-24 rounded border border-black/15 bg-white px-2 py-1.5 text-right font-mono text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
              />
            </LabeledRow>

            <LabeledRow label="Brick wastage %">
              <NumberSliderInput
                value={Number(state.customWastagePercent)}
                onChange={(n) => set("customWastagePercent", String(n))}
                min={0}
                max={20}
                step={0.5}
                decimals={1}
                suffix="%"
                ariaLabel="Brick wastage percent"
              />
            </LabeledRow>

            <LabeledRow label="Mortar wastage %">
              <NumberSliderInput
                value={Number(state.customMortarWastagePercent)}
                onChange={(n) => set("customMortarWastagePercent", String(n))}
                min={0}
                max={40}
                step={1}
                decimals={0}
                suffix="%"
                ariaLabel="Mortar wastage percent"
              />
            </LabeledRow>

            <LabeledRow label="Dry-to-wet factor">
              <NumberSliderInput
                value={Number(state.customMortarDryToWetFactor)}
                onChange={(n) => set("customMortarDryToWetFactor", String(n))}
                min={1}
                max={1.6}
                step={0.01}
                decimals={2}
                ariaLabel="Mortar dry-to-wet bulking factor"
              />
            </LabeledRow>

            <div className="border-t border-black/10 pt-3 dark:border-white/10">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-black/60 dark:text-white/60">
                Brick size
              </p>
              <div className="space-y-2">
                <LabeledRow label="Length" compact>
                  <QuantityInput
                    value={state.customBrickL}
                    onChange={(q) => set("customBrickL", q)}
                    units={LENGTH_UNITS}
                    min={50}
                    max={800}
                    step={5}
                    decimals={0}
                    ariaLabel="Custom brick length"
                  />
                </LabeledRow>
                <LabeledRow label="Width" compact>
                  <QuantityInput
                    value={state.customBrickW}
                    onChange={(q) => set("customBrickW", q)}
                    units={LENGTH_UNITS}
                    min={50}
                    max={400}
                    step={5}
                    decimals={0}
                    ariaLabel="Custom brick width"
                  />
                </LabeledRow>
                <LabeledRow label="Height" compact>
                  <QuantityInput
                    value={state.customBrickH}
                    onChange={(q) => set("customBrickH", q)}
                    units={LENGTH_UNITS}
                    min={50}
                    max={400}
                    step={5}
                    decimals={0}
                    ariaLabel="Custom brick height"
                  />
                </LabeledRow>
              </div>
            </div>
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

      {/* Result panel */}
      <aside aria-live="polite" className="md:sticky md:top-6 md:self-start">
        {result?.ok ? (
          <>
            <BrickResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="brick"
                request={savedRequest as unknown as Record<string, unknown>}
                result={result.data as unknown as Record<string, unknown>}
              />
            </div>
          </>
        ) : (
          <div className="rounded border border-dashed border-black/15 p-6 text-sm text-black/60 dark:border-white/20 dark:text-white/60">
            {isPending
              ? "Calculating…"
              : "Fill the form and press Calculate to see your material list."}
          </div>
        )}
      </aside>
    </div>
  );
}

// ---- helpers ------------------------------------------------------------

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
