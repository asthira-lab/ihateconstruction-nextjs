"use client";

// Shared create/edit form for materials. Unit dropdown narrows by type. Type + unit locked in edit mode.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import {
  createMaterialAction,
  patchMaterialAction,
} from "@/app/[lang]/projects/[id]/materials/actions";
import {
  MATERIAL_TYPES,
  MATERIAL_UNITS,
  unitsForType,
} from "@/features/project-materials";
import type { MaterialType, ProjectMaterial } from "@/features/project-materials";

type Mode = "create" | "edit";

// Optional prefill from URL params when arriving via "Import from calculation".
export interface MaterialSuggestionPrefill {
  type?: MaterialType;
  unit?: string;
  brand?: string;
  quantity?: string;
  // Human label like "540 bags" — shown as a note only, never persisted.
  quantityHint?: string;
  // Optional source label like the calculation's title, shown in the note.
  sourceLabel?: string;
}

interface Props {
  mode: Mode;
  projectId: string;
  currency: string;
  initial?: ProjectMaterial;
  prefill?: MaterialSuggestionPrefill;
}

interface FormState {
  type: MaterialType;
  brand: string;
  unit: string;
  unitPrice: string;
  quantity: string;
  vendor: string;
  notes: string;
}

function initialFormState(currency: string, m?: ProjectMaterial, p?: MaterialSuggestionPrefill): FormState {
  if (m) {
    return {
      type: m.type,
      brand: m.brand ?? "",
      unit: m.unit,
      unitPrice: m.unitPrice,
      quantity: m.quantity ?? "",
      vendor: m.vendor ?? "",
      notes: m.notes ?? "",
    };
  }
  // Use prefill values when supplied and valid; otherwise fall back to defaults.
  const requested = p?.type;
  const type: MaterialType =
    requested && (MATERIAL_TYPES as readonly string[]).includes(requested) ? requested : MATERIAL_TYPES[0];
  const allowed = MATERIAL_UNITS[type];
  const requestedUnit = p?.unit;
  const unit =
    requestedUnit && allowed.includes(requestedUnit) ? requestedUnit : (allowed[0] ?? "");
  return {
    type,
    brand: p?.brand ?? "",
    unit,
    unitPrice: "",
    quantity: p?.quantity ?? "",
    vendor: "",
    notes: "",
  };
}

export function MaterialForm({ mode, projectId, currency, initial, prefill }: Props) {
  const router = useRouter();
  const [state, setState] = useState<FormState>(() => initialFormState(currency, initial, prefill));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isCreate = mode === "create";
  const allowedUnits = unitsForType(state.type);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  function changeType(next: MaterialType) {
    const nextUnits = unitsForType(next);
    setState((s) => ({
      ...s,
      type: next,
      unit: nextUnits.includes(s.unit) ? s.unit : (nextUnits[0] ?? ""),
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      if (isCreate) {
        const res = await createMaterialAction(projectId, {
          type: state.type,
          brand: state.brand.trim() || null,
          unit: state.unit,
          unitPrice: state.unitPrice.trim(),
          quantity: state.quantity.trim() || null,
          vendor: state.vendor.trim() || null,
          notes: state.notes.trim() || null,
        });
        if (!res.ok) {
          setError(res.error.message);
          return;
        }
        router.push(`/projects/${projectId}/materials`);
      } else if (initial) {
        const patch: Record<string, unknown> = {};
        if (state.brand.trim() !== (initial.brand ?? "")) patch.brand = state.brand.trim() || null;
        if (state.unitPrice.trim() !== initial.unitPrice) patch.unitPrice = state.unitPrice.trim();
        if (state.quantity.trim() !== (initial.quantity ?? "")) patch.quantity = state.quantity.trim() || null;
        if (state.vendor.trim() !== (initial.vendor ?? "")) patch.vendor = state.vendor.trim() || null;
        if (state.notes.trim() !== (initial.notes ?? "")) patch.notes = state.notes.trim() || null;
        // Always navigate back to materials list, even if no changes
        if (Object.keys(patch).length === 0) {
          router.push(`/projects/${projectId}/materials`);
          return;
        }
        const res = await patchMaterialAction(initial.id, patch);
        if (!res.ok) {
          setError(res.error.message);
          return;
        }
        router.push(`/projects/${projectId}/materials`);
        router.refresh();
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {isCreate && prefill && (prefill.quantityHint || prefill.sourceLabel) ? (
        <div className="rounded border border-black/10 bg-black/[.03] px-3 py-2 text-xs text-black/70 dark:border-white/10 dark:bg-white/[.04] dark:text-white/70">
          Suggested from{prefill.sourceLabel ? ` “${prefill.sourceLabel}”` : " a calculation"}
          {prefill.quantityHint ? ` · needs ≈ ${prefill.quantityHint}` : ""}. Enter your price and save.
        </div>
      ) : null}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Row label="Type" required>
          <select
            value={state.type}
            onChange={(e) => changeType(e.target.value as MaterialType)}
            disabled={!isCreate}
            className={inputClass}
          >
            {MATERIAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          {!isCreate ? (
            <p className="mt-1 text-xs text-black/50 dark:text-white/50">Type is fixed after creation.</p>
          ) : null}
        </Row>
        <Row label="Unit" required>
          <select
            value={state.unit}
            onChange={(e) => set("unit", e.target.value)}
            disabled={!isCreate}
            className={inputClass}
          >
            {allowedUnits.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>
          {!isCreate ? (
            <p className="mt-1 text-xs text-black/50 dark:text-white/50">Unit is fixed after creation.</p>
          ) : null}
        </Row>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Row label="Brand">
          <input
            type="text"
            value={state.brand}
            onChange={(e) => set("brand", e.target.value)}
            maxLength={200}
            className={inputClass}
          />
        </Row>
        <Row label={`Unit price (${currency})`} required>
          <input
            type="text"
            inputMode="decimal"
            value={state.unitPrice}
            onChange={(e) => set("unitPrice", e.target.value)}
            required
            placeholder="380.00"
            className={inputClass}
          />
        </Row>
      </div>

      <Row label={`Quantity (${state.unit || "unit"})`}>
        <input
          type="text"
          inputMode="decimal"
          value={state.quantity}
          onChange={(e) => set("quantity", e.target.value)}
          maxLength={20}
          placeholder="e.g. 12"
          className={inputClass}
        />
        {state.quantity && state.unitPrice ? (
          <p className="mt-1 text-xs text-black/60 dark:text-white/60">
            Total: {currency}{" "}
            {(Number(state.quantity) * Number(state.unitPrice)).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        ) : null}
      </Row>

      <Row label="Vendor">
        <input
          type="text"
          value={state.vendor}
          onChange={(e) => set("vendor", e.target.value)}
          maxLength={200}
          className={inputClass}
        />
      </Row>

      <Row label="Notes">
        <textarea
          value={state.notes}
          onChange={(e) => set("notes", e.target.value)}
          maxLength={2000}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </Row>

      {error ? <FieldError message={error} /> : null}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Saving…" : isCreate ? "Add material" : "Save changes"}
        </Button>
        <Button type="button" variant="secondary" onClick={() => router.back()} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-black dark:text-white dark:focus:ring-white";

function Row({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}
        {required ? <span className="ml-0.5 text-red-600" aria-hidden="true">*</span> : null}
      </span>
      {children}
    </label>
  );
}
