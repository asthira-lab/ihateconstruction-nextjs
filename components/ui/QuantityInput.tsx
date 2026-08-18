"use client";

import { NumberSliderInput } from "./NumberSliderInput";
import type { LengthUnit, VolumeUnit } from "@/features/calculators/brick";

/**
 * QuantityInput
 *
 * Combines a NumberSliderInput with a unit dropdown. Its value is the API's
 * Quantity shape `{ value: string, unit: string }` — value stringified to
 * match the backend's BigDecimal-friendly wire format.
 *
 * Parameterised on the union of allowed units so the same component serves
 * length quantities (mm/cm/m/ft/in) and volume quantities (cum/cft).
 */

export type Quantity<U extends string> = { value: string; unit: U };

export interface QuantityInputProps<U extends string> {
  value: Quantity<U>;
  onChange: (q: Quantity<U>) => void;
  units: readonly U[];
  min: number;
  max: number;
  step: number;
  decimals?: number;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
}

export function QuantityInput<U extends string>({
  value,
  onChange,
  units,
  min,
  max,
  step,
  decimals = 2,
  disabled,
  id,
  ariaLabel,
}: QuantityInputProps<U>) {
  const numeric = Number(value.value);
  const safeValue = Number.isFinite(numeric) ? numeric : min;

  return (
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <NumberSliderInput
          id={id}
          ariaLabel={ariaLabel}
          value={safeValue}
          onChange={(n) => onChange({ value: n.toFixed(decimals), unit: value.unit })}
          min={min}
          max={max}
          step={step}
          decimals={decimals}
          disabled={disabled}
        />
      </div>
      <select
        value={value.unit}
        onChange={(e) => onChange({ value: value.value, unit: e.target.value as U })}
        disabled={disabled}
        aria-label={ariaLabel ? `${ariaLabel} unit` : "Unit"}
        className="rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white dark:focus:ring-white"
      >
        {units.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
    </div>
  );
}

// Convenience aliases for the two units families we use.
export type LengthQuantityInputProps = Omit<QuantityInputProps<LengthUnit>, "units">;
export type VolumeQuantityInputProps = Omit<QuantityInputProps<VolumeUnit>, "units">;
