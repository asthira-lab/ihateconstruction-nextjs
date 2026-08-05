"use client";

// Chips + bulk-import button for materials suggested by a saved calculation.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import { bulkImportMaterialsAction } from "@/app/projects/[id]/materials/actions";
import type { MaterialSuggestion } from "@/features/project-materials/from-calculation";

interface Props {
  projectId: string;
  calcLabel: string;
  suggestions: MaterialSuggestion[];
  // Set of "type:unit:brand" keys already present under the project — used to strike out imported chips.
  alreadyAdded: string[];
}

export function MaterialsFromCalculation({ projectId, calcLabel, suggestions, alreadyAdded }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);
  const [importedKeys, setImportedKeys] = useState<Set<string>>(new Set(alreadyAdded));

  const missing = useMemo(
    () => suggestions.filter((s) => !importedKeys.has(s.key)),
    [suggestions, importedKeys],
  );

  if (suggestions.length === 0) return null;

  function importAll() {
    setMsg(null);
    const payload = missing.map((s) => ({ type: s.type, unit: s.unit, quantity: s.quantity }));
    if (payload.length === 0) {
      setMsg("Everything from this calculation is already in your materials.");
      return;
    }
    startTransition(async () => {
      const res = await bulkImportMaterialsAction(projectId, payload);
      if (!res.ok) {
        setMsg(res.error.message);
        return;
      }
      const { created, updated } = res.data;
      setImportedKeys((prev) => {
        const next = new Set(prev);
        for (const s of payload) next.add(`${s.type}:${s.unit}:`);
        return next;
      });
      let msg = "";
      if (created > 0) msg += `Added ${created} material${created === 1 ? "" : "s"} with placeholder price ₹100`;
      if (updated > 0) msg += (msg ? " · " : "") + `updated quantity on ${updated} existing material${updated === 1 ? "" : "s"}`;
      if (msg) msg += ". Edit prices as needed.";
      setMsg(msg);
      // Navigate to materials list after successful import
      router.push(`/projects/${projectId}/materials`);
    });
  }

  return (
    <section className="mt-6 rounded-lg border border-black/10 bg-white p-4 dark:border-white/10 dark:bg-black">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Materials from this calculation</h3>
          <p className="mt-0.5 text-xs text-black/60 dark:text-white/60">
            Click a chip to add it with a price, or import all missing with placeholder prices.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={importAll} disabled={pending || missing.length === 0}>
          {pending ? "Importing…" : missing.length === 0 ? "All imported" : `Add all missing (${missing.length})`}
        </Button>
      </div>

      <ul className="flex flex-wrap gap-2">
        {suggestions.map((s) => {
          const already = importedKeys.has(s.key);
          const href =
            `/projects/${projectId}/materials/new` +
            `?type=${encodeURIComponent(s.type)}` +
            `&unit=${encodeURIComponent(s.unit)}` +
            (s.quantity != null ? `&quantity=${encodeURIComponent(s.quantity)}` : "") +
            `&quantityHint=${encodeURIComponent(s.quantityLabel)}` +
            `&sourceLabel=${encodeURIComponent(calcLabel)}`;
          if (already) {
            return (
              <li key={s.key}>
                <span className="inline-flex items-center gap-1 rounded-full border border-black/10 bg-black/[.04] px-3 py-1 text-xs text-black/50 line-through dark:border-white/10 dark:bg-white/[.05] dark:text-white/40">
                  ✓ {s.type}/{s.unit}
                </span>
              </li>
            );
          }
          return (
            <li key={s.key}>
              <Link
                href={href}
                className="inline-flex items-center gap-1 rounded-full border border-black/15 bg-white px-3 py-1 text-xs text-black hover:border-black hover:bg-black/[.04] dark:border-white/20 dark:bg-black dark:text-white dark:hover:border-white dark:hover:bg-white/[.05]"
              >
                <span className="font-medium">{s.type}</span>
                <span className="text-black/50 dark:text-white/50">/{s.unit}</span>
                <span className="ml-1 text-black/50 dark:text-white/50">· {s.quantityLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      {msg ? (
        <p className="mt-3 text-xs text-black/70 dark:text-white/70">{msg}</p>
      ) : null}
    </section>
  );
}
