// BOQ line override editor

"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { patchBoqAction } from "@/app/projects/[id]/boqs/actions";
import type { BoqLine } from "@/features/project-boqs";

interface Props {
  line: BoqLine;
  currency: string;
  onSave: () => void;
  onCancel: () => void;
  boqId?: string;
  projectId?: string;
}

export function BoqLineEditor({ line, currency, onSave, onCancel, boqId, projectId }: Props) {
  const router = useRouter();
  const [label, setLabel] = useState(line.override?.label || line.label);
  const [amount, setAmount] = useState(line.override?.amount || "");
  const [reason, setReason] = useState(line.override?.reason || "");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!boqId || !projectId) return;

    setError(null);

    startTransition(async () => {
      const res = await patchBoqAction(boqId, {
        lineOverrides: [
          {
            lineId: line.id,
            override: {
              label: label.trim() !== line.label ? label.trim() : undefined,
              amount: amount.trim(),
              reason: reason.trim() || undefined,
            },
          },
        ],
      });

      if (!res.ok) {
        setError(res.error.message);
        return;
      }

      router.refresh();
      onSave();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-black/15 bg-black/[.02] p-3 dark:border-white/15 dark:bg-white/[.02]">
      <div>
        <label className="block text-xs font-medium">Label</label>
        <input
          type="text"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          maxLength={200}
          placeholder={line.label}
          className="mt-1 w-full rounded border border-black/10 px-2 py-1 text-sm dark:border-white/10"
          disabled={pending}
        />
      </div>

      <div>
        <label className="block text-xs font-medium">Override Amount ({currency})</label>
        <input
          type="text"
          inputMode="decimal"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={line.subtotal}
          className="mt-1 w-full rounded border border-black/10 px-2 py-1 text-sm dark:border-white/10"
          disabled={pending}
        />
      </div>

      <div>
        <label className="block text-xs font-medium">Reason</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={500}
          rows={2}
          placeholder="e.g. Bulk discount from vendor for full order"
          className="mt-1 w-full resize-none rounded border border-black/10 px-2 py-1 text-sm dark:border-white/10"
          disabled={pending}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <div className="flex gap-2">
        <Button type="submit" variant="primary" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save override"}
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={onCancel} disabled={pending}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
