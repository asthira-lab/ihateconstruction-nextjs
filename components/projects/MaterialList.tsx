"use client";

// Client list of project materials with "Load more".

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { listMaterialsAction } from "@/app/[lang]/projects/[id]/materials/actions";
import type { ProjectMaterial } from "@/features/project-materials";

interface Props {
  projectId: string;
  currency: string;
  initialItems: ProjectMaterial[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
}

export function MaterialList({ projectId, currency, initialItems, initialNextCursor, initialHasMore }: Props) {
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError(null);
    const res = await listMaterialsAction(projectId, { cursor: nextCursor });
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
          No materials yet. Add prices for cement, sand, steel, and anything else you buy.
        </p>
        <div className="mt-4">
          <Link href={`/projects/${projectId}/materials/new`}>
            <Button variant="primary">Add material</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
        {items.map((m) => (
          <li key={m.id}>
            <Link
              href={`/projects/${projectId}/materials/${m.id}`}
              className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.05]"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-black/[.06] px-1.5 py-0.5 text-xs uppercase tracking-wider text-black/70 dark:bg-white/[.08] dark:text-white/70">
                    {m.type}
                  </span>
                  <span className="truncate text-sm font-medium">{m.brand ?? "—"}</span>
                </div>
                {m.vendor ? (
                  <p className="mt-0.5 truncate text-xs text-black/60 dark:text-white/60">Vendor: {m.vendor}</p>
                ) : null}
              </div>
              <div className="whitespace-nowrap text-right">
                <p className="text-sm font-semibold">
                  {currency} {m.unitPrice} <span className="text-black/50 dark:text-white/50">/ {m.unit}</span>
                </p>
                {m.quantity ? (
                  <p className="text-xs text-black/70 dark:text-white/70">
                    {formatQty(m.quantity)} {m.unit} · <span className="font-medium">{currency} {formatTotal(m.quantity, m.unitPrice)}</span>
                  </p>
                ) : null}
                <p className="text-xs text-black/50 dark:text-white/50">
                  {new Date(m.effectiveFrom).toLocaleDateString("en-IN")}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}

      {hasMore ? (
        <div className="mt-6 flex justify-center">
          <Button variant="secondary" onClick={loadMore} disabled={loading}>
            {loading ? "Loading…" : "Load more"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

// Trim trailing zeros so "12.000" renders as "12" but "12.500" stays "12.5".
function formatQty(q: string): string {
  const n = Number(q);
  if (!Number.isFinite(n)) return q;
  return n.toString();
}

// quantity × unitPrice, rounded to 2 decimals with grouped digits.
function formatTotal(q: string, price: string): string {
  const n = Number(q) * Number(price);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
