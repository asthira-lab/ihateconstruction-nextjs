"use client";

/**
 * PaintCalculatorForm — the client-side island.
 *
 * Renders the form, holds transient input state, calls the Server Action,
 * and paints the response. Contains ZERO business logic — every calculation
 * runs on the server.
 *
 * Two dynamic arrays make this form more moving-part than brick / concrete:
 *   - Openings (room mode only): doors / windows subtracted from wall area.
 *   - Layers (both modes): each row is one paint product application, with
 *     its own preset + optional custom coverage / wastage.
 */

import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { NumberSliderInput } from "@/components/ui/NumberSliderInput";
import { QuantityInput } from "@/components/ui/QuantityInput";
import { SaveToProjectButton } from "@/components/projects/SaveToProjectButton";
import { PaintResultCard } from "@/components/calculators/paint/ResultCard";
import type {
  AreaQuantity,
  LayerType,
  LengthQuantity,
  Opening,
  PaintActionResult,
  PaintLayer,
  PaintRequest,
  PaintStandardsResponse,
} from "@/features/calculators/paint";
import { lengthToMeters } from "@/features/calculators/paint/units";
import { submitPaintCalculation } from "./actions";

const LENGTH_UNITS = ["mm", "cm", "m", "ft", "in"] as const;
const AREA_UNITS = ["sqm", "sqft"] as const;
const LAYER_TYPES: readonly LayerType[] = [
  "primer",
  "finish",
  "putty",
  "sealer",
] as const;

interface PaintCalculatorFormProps {
  initialStandards: PaintStandardsResponse;
}

interface LayerRow {
  type: LayerType;
  coats: number;
  presetId: string;
  useCustom: boolean;
  // Only one of these is meaningful depending on the preset's kind.
  customCoverage: AreaQuantity;
  customKgPerSqm: string;
  customWastagePercent: string;
}

interface FormState {
  mode: "room" | "area";
  // Room mode fields.
  roomLength: LengthQuantity;
  roomWidth: LengthQuantity;
  roomHeight: LengthQuantity;
  includeCeiling: boolean;
  openings: Opening[];
  // Area mode fields.
  area: AreaQuantity;
  // Layers — shared across both modes.
  layers: LayerRow[];
}

// Default coverage shown when a putty preset is selected — used only for
// `customCoverage` seed so the AreaQuantity type stays populated even though
// putty rows do not send it.
const FALLBACK_COVERAGE: AreaQuantity = { value: "12", unit: "sqm" };

function makeLayerRow(
  standards: PaintStandardsResponse,
  presetId: string,
  type: LayerType,
  coats: number,
): LayerRow {
  const preset =
    standards.presets.find((p) => p.id === presetId) ?? standards.presets[0]!;
  const isPutty = preset.kind === "putty";
  return {
    type,
    coats,
    presetId: preset.id,
    useCustom: false,
    customCoverage: isPutty
      ? FALLBACK_COVERAGE
      : preset.parameters.coveragePerLitre,
    customKgPerSqm: isPutty ? preset.parameters.kgPerSqm : "1.2",
    customWastagePercent: preset.parameters.wastagePercent,
  };
}

function makeInitialState(standards: PaintStandardsResponse): FormState {
  return {
    mode: "room",
    roomLength: { value: "4.5", unit: "m" },
    roomWidth: { value: "3.6", unit: "m" },
    roomHeight: { value: "3.0", unit: "m" },
    includeCeiling: false,
    openings: [
      {
        label: "Door",
        width: { value: "0.9", unit: "m" },
        height: { value: "2.1", unit: "m" },
      },
    ],
    area: { value: "120", unit: "sqm" },
    layers: [makeLayerRow(standards, "interior-emulsion", "finish", 2)],
  };
}

// ---- validation ---------------------------------------------------------

interface FormErrors {
  roomLength?: string;
  roomWidth?: string;
  roomHeight?: string;
  area?: string;
  openings?: Array<{ width?: string; height?: string } | undefined>;
  openingsTotal?: string;
  layers?: Array<{ coats?: string; customCoverage?: string } | undefined>;
}

