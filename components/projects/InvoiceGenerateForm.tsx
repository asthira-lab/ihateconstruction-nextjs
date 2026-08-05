"use client";

// Form to generate an invoice from a quotation. Quotation picker + optional name, due date, notes.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { generateInvoiceAction } from "@/app/projects/[id]/invoices/actions";

interface Quotation {
  id: string;
  name: string;
  grandTotal: string;
}

interface Props {
  projectId: string;
  quotations: Quotation[];
}

export function InvoiceGenerateForm({ projectId, quotations }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [quotationId, setQuotationId] = useState(quotations[0]?.id ?? "");
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  const selected = quotations.find((q) => q.id === quotationId);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload: Record<string, unknown> = { quotationId };
      if (name.trim()) payload.name = name.trim();
      if (dueDate) payload.dueDate = dueDate;
      if (notes.trim()) payload.notes = notes.trim();

      const res = await generateInvoiceAction(projectId, payload);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      router.push(`/projects/${projectId}/invoices/${res.data.id}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-5">
      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-black/60 dark:text-white/60">
          Source Quotation
        </label>
        <select
          value={quotationId}
          onChange={(e) => setQuotationId(e.target.value)}
          className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-black"
        >
          {quotations.map((q) => (
            <option key={q.id} value={q.id}>
              {q.name} — {q.grandTotal}
            </option>
          ))}
        </select>
        {selected ? (
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">Grand total: {selected.grandTotal}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-black/60 dark:text-white/60">
          Invoice Name (optional)
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Auto-generated from quotation name"
          maxLength={200}
          className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-black"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-black/60 dark:text-white/60">
          Due Date (optional)
        </label>
        <input
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-black"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-black/60 dark:text-white/60">
          Notes (optional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-black"
        />
      </div>

      {error ? <FieldError message={error} /> : null}

      <Button type="submit" disabled={pending || !quotationId}>
        {pending ? "Generating…" : "Generate Invoice"}
      </Button>
    </form>
  );
}
