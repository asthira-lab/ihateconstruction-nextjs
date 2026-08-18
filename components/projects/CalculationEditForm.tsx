"use client";

// Small edit form for label/description/group on a saved calculation.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { patchCalculationAction } from "@/app/[lang]/projects/[id]/calculations/actions";
import type { SavedCalculation } from "@/features/project-calculations";

export function CalculationEditForm({ calc }: { calc: SavedCalculation }) {
  const router = useRouter();
  const [label, setLabel] = useState(calc.label);
  const [description, setDescription] = useState(calc.description ?? "");
  const [group, setGroup] = useState(calc.group ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const patch: Record<string, unknown> = {};
    if (label.trim() !== calc.label) patch.label = label.trim();
    const nextDescription = description.trim() || null;
    if (nextDescription !== calc.description) patch.description = nextDescription;
    const nextGroup = group.trim() || null;
    if (nextGroup !== calc.group) patch.group = nextGroup;

    if (Object.keys(patch).length === 0) return;

    startTransition(async () => {
      const res = await patchCalculationAction(calc.id, patch);
      if (!res.ok) setError(res.error.message);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-black/10 p-4 dark:border-white/10">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Label</span>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            maxLength={200}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Group</span>
          <input
            type="text"
            value={group}
            onChange={(e) => setGroup(e.target.value)}
            maxLength={60}
            placeholder="e.g. Ground floor, First floor"
            className={inputClass}
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Description</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
          rows={3}
          className={`${inputClass} resize-y`}
        />
      </label>
      {error ? <FieldError message={error} /> : null}
      <div>
        <Button type="submit" variant="secondary" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 dark:border-white/15 dark:bg-black dark:text-white dark:focus:ring-white";
