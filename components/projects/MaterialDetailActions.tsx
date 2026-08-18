"use client";

// Delete button for a material.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { deleteMaterialAction } from "@/app/[lang]/projects/[id]/materials/actions";

export function MaterialDetailActions({ materialId, projectId }: { materialId: string; projectId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function confirmDelete() {
    if (!window.confirm("Delete this material? Existing quotations remain unaffected.")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteMaterialAction(materialId);
      if (!res.ok) setError(res.error.message);
      else router.push(`/projects/${projectId}/materials`);
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <Button variant="danger" size="sm" onClick={confirmDelete} disabled={pending}>
        Delete
      </Button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
