// BOQ detail view: read-only snapshot with delete

"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { Boq } from "@/features/project-boqs";
import { deleteBoqAction } from "@/app/[lang]/projects/[id]/boqs/actions";
import { AddMaterialModal } from "./AddMaterialModal";
import { BrandSwapDropdown } from "./BrandSwapDropdown";

interface Props {
  boq: Boq;
  projectId: string;
  projectMaterials: { type: string; brand: string | null; unitPrice: string }[];
}

export function BoqDetailView({ boq, projectId, projectMaterials }: Props) {
  const router = useRouter();
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!confirm("Delete this BOQ? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteBoqAction(boq.id);
      if (!res.ok) { setError(res.error.message); return; }
      router.push(`/projects/${projectId}/boqs`);
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-semibold">{boq.name}</h1>
          {boq.notes && <p className="mt-1 text-sm text-black/70 dark:text-white/70">{boq.notes}</p>}
          <p className="mt-2 text-xs text-black/50 dark:text-white/50">
            Generated {new Date(boq.generatedAt).toLocaleDateString("en-IN")}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/projects/${projectId}/boqs`}>
            <Button variant="secondary" size="sm" disabled={pending}>Back</Button>
          </Link>
          <a href={`/api/pdf/boq/${boq.id}`} download>
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

      {/* Sections */}
      <div className="space-y-6">
        {boq.sections.map((section, sectionIdx) => (
          <div key={sectionIdx} className="rounded-lg border border-black/10 dark:border-white/10">
            <div className="border-b border-black/10 bg-black/[.02] px-4 py-3 dark:border-white/10 dark:bg-white/[.02]">
              <h2 className="font-semibold">{section.group || "(Ungrouped)"}</h2>
              <p className="mt-1 text-sm text-black/70 dark:text-white/70">{boq.currency} {section.sectionSubtotal}</p>
            </div>

            <div className="divide-y divide-black/10 dark:divide-white/10">
              {section.lines.map((line) => (
                <div key={line.id} className="p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <h3 className="font-medium">{line.label}</h3>
                    <p className="font-semibold whitespace-nowrap">{boq.currency} {line.subtotal}</p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-black/10 text-left text-xs font-medium text-black/60 dark:border-white/10 dark:text-white/60">
                          <th className="px-2 py-1">Material</th>
                          <th className="px-2 py-1 text-right">Qty</th>
                          <th className="px-2 py-1 text-right">Unit</th>
                          <th className="px-2 py-1 text-right">Price/unit</th>
                          <th className="px-2 py-1 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {line.materials.map((m, idx) => {
                          const brandsForType = projectMaterials
                            .filter((pm) => pm.type === m.type)
                            .reduce<{ brand: string | null; unitPrice: string }[]>((acc, pm) => {
                              if (!acc.some((b) => b.brand === pm.brand)) acc.push({ brand: pm.brand, unitPrice: pm.unitPrice });
                              return acc;
                            }, []);

                          return (
                          <tr key={idx} className="border-b border-black/5 dark:border-white/5">
                            <td className="px-2 py-1">
                              <div className="font-medium">{m.type}</div>
                              <BrandSwapDropdown
                                boqId={boq.id}
                                materialRowId={m.id}
                                currentBrand={m.brand}
                                availableBrands={brandsForType}
                              />
                            </td>
                            <td className="px-2 py-1 text-right">{m.quantity.value}</td>
                            <td className="px-2 py-1 text-right">{m.quantity.unit}</td>
                            <td className="px-2 py-1 text-right">{boq.currency} {m.unitPrice ?? "0.00"}</td>
                            <td className="px-2 py-1 text-right font-medium">{boq.currency} {m.amount ?? "0.00"}</td>
                          </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="rounded-lg border border-black/10 bg-black/[.02] p-6 dark:border-white/10 dark:bg-white/[.02]">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Materials Subtotal:</span>
            <span className="font-semibold">{boq.currency} {boq.totals.materialsSubtotal}</span>
          </div>
          <div className="border-t border-black/10 pt-2 dark:border-white/10">
            <div className="flex justify-between text-lg font-semibold">
              <span>Grand Total:</span>
              <span>{boq.currency} {boq.totals.grandTotal}</span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-2 border-t border-black/10 pt-4 dark:border-white/10">
          <Button variant="secondary" size="sm" onClick={() => setShowAddMaterial(true)}>
            + Add Material
          </Button>
        </div>
      </div>

      <AddMaterialModal
        projectId={projectId}
        currency={boq.currency}
        isOpen={showAddMaterial}
        onClose={() => setShowAddMaterial(false)}
        onSuccess={() => router.refresh()}
      />
    </div>
  );
}
