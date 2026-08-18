"use client";

import { forwardRef, useCallback, useEffect, useState } from "react";

/**
 * NumberSliderInput
 *
 * A number input that pairs a native <input type="range"> slider with a native
 * <input type="number"> text field. Both stay in sync with the parent's
 * controlled `value`. Editing either updates both.
 *
 * The text field is the source of precision — you can type `2.15` even when
 * the slider step is `0.1`. The slider snaps to `step`; the text does not.
 *
 * Uses local state for the visible text so backspacing to "" doesn't fight
 * the controlled prop mid-edit. The parent only sees `onChange` when the
 * value is a valid finite number.
 */
export interface NumberSliderInputProps {
  value: number;
  onChange: (n: number) => void;
  min: number;
  max: number;
  step: number;
  /** Display precision for the text field (used on blur to normalise). */
  decimals?: number;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  /** Optional suffix rendered inside the text control (e.g. "m", "%"). */
  suffix?: string;
}

export const NumberSliderInput = forwardRef<HTMLInputElement, NumberSliderInputProps>(
  function NumberSliderInput(
    { value, onChange, min, max, step, decimals = 2, disabled, id, ariaLabel, suffix },
    ref,
  ) {
    // Local text state so partial edits like "" or "1." don't round-trip
    // through the parent as NaN.
    const [text, setText] = useState<string>(() => value.toFixed(decimals));

    // Reflect external value changes (e.g. preset switch reset the form).
    useEffect(() => {
      // Only sync if the external value diverges from our text's numeric form.
      const parsed = Number(text);
      if (!Number.isFinite(parsed) || Math.abs(parsed - value) > 1e-9) {
        setText(value.toFixed(decimals));
      }
      // Intentionally omitting `text` from deps: this effect exists to pull
      // external changes into the text; local edits already update text.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, decimals]);

    const commitNumber = useCallback(
      (n: number) => {
        if (!Number.isFinite(n)) return;
        const clamped = Math.min(max, Math.max(min, n));
        onChange(clamped);
      },
      [min, max, onChange],
    );

    const handleSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
      const n = Number(e.target.value);
      setText(n.toFixed(decimals));
      commitNumber(n);
    };

    const handleText = (e: React.ChangeEvent<HTMLInputElement>) => {
      const t = e.target.value;
      setText(t);
      const n = Number(t);
      if (t.trim() !== "" && Number.isFinite(n)) commitNumber(n);
    };

    const handleBlur = () => {
      const n = Number(text);
      if (!Number.isFinite(n) || text.trim() === "") {
        // Restore last valid value.
        setText(value.toFixed(decimals));
        return;
      }
      const clamped = Math.min(max, Math.max(min, n));
      setText(clamped.toFixed(decimals));
      onChange(clamped);
    };

    return (
      <div className="flex min-w-0 items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={Math.min(max, Math.max(min, value))}
          onChange={handleSlider}
          disabled={disabled}
          aria-label={ariaLabel}
          className="h-2 w-full min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-black/10 accent-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white/15 dark:accent-white"
        />
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type="number"
            inputMode="decimal"
            step="any"
            value={text}
            onChange={handleText}
            onBlur={handleBlur}
            disabled={disabled}
            aria-label={ariaLabel}
            className={`w-20 shrink-0 rounded border border-black/15 bg-white px-2 py-1.5 text-right font-mono text-sm tabular-nums text-black focus:border-black focus:outline-none focus:ring-1 focus:ring-black disabled:opacity-50 sm:w-24 dark:border-white/20 dark:bg-black dark:text-white dark:focus:border-white dark:focus:ring-white ${
              suffix ? "pr-7" : ""
            }`}
          />
          {suffix ? (
            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-xs text-black/50 dark:text-white/50">
              {suffix}
            </span>
          ) : null}
        </div>
      </div>
    );
  },
);
