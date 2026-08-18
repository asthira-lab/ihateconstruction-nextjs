// Modal to add a new material to a project from BOQ detail view

"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { createMaterialAction } from "@/app/[lang]/projects/[id]/materials/actions";
import type { MaterialType } from "@/features/project-materials";

const MATERIAL_TYPES: MaterialType[] = [
  "cement",
  "sand",
  "aggregate",
  "brick",
  "steel",
  "tile",
  "paint",
  "adhesive",
  "grout",
  "putty",
  "labour",
  "other",
];

const UNITS_BY_TYPE: Record<MaterialType, readonly string[]> = {
  cement: ["bag", "kg", "ton"],
  sand: ["cft", "cum", "bag", "kg"],
  aggregate: ["cft", "cum", "kg"],
  brick: ["piece", "1000-pieces"],
  steel: ["kg", "ton", "meter", "sq-meter"],
  tile: ["sq-meter", "piece"],
  paint: ["liter", "kg"],
  adhesive: ["kg", "bag", "liter"],
  grout: ["kg", "bag", "liter"],
  putty: ["kg", "liter"],
  labour: ["day", "hour", "sq-meter"],
  other: ["piece", "kg", "liter", "meter"],
};

interface Props {
  projectId: string;
  currency: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddMaterialModal({ projectId, currency, isOpen, onClose, onSuccess }: Props) {
  const [type, setType] = useState<MaterialType>("cement");
  const [brand, setBrand] = useState("");
  const [unit, setUnit] = useState<string>("bag");
  const [unitPrice, setUnitPrice] = useState("");
  const [vendor, setVendor] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!isOpen) return null;

  const availableUnits = UNITS_BY_TYPE[type];
  if (availableUnits && !availableUnits.includes(unit)) {
    setUnit(availableUnits[0] as string);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!unitPrice.trim() || isNaN(parseFloat(unitPrice))) {
      setError("Valid unit price required");
      return;
    }

    const payload = {
      type,
      brand: brand.trim() || null,
      unit,
      unitPrice: parseFloat(unitPrice).toFixed(2),
      vendor: vendor.trim() || null,
    };

    startTransition(async () => {
      const res = await createMaterialAction(projectId, payload);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setType("cement");
      setBrand("");
      setUnit(UNITS_BY_TYPE.cement[0] as string);
      setUnitPrice("");
      setVendor("");
      onSuccess?.();
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg dark:bg-black">
        <h2 className="text-lg font-semibold mb-4">Add Material</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Type *</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as MaterialType);
                const units = UNITS_BY_TYPE[e.target.value as MaterialType];
                if (units && units.length > 0) {
                  setUnit(units[0] as string);
                }
              }}
              className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
              disabled={pending}
            >
              {MATERIAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Brand (optional)</label>
            <input
              type="text"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              maxLength={100}
              placeholder="e.g. UltraTech, ACC"
              className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
              disabled={pending}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Unit *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
                disabled={pending}
              >
                {availableUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Price per {unit} ({currency}) *
              </label>
              <input
                type="number"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                step="0.01"
                min="0"
                placeholder="0.00"
                className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
                disabled={pending}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Vendor (optional)</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              maxLength={100}
              placeholder="e.g. Local supplier"
              className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
              disabled={pending}
            />
          </div>

          {error && (
            <div className="rounded bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" disabled={pending}>
              {pending ? "Adding…" : "Add Material"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
