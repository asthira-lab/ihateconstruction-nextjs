// Quotation generate form with BOQ picker, markup/discount/tax, and live total preview

"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { FieldError } from "@/components/ui/FieldError";
import { generateQuotationAction } from "@/app/projects/[id]/quotations/actions";

interface BoqOption {
  id: string;
  name: string;
  grandTotal: string;
  currency: string;
}

interface Props {
  projectId: string;
  currency: string;
  boqs: BoqOption[];
}

export function QuotationGenerateForm({ projectId, currency, boqs }: Props) {
  const router = useRouter();
  const [boqId, setBoqId] = useState(boqs[0]?.id ?? "");
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [markupPct, setMarkupPct] = useState("15");
  const [discountPct, setDiscountPct] = useState("0");
  const [taxPct, setTaxPct] = useState("18");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Live total preview
  const selectedBoq = boqs.find((b) => b.id === boqId);
  const subtotal = selectedBoq ? Number(selectedBoq.grandTotal) : 0;
  const markup = subtotal * (Number(markupPct) || 0) / 100;
  const afterMarkup = subtotal + markup;
  const discount = afterMarkup * (Number(discountPct) || 0) / 100;
  const afterDiscount = afterMarkup - discount;
  const tax = afterDiscount * (Number(taxPct) || 0) / 100;
  const grandTotal = afterDiscount + tax;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!boqId) { setError("Select a BOQ"); return; }

    const payload: Record<string, unknown> = { boqId };
    if (name.trim()) payload.name = name.trim();
    if (clientName.trim()) payload.clientName = clientName.trim();
    if (clientEmail.trim()) payload.clientEmail = clientEmail.trim();
    if (clientPhone.trim()) payload.clientPhone = clientPhone.trim();
    payload.markupPercentage = Number(markupPct) || 0;
    payload.discountPercentage = Number(discountPct) || 0;
    payload.taxPercentage = Number(taxPct) || 0;
    if (validUntil) payload.validUntil = validUntil;
    if (notes.trim()) payload.notes = notes.trim();
    if (terms.trim()) payload.terms = terms.trim();

    startTransition(async () => {
      const res = await generateQuotationAction(projectId, payload);
      if (!res.ok) { setError(res.error.message); return; }
      router.push(`/projects/${projectId}/quotations/${res.data.id}`);
    });
  }

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6">
      {/* BOQ picker */}
      <div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Source BOQ *</span>
          <select
            value={boqId}
            onChange={(e) => setBoqId(e.target.value)}
            className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black"
            disabled={pending}
          >
            {boqs.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.currency} {b.grandTotal}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* Client info */}
      <div className="rounded-lg border border-black/10 bg-black/[.02] p-4 dark:border-white/10 dark:bg-white/[.02]">
        <h3 className="text-sm font-medium">Client Details (optional)</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs">Name</span>
            <input type="text" value={clientName} onChange={(e) => setClientName(e.target.value)} maxLength={200} placeholder="Client name" className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black" disabled={pending} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs">Email</span>
            <input type="email" value={clientEmail} onChange={(e) => setClientEmail(e.target.value)} placeholder="client@example.com" className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black" disabled={pending} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs">Phone</span>
            <input type="text" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} maxLength={20} placeholder="+91 98765 43210" className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black" disabled={pending} />
          </label>
        </div>
      </div>

      {/* Pricing */}
      <div className="rounded-lg border border-black/10 bg-black/[.02] p-4 dark:border-white/10 dark:bg-white/[.02]">
        <h3 className="text-sm font-medium">Pricing</h3>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <label className="block">
            <span className="mb-1 block text-xs">Markup %</span>
            <input type="number" value={markupPct} onChange={(e) => setMarkupPct(e.target.value)} step="0.01" min="0" max="999" className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black" disabled={pending} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs">Discount %</span>
            <input type="number" value={discountPct} onChange={(e) => setDiscountPct(e.target.value)} step="0.01" min="0" max="100" className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black" disabled={pending} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs">Tax % (GST)</span>
            <input type="number" value={taxPct} onChange={(e) => setTaxPct(e.target.value)} step="0.01" min="0" max="100" className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black" disabled={pending} />
          </label>
        </div>

        {/* Live preview */}
        <div className="mt-4 space-y-1 border-t border-black/10 pt-3 text-sm dark:border-white/10">
          <div className="flex justify-between"><span>Materials subtotal</span><span>{currency} {subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-green-700 dark:text-green-300"><span>+ Markup ({markupPct}%)</span><span>{currency} {markup.toFixed(2)}</span></div>
          <div className="flex justify-between text-red-700 dark:text-red-300"><span>- Discount ({discountPct}%)</span><span>{currency} {discount.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>+ Tax ({taxPct}%)</span><span>{currency} {tax.toFixed(2)}</span></div>
          <div className="flex justify-between border-t border-black/10 pt-2 font-semibold dark:border-white/10"><span>Grand Total</span><span>{currency} {grandTotal.toFixed(2)}</span></div>
        </div>
      </div>

      {/* Quotation name */}
      <div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Quotation Name (optional)</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={200} placeholder="Auto-generated if left blank" className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black" disabled={pending} />
        </label>
      </div>

      {/* Valid until */}
      <div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Valid Until (optional)</span>
          <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="w-full rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black" disabled={pending} />
        </label>
      </div>

      {/* Notes and terms */}
      <div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Notes (optional)</span>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={2} placeholder="Internal notes" className="w-full resize-y rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black" disabled={pending} />
        </label>
      </div>

      <div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Terms & Conditions (optional)</span>
          <textarea value={terms} onChange={(e) => setTerms(e.target.value)} maxLength={5000} rows={3} placeholder="Payment terms, validity, etc." className="w-full resize-y rounded border border-black/15 bg-white px-3 py-2 text-sm dark:border-white/15 dark:bg-black" disabled={pending} />
        </label>
      </div>

      {error ? <FieldError message={error} /> : null}

      <div className="flex gap-3">
        <Button type="submit" variant="primary" disabled={pending}>
          {pending ? "Generating…" : "Generate Quotation"}
        </Button>
      </div>
    </form>
  );
}
