"use client";

// Accordion list of saved calculations. Rows expand inline to show the pretty ResultCard.

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { listCalculationsAction } from "@/app/projects/[id]/calculations/actions";
import type { SavedCalculation } from "@/features/project-calculations";
import { CalculationResult, calculationHeadline } from "./CalculationResult";
import { MaterialsFromCalculation } from "./MaterialsFromCalculation";
import { extractMaterialSuggestions } from "@/features/project-materials/from-calculation";

interface Props {
  projectId: string;
  initialItems: SavedCalculation[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  alreadyAddedMaterialKeys: string[];
}

export function CalculationList({
  projectId,
  initialItems,
  initialNextCursor,
  initialHasMore,
  alreadyAddedMaterialKeys,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Only one row expanded at a time keeps the list scannable.
  const [openId, setOpenId] = useState<string | null>(null);

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError(null);
    const res = await listCalculationsAction(projectId, { cursor: nextCursor });
    if (!res.ok) setError(res.error.message);
    else {
      setItems((prev) => [...prev, ...res.data.items]);
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    }
    setLoading(false);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-black/15 p-10 text-center dark:border-white/15">
        <p className="text-sm text-black/70 dark:text-white/70">
          No calculations yet. Run a calculator and use “Save to project” to snapshot it here.
        </p>
        <div className="mt-4">
          <Link href="/calculators">
            <Button variant="secondary">Browse calculators</Button>
          </Link>
        </div>
      </div>
    );
  }

  const grouped = new Map<string, SavedCalculation[]>();
  for (const c of items) {
    const key = c.group ?? "";
    const arr = grouped.get(key) ?? [];
    arr.push(c);
    grouped.set(key, arr);
  }
  const groupKeys = Array.from(grouped.keys()).sort((a, b) => {
    if (a === "") return 1;
    if (b === "") return -1;
    return a.localeCompare(b);
  });

  return (
    <div className="space-y-8">
      {groupKeys.map((key) => (
        <section key={key || "ungrouped"}>
          <h2 className="mb-3 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
            {key || "Ungrouped"}
          </h2>
          <ul className="divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
            {(grouped.get(key) ?? []).map((c) => {
              const isOpen = openId === c.id;
              const headline = calculationHeadline(c);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenId(isOpen ? null : c.id)}
                    className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-black/[.06] px-1.5 py-0.5 text-xs uppercase tracking-wider text-black/70 dark:bg-white/[.08] dark:text-white/70">
                          {c.calculator}
                        </span>
                        <span className="truncate text-sm font-medium">{c.label}</span>
                        {headline ? (
                          <span className="whitespace-nowrap font-mono text-xs tabular-nums text-black/70 dark:text-white/70">
                            · {headline}
                          </span>
                        ) : null}
                      </div>
                      {c.description ? (
                        <p className="mt-0.5 truncate text-xs text-black/60 dark:text-white/60">
                          {c.description}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="whitespace-nowrap text-xs text-black/50 dark:text-white/50">
                        {new Date(c.computedAt).toLocaleDateString()}
                      </span>
                      <svg
                        aria-hidden="true"
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="none"
                        className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                      >
                        <path
                          d="M2.5 4.5L6 8L9.5 4.5"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </button>

                  {isOpen ? (
                    <div className="border-t border-black/10 bg-black/[.02] px-4 py-4 dark:border-white/10 dark:bg-white/[.03]">
                      <CalculationResult calc={c} />
                      <MaterialsFromCalculation
                        projectId={projectId}
                        calcLabel={c.label}
                        suggestions={extractMaterialSuggestions(c)}
                        alreadyAdded={alreadyAddedMaterialKeys}
                      />
                      <div className="mt-3 flex justify-end">
                        <Link
                          href={`/projects/${projectId}/calculations/${c.id}`}
                          className="text-xs font-medium text-black/70 underline underline-offset-2 hover:text-black dark:text-white/70 dark:hover:text-white"
                        >
                          Open to edit or recompute →
                        </Link>
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {hasMore ? (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
