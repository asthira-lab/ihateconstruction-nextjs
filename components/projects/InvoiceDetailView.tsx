"use client";

// Invoice detail view with status badge, amounts, record-payment form, and delete.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { recordPaymentAction, deleteInvoiceAction } from "@/app/[lang]/projects/[id]/invoices/actions";
import type { Invoice } from "@/features/project-invoices";

interface Props {
  invoice: Invoice;
  projectId: string;
}

export function InvoiceDetailView({ invoice, projectId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [deleting, setDeleting] = useState(false);

  const remaining = (parseFloat(invoice.amountDue) - parseFloat(invoice.amountPaid)).toFixed(2);

  function handleRecordPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload: Record<string, unknown> = { amount: payAmount };
      if (payNotes.trim()) payload.notes = payNotes.trim();
      const res = await recordPaymentAction(invoice.id, payload);
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setPayAmount("");
      setPayNotes("");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    setDeleting(true);
    startTransition(async () => {
      const res = await deleteInvoiceAction(invoice.id);
      if (!res.ok) {
        setError(res.error.message);
        setDeleting(false);
        return;
      }
      router.push(`/projects/${projectId}/invoices`);
      router.refresh();
    });
  }

  const statusColors: Record<string, string> = {
    unpaid: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };

  return (
    <div className="space-y-8">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-lg font-medium">{invoice.invoiceNumber}</span>
            <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium uppercase ${statusColors[invoice.status] ?? ""}`}>
              {invoice.status}
            </span>
          </div>
          <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{invoice.name}</h1>
          {invoice.clientName ? (
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">
              {invoice.clientName}
              {invoice.clientEmail ? ` · ${invoice.clientEmail}` : ""}
              {invoice.clientPhone ? ` · ${invoice.clientPhone}` : ""}
            </p>
          ) : null}
        </div>
        <div className="flex gap-2">
          <a href={`/api/pdf/invoice/${invoice.id}`} download>
            <Button variant="secondary" size="sm">PDF</Button>
          </a>
          <Button variant="secondary" size="sm" onClick={handleDelete} disabled={deleting || pending}>
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Amount Due</p>
          <p className="mt-2 text-xl font-semibold">{invoice.currency} {invoice.amountDue}</p>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Amount Paid</p>
          <p className="mt-2 text-xl font-semibold">{invoice.currency} {invoice.amountPaid}</p>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Remaining</p>
          <p className="mt-2 text-xl font-semibold">{invoice.currency} {remaining}</p>
        </div>
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Due Date</p>
          <p className="mt-2 text-xl font-semibold">
            {invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString("en-IN") : "—"}
          </p>
        </div>
      </section>

      {invoice.status !== "paid" ? (
        <section className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-3 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Record Payment</h2>
          <form onSubmit={handleRecordPayment} className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-black/60 dark:text-white/60">Amount</label>
              <input
                type="text"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                placeholder="0.00"
                className="w-32 rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-black"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-xs text-black/60 dark:text-white/60">Notes (optional)</label>
              <input
                type="text"
                value={payNotes}
                onChange={(e) => setPayNotes(e.target.value)}
                placeholder="Payment reference…"
                maxLength={2000}
                className="w-full rounded border border-black/20 bg-white px-3 py-2 text-sm dark:border-white/20 dark:bg-black"
              />
            </div>
            <Button type="submit" size="sm" disabled={pending || !payAmount}>
              {pending ? "Saving…" : "Save Payment"}
            </Button>
          </form>
        </section>
      ) : null}

      {error ? <FieldError message={error} /> : null}

      {invoice.paymentNotes ? (
        <section className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Payment Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-black/80 dark:text-white/80">{invoice.paymentNotes}</p>
        </section>
      ) : null}

      {invoice.notes ? (
        <section className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-black/80 dark:text-white/80">{invoice.notes}</p>
        </section>
      ) : null}

      <section className="text-xs text-black/50 dark:text-white/50">
        Created {new Date(invoice.createdAt).toLocaleDateString("en-IN")} · Updated {new Date(invoice.updatedAt).toLocaleDateString("en-IN")}
        {invoice.paidAt ? ` · Paid ${new Date(invoice.paidAt).toLocaleDateString("en-IN")}` : ""}
      </section>
    </div>
  );
}
