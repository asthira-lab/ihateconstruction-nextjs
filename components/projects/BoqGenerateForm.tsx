// BOQ generate form — materials-based with optional calculations

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { generateBoqAction } from "@/app/[lang]/projects/[id]/boqs/actions";

interface CalcOption {
  id: string;
  label: string;
  calculator: string;
  group: string | null;
}

interface Props {
  projectId: string;
  calculations?: CalcOption[];
  materialCount?: number;
}

export function BoqGenerateForm({ projectId, calculations = [], materialCount = 0 }: Props) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [includeCalcs, setIncludeCalcs] = useState(false);
  const [selectedCalcIds, setSelectedCalcIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function toggleCalc(id: string) {
    setSelectedCalcIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: Record<string, unknown> = {};
    if (name.trim()) payload.name = name.trim();
    payload.notes = notes.trim() || null;
    payload.includeCalculations = includeCalcs;

    if (includeCalcs && selectedCalcIds.size > 0) {
      payload.calculationIds = Array.from(selectedCalcIds);
    }

    startTransition(async () => {
      const res = await generateBoqAction(projectId, payload);
      if (!res.ok) { setError(res.error.message); return; }
      router.push(`/projects/${projectId}/boqs/${res.data.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      <div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">BOQ Name</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} placeholder='e.g. "BOQ v1 — as-designed"' className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 disabled:opacity-60 dark:border-white/15 dark:bg-black dark:text-white dark:focus:ring-white" disabled={pending} />
        </label>
        <p className="mt-1 text-xs text-black/50 dark:text-white/50">Leave blank for auto-generated name</p>
      </div>

      <div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Notes</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={3} placeholder="e.g. Excludes site preparation and boundary wall." className="w-full resize-y rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 disabled:opacity-60 dark:border-white/15 dark:bg-black dark:text-white dark:focus:ring-white" disabled={pending} />
        </label>
      </div>

      {/* Data source info */}
      <div className="rounded-lg border border-black/10 bg-black/[.02] p-4 dark:border-white/10 dark:bg-white/[.02]">
        <h3 className="text-sm font-medium">Data Source</h3>
        <p className="mt-1 text-xs text-black/60 dark:text-white/60">
          BOQ will be generated from your project&apos;s <strong>{materialCount} material{materialCount === 1 ? "" : "s"}</strong> with their quantities and prices.
        </p>

        {materialCount === 0 && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            No materials added yet. Add materials to your project before generating a BOQ.
          </p>
        )}
      </div>

      {/* Optional: include calculations */}
      {calculations.length > 0 && (
        <div className="rounded-lg border border-black/10 bg-black/[.02] p-4 dark:border-white/10 dark:bg-white/[.02]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={includeCalcs} onChange={(e) => setIncludeCalcs(e.target.checked)} disabled={pending} className="h-4 w-4 rounded border-black/20 dark:border-white/20" />
            <span className="text-sm font-medium">Also include saved calculations</span>
          </label>
          <p className="mt-1 ml-6 text-xs text-black/60 dark:text-white/60">
            Adds a separate section with material quantities derived from your calculator results.
          </p>

          {includeCalcs && (
            <div className="mt-3 ml-6 space-y-2">
              <p className="text-xs text-black/50 dark:text-white/50">Select which calculations to include (leave all unchecked for all):</p>
              {calculations.map((calc) => (
                <label key={calc.id} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedCalcIds.has(calc.id)} onChange={() => toggleCalc(calc.id)} disabled={pending} className="h-3.5 w-3.5 rounded border-black/20 dark:border-white/20" />
                  <span className="text-sm">{calc.label} <span className="text-black/50 dark:text-white/50">({calc.calculator}{calc.group ? ` · ${calc.group}` : ""})</span></span>
                </label>
              ))}
            </div>
          )}
        </div>
      )}

      {error ? <FieldError message={error} /> : null}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={pending || materialCount === 0}>
          {pending ? "Generating…" : "Generate BOQ"}
        </Button>
      </div>
    </form>
  );
}