function parseNum(s: string): number {
  if (s.trim() === "") return NaN;
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

function validateForm(state: FormState): FormErrors {
  const errors: FormErrors = {};

  if (state.mode === "room") {
    const lenM = lengthToMeters(state.roomLength);
    const widM = lengthToMeters(state.roomWidth);
    const hgtM = lengthToMeters(state.roomHeight);

    if (!Number.isFinite(lenM) || lenM <= 0) {
      errors.roomLength = "Enter a length greater than 0.";
    } else if (lenM > 100) {
      errors.roomLength = "Length must be 100 m or less.";
    }

    if (!Number.isFinite(widM) || widM <= 0) {
      errors.roomWidth = "Enter a width greater than 0.";
    } else if (widM > 100) {
      errors.roomWidth = "Width must be 100 m or less.";
    }

    if (!Number.isFinite(hgtM) || hgtM <= 0) {
      errors.roomHeight = "Enter a height greater than 0.";
    } else if (hgtM > 20) {
      errors.roomHeight = "Height must be 20 m or less.";
    }

    // Openings check — width vs any wall (use max of length / width), height vs room height.
    const maxWallLen = Math.max(
      Number.isFinite(lenM) ? lenM : 0,
      Number.isFinite(widM) ? widM : 0,
    );
    const openingErrors: Array<
      { width?: string; height?: string } | undefined
    > = [];
    let openingsArea = 0;
    let anyOpeningError = false;
    state.openings.forEach((op, i) => {
      const wM = lengthToMeters(op.width);
      const hM = lengthToMeters(op.height);
      const e: { width?: string; height?: string } = {};
      if (!Number.isFinite(wM) || wM <= 0) {
        e.width = "Enter a width greater than 0.";
      } else if (maxWallLen > 0 && wM > maxWallLen) {
        e.width = "Opening is wider than the longest wall.";
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

    // Total openings vs walls (perimeter × height).
    const wallGross =
      Number.isFinite(lenM) && Number.isFinite(widM) && Number.isFinite(hgtM)
        ? 2 * (lenM + widM) * hgtM
        : NaN;
    if (Number.isFinite(wallGross) && openingsArea > wallGross) {
      errors.openingsTotal = "Total openings area exceeds the wall area.";
    }
  } else {
    const v = parseNum(state.area.value);
    if (!Number.isFinite(v) || v <= 0) {
      errors.area = "Enter an area greater than 0.";
    }
  }

  // Layers — coats ≥ 1 and coverage / kg-per-sqm > 0 when custom is on.
  const layerErrors: Array<
    { coats?: string; customCoverage?: string } | undefined
  > = [];
  let anyLayerError = false;
  state.layers.forEach((l, i) => {
    const e: { coats?: string; customCoverage?: string } = {};
    if (!Number.isFinite(l.coats) || l.coats < 1) {
      e.coats = "At least 1 coat.";
    }
    if (l.useCustom) {
      if (l.type === "putty") {
        const k = parseNum(l.customKgPerSqm);
        if (!Number.isFinite(k) || k <= 0) {
          e.customCoverage = "Enter a kg/sqm greater than 0.";
        }
      } else {
        const cov = parseNum(l.customCoverage.value);
        if (!Number.isFinite(cov) || cov <= 0) {
          e.customCoverage = "Enter a coverage greater than 0.";
        }
      }
    }
    if (Object.keys(e).length > 0) {
      layerErrors[i] = e;
      anyLayerError = true;
    }
  });
  if (anyLayerError) errors.layers = layerErrors;

  return errors;
}

function toPaintRequest(state: FormState): PaintRequest {
  const layers: PaintLayer[] = state.layers.map((l) => ({
    type: l.type,
    coats: l.coats,
    standard: l.useCustom
      ? {
          preset: l.presetId,
          custom:
            l.type === "putty"
              ? {
                  kgPerSqm: l.customKgPerSqm,
                  wastagePercent: l.customWastagePercent,
                }
              : {
                  coveragePerLitre: l.customCoverage,
                  wastagePercent: l.customWastagePercent,
                },
        }
      : { preset: l.presetId },
  }));

  if (state.mode === "room") {
    return {
      mode: "room",
      room: {
        length: state.roomLength,
        width: state.roomWidth,
        height: state.roomHeight,
        includeCeiling: state.includeCeiling,
      },
      openings: state.openings,
      layers,
    };
  }
  return {
    mode: "area",
    area: state.area,
    layers,
  };
}

// ---- component ----------------------------------------------------------

export function PaintCalculatorForm({
  initialStandards,
}: PaintCalculatorFormProps) {
  const [state, setState] = useState<FormState>(() =>
    makeInitialState(initialStandards),
  );

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  // --- openings helpers ---
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

  // --- layer helpers ---
  const addLayer = () =>
    set("layers", [
      ...state.layers,
      makeLayerRow(initialStandards, "acrylic-primer", "primer", 1),
    ]);
  const removeLayer = (i: number) => {
    if (state.layers.length <= 1) return; // keep at least one
    set(
      "layers",
      state.layers.filter((_, idx) => idx !== i),
    );
  };
  const patchLayer = (i: number, patch: Partial<LayerRow>) =>
    set(
      "layers",
      state.layers.map((l, idx) => (idx === i ? { ...l, ...patch } : l)),
    );
  /** Changing the preset resets the custom fields to that preset's defaults. */
  const changeLayerPreset = (i: number, presetId: string) => {
    const preset = initialStandards.presets.find((p) => p.id === presetId);
    if (!preset) return;
    const isPutty = preset.kind === "putty";
    patchLayer(i, {
      presetId,
      customCoverage: isPutty
        ? FALLBACK_COVERAGE
        : preset.parameters.coveragePerLitre,
      customKgPerSqm: isPutty ? preset.parameters.kgPerSqm : "1.2",
      customWastagePercent: preset.parameters.wastagePercent,
    });
  };
  // Switching the layer type may leave the preset mismatched — snap to a
  // preset of the right kind so the request is always internally consistent.
  const changeLayerType = (i: number, type: LayerType) => {
    const currentRow = state.layers[i];
    if (!currentRow) return;
    const currentPreset = initialStandards.presets.find(
      (p) => p.id === currentRow.presetId,
    );
    const wantPuttyKind = type === "putty";
    const alreadyMatches =
      currentPreset && (currentPreset.kind === "putty") === wantPuttyKind;
    if (alreadyMatches) {
      patchLayer(i, { type });
      return;
    }
    const target = initialStandards.presets.find(
      (p) => (p.kind === "putty") === wantPuttyKind,
    );
    if (!target) {
      patchLayer(i, { type });
      return;
    }
    const isPutty = target.kind === "putty";
    patchLayer(i, {
      type,
      presetId: target.id,
      customCoverage: isPutty
        ? FALLBACK_COVERAGE
        : target.parameters.coveragePerLitre,
      customKgPerSqm: isPutty ? target.parameters.kgPerSqm : "1.2",
      customWastagePercent: target.parameters.wastagePercent,
    });
  };

  const errors = useMemo(() => validateForm(state), [state]);
  const hasErrors = Object.keys(errors).length > 0;

  const [result, setResult] = useState<PaintActionResult | null>(null);
  const [savedRequest, setSavedRequest] = useState<PaintRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasErrors) return;
    const req = toPaintRequest(state);
    startTransition(async () => {
      const res = await submitPaintCalculation(req);
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
            {(["room", "area"] as const).map((m) => (
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
                {m === "room" ? "By room dimensions" : "By total area"}
              </button>
            ))}
          </div>
        </fieldset>

        {/* Room or area inputs */}
        {state.mode === "room" ? (
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold">Room dimensions</legend>
            <LabeledRow label="Length" error={errors.roomLength}>
              <QuantityInput
                value={state.roomLength}
                onChange={(q) => set("roomLength", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={100}
                step={0.1}
                decimals={2}
                ariaLabel="Room length"
              />
            </LabeledRow>
            <LabeledRow label="Width" error={errors.roomWidth}>
              <QuantityInput
                value={state.roomWidth}
                onChange={(q) => set("roomWidth", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={100}
                step={0.1}
                decimals={2}
                ariaLabel="Room width"
              />
            </LabeledRow>
            <LabeledRow label="Height" error={errors.roomHeight}>
              <QuantityInput
                value={state.roomHeight}
                onChange={(q) => set("roomHeight", q)}
                units={LENGTH_UNITS}
                min={0.1}
                max={20}
                step={0.1}
                decimals={2}
                ariaLabel="Room height"
              />
            </LabeledRow>
            <label className="flex cursor-pointer items-center gap-2 pt-1 text-sm">
              <input
                type="checkbox"
                checked={state.includeCeiling}
                onChange={(e) => set("includeCeiling", e.target.checked)}
                className="accent-black dark:accent-white"
              />
              Include ceiling
            </label>

            {/* Openings */}
            <div className="space-y-2 border-t border-black/10 pt-4 dark:border-white/10">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">
                  Openings (doors, windows)
                </span>
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
                          onChange={(e) =>
                            patchOpening(i, { label: e.target.value })
                          }
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
                        <LabeledRow
                          label="Width"
                          compact
                          error={errors.openings?.[i]?.width}
                        >
                          <QuantityInput
                            value={op.width}
                            onChange={(q) => patchOpening(i, { width: q })}
                            units={LENGTH_UNITS}
                            min={0.05}
                            max={10}
                            step={0.05}
                            decimals={2}
                            ariaLabel={`Opening ${i + 1} width`}
                          />
                        </LabeledRow>
                        <LabeledRow
                          label="Height"
                          compact
                          error={errors.openings?.[i]?.height}
                        >
                          <QuantityInput
                            value={op.height}
                            onChange={(q) => patchOpening(i, { height: q })}
                            units={LENGTH_UNITS}
                            min={0.05}
                            max={10}
                            step={0.05}
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
            <legend className="text-sm font-semibold">Total area</legend>
            <LabeledRow label="Area" error={errors.area}>
              <QuantityInput
                value={state.area}
                onChange={(q) => set("area", q)}
                units={AREA_UNITS}
                min={1}
                max={100_000}
                step={1}
                decimals={2}
                ariaLabel="Total paintable area"
              />
            </LabeledRow>
          </fieldset>
        )}

        {/* Layers */}
        <fieldset className="space-y-4">
          <div className="flex items-center justify-between">
            <legend className="text-sm font-semibold">Paint layers</legend>
            <Button
              variant="secondary"
              size="sm"
              onClick={addLayer}
              type="button"
            >
              + Add layer
            </Button>
          </div>
          <p className="text-xs text-black/60 dark:text-white/60">
            One row per product application — e.g. one primer + one finish for
            a fresh wall.
          </p>
          <div className="space-y-4">
            {state.layers.map((layer, i) => {
              const preset = initialStandards.presets.find(
                (p) => p.id === layer.presetId,
              );
              return (
                <div
                  key={i}
                  className="space-y-3 rounded border border-black/10 p-4 dark:border-white/10"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-semibold">
                      Layer {i + 1}
                    </span>
                    {state.layers.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => removeLayer(i)}
                        className="text-xs text-red-600 hover:underline dark:text-red-400"
                        aria-label={`Remove layer ${i + 1}`}
                      >
                        Remove
                      </button>
                    ) : null}
                  </div>

                  <LabeledRow label="Type" compact>
                    <select
                      value={layer.type}
                      onChange={(e) =>
                        changeLayerType(i, e.target.value as LayerType)
                      }
                      className="w-32 rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
                    >
                      {LAYER_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </LabeledRow>

                  <LabeledRow
                    label="Coats"
                    compact
                    error={errors.layers?.[i]?.coats}
                  >
                    <NumberSliderInput
                      value={layer.coats}
                      onChange={(n) => patchLayer(i, { coats: n })}
                      min={1}
                      max={5}
                      step={1}
                      decimals={0}
                      ariaLabel={`Layer ${i + 1} coats`}
                    />
                  </LabeledRow>

                  <LabeledRow label="Preset" compact>
                    <select
                      value={layer.presetId}
                      onChange={(e) => changeLayerPreset(i, e.target.value)}
                      className="w-full rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
                    >
                      {initialStandards.presets.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </LabeledRow>
                  {preset ? (
                    <p className="text-xs text-black/60 dark:text-white/60">
                      {preset.description}
                    </p>
                  ) : null}

                  <label className="flex cursor-pointer items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={layer.useCustom}
                      onChange={(e) =>
                        patchLayer(i, { useCustom: e.target.checked })
                      }
                      className="accent-black dark:accent-white"
                    />
                    Customise this layer
                  </label>

                  {layer.useCustom ? (
                    <div className="space-y-3 rounded border border-black/10 p-3 dark:border-white/10">
                      {preset?.kind === "putty" ? (
                        <LabeledRow
                          label="kg / sqm"
                          compact
                          error={errors.layers?.[i]?.customCoverage}
                        >
                          <input
                            type="number"
                            value={layer.customKgPerSqm}
                            onChange={(e) =>
                              patchLayer(i, { customKgPerSqm: e.target.value })
                            }
                            min={0.1}
                            max={5}
                            step={0.1}
                            className="w-32 rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black dark:border-white/20 dark:bg-black dark:text-white"
                            aria-label={`Layer ${i + 1} kg per sqm`}
                          />
                        </LabeledRow>
                      ) : (
                        <LabeledRow
                          label="Coverage / L"
                          compact
                          error={errors.layers?.[i]?.customCoverage}
                        >
                          <QuantityInput
                            value={layer.customCoverage}
                            onChange={(q) =>
                              patchLayer(i, { customCoverage: q })
                            }
                            units={AREA_UNITS}
                            min={1}
                            max={100}
                            step={0.5}
                            decimals={1}
                            ariaLabel={`Layer ${i + 1} coverage per litre`}
                          />
                        </LabeledRow>
                      )}
                      <LabeledRow label="Wastage" compact>
                        <NumberSliderInput
                          value={Number(layer.customWastagePercent)}
                          onChange={(n) =>
                            patchLayer(i, {
                              customWastagePercent: String(n),
                            })
                          }
                          min={0}
                          max={50}
                          step={0.5}
                          decimals={1}
                          suffix="%"
                          ariaLabel={`Layer ${i + 1} wastage percent`}
                        />
                      </LabeledRow>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </fieldset>

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
            <PaintResultCard data={result.data} />
            <div className="mt-3 flex justify-end">
              <SaveToProjectButton
                calculator="paint"
                request={savedRequest as unknown as Record<string, unknown>}
                result={result.data as unknown as Record<string, unknown>}
              />
            </div>
          </>
        ) : (
          <div className="rounded border border-dashed border-black/15 p-6 text-sm text-black/60 dark:border-white/20 dark:text-white/60">
            {isPending
              ? "Calculating…"
              : "Fill the form and press Calculate to see your paint quote."}
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
