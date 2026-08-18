// Quotation detail view: header, status actions, pricing breakdown, sections/lines, delete

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Quotation } from "@/features/project-quotations";
import { deleteQuotationAction, updateStatusAction } from "@/app/[lang]/projects/[id]/quotations/actions";

interface Props {
  quotation: Quotation;
  projectId: string;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-black/[.06] text-black/60 dark:bg-white/[.08] dark:text-white/60",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
  expired: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
};

export function QuotationDetailView({ quotation, projectId }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleStatusChange(newStatus: string) {
    setError(null);
    startTransition(async () => {
      const res = await updateStatusAction(quotation.id, newStatus);
      if (!res.ok) { setError(res.error.message); return; }
      router.refresh();
    });
  }

  function handleDelete() {
    if (!confirm("Delete this quotation? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteQuotationAction(quotation.id);
      if (!res.ok) { setError(res.error.message); return; }
      router.push(`/projects/${projectId}/quotations`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{quotation.name}</h1>
            <span className={`rounded px-2 py-0.5 text-xs uppercase tracking-wider ${STATUS_COLORS[quotation.status] ?? ""}`}>
              {quotation.status}
            </span>
          </div>
          <p className="mt-1 text-sm text-black/70 dark:text-white/70">
            {quotation.quotationNumber} · {quotation.clientName ?? "No client"}
            {quotation.validUntil ? ` · Valid until ${new Date(quotation.validUntil).toLocaleDateString("en-IN")}` : ""}
          </p>
          <p className="mt-1 text-xs text-black/50 dark:text-white/50">
            Created {new Date(quotation.createdAt).toLocaleDateString("en-IN")}
            {quotation.sentAt ? ` · Sent ${new Date(quotation.sentAt).toLocaleDateString("en-IN")}` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${projectId}/quotations`}>
            <Button variant="secondary" size="sm" disabled={pending}>Back</Button>
          </Link>
          <a href={`/api/pdf/quotation/${quotation.id}`} download>
            <Button variant="secondary" size="sm">PDF</Button>
          </a>
          <Button variant="secondary" size="sm" onClick={handleDelete} disabled={pending} className="text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950">
            Delete
          </Button>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}

      {/* Status actions */}
      {quotation.status === "draft" && (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => handleStatusChange("sent")} disabled={pending}>
            Mark as Sent
          </Button>
        </div>
      )}
      {quotation.status === "sent" && (
        <div className="flex gap-2">
          <Button variant="primary" size="sm" onClick={() => handleStatusChange("accepted")} disabled={pending}>
            Mark Accepted
          </Button>
          <Button variant="secondary" size="sm" onClick={() => handleStatusChange("rejected")} disabled={pending}>
            Mark Rejected
          </Button>
        </div>
      )}

      {/* Pricing summary */}
      <div className="rounded-lg border border-black/10 bg-black/[.02] p-6 dark:border-white/10 dark:bg-white/[.02]">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">Pricing Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between"><span>Materials Subtotal</span><span>{quotation.currency} {quotation.materialsSubtotal}</span></div>
          <div className="flex justify-between text-green-700 dark:text-green-300"><span>+ Markup ({quotation.markupPercentage}%)</span><span>{quotation.currency} {quotation.markupAmount}</span></div>
          <div className="flex justify-between text-red-700 dark:text-red-300"><span>- Discount ({quotation.discountPercentage}%)</span><span>{quotation.currency} {quotation.discountAmount}</span></div>
          <div className="flex justify-between"><span>+ Tax ({quotation.taxPercentage}%)</span><span>{quotation.currency} {quotation.taxAmount}</span></div>
          <div className="flex justify-between border-t border-black/10 pt-2 text-lg font-semibold dark:border-white/10">
            <span>Grand Total</span><span>{quotation.currency} {quotation.grandTotal}</span>
          </div>
        </div>
      </div>

      {/* Client info */}
      {(quotation.clientName || quotation.clientEmail || quotation.clientPhone) && (
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">Client</h2>
          <div className="space-y-1 text-sm">
            {quotation.clientName && <p>{quotation.clientName}</p>}
            {quotation.clientEmail && <p className="text-black/60 dark:text-white/60">{quotation.clientEmail}</p>}
            {quotation.clientPhone && <p className="text-black/60 dark:text-white/60">{quotation.clientPhone}</p>}
          </div>
        </div>
      )}

      {/* Sections and lines */}
      <div className="space-y-4">
        {quotation.sections.map((section, sIdx) => (
          <div key={sIdx} className="rounded-lg border border-black/10 dark:border-white/10">
            <div className="border-b border-black/10 bg-black/[.02] px-4 py-3 dark:border-white/10 dark:bg-white/[.02]">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{section.group || "(Ungrouped)"}</h3>
                <span className="text-sm font-medium">{quotation.currency} {section.sectionSubtotal}</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/10 text-left text-xs font-medium text-black/60 dark:border-white/10 dark:text-white/60">
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2 text-right">Qty</th>
                    <th className="px-4 py-2 text-right">Unit</th>
                    <th className="px-4 py-2 text-right">Rate</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {section.lines.map((line) => (
                    <tr key={line.id} className="border-b border-black/5 dark:border-white/5">
                      <td className="px-4 py-2">
                        <div className="font-medium">{line.label}</div>
                        {line.description && <div className="text-xs text-black/60 dark:text-white/60">{line.description}</div>}
                      </td>
                      <td className="px-4 py-2 text-right">{line.quantity}</td>
                      <td className="px-4 py-2 text-right">{line.unit ?? "—"}</td>
                      <td className="px-4 py-2 text-right">{quotation.currency} {line.unitRate}</td>
                      <td className="px-4 py-2 text-right font-medium">{quotation.currency} {line.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Notes and terms */}
      {quotation.notes && (
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">Notes</h2>
          <p className="whitespace-pre-wrap text-sm text-black/80 dark:text-white/80">{quotation.notes}</p>
        </div>
      )}
      {quotation.terms && (
        <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">Terms & Conditions</h2>
          <p className="whitespace-pre-wrap text-sm text-black/80 dark:text-white/80">{quotation.terms}</p>
        </div>
      )}
    </div>
  );
}
