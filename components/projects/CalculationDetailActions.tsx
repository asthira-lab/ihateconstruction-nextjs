"use client";

// Recompute + delete buttons for a saved calculation.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  deleteCalculationAction,
  recomputeCalculationAction,
} from "@/app/projects/[id]/calculations/actions";
import type { SavedCalculation } from "@/features/project-calculations";

interface Props {
  calc: SavedCalculation;
  projectId: string;
}

export function CalculationDetailActions({ calc, projectId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function recompute() {
    setError(null);
    startTransition(async () => {
      const res = await recomputeCalculationAction(calc.id);
      if (!res.ok) setError(res.error.message);
      else router.refresh();
    });
  }

  function confirmDelete() {
    if (!window.confirm(`Delete calculation "${calc.label}"? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteCalculationAction(calc.id);
      if (!res.ok) setError(res.error.message);
      else router.push(`/projects/${projectId}/calculations`);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={recompute} disabled={pending}>
          {pending ? "…" : "Recompute"}
        </Button>
        <Button variant="danger" size="sm" onClick={confirmDelete} disabled={pending}>
          Delete
        </Button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
