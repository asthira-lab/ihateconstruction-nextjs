"use client";

// Client list with cursor "Load more" pagination and status filter tabs.

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { listProjectsAction } from "@/app/projects/actions";
import type { Project } from "@/features/projects";

interface Props {
  initialItems: Project[];
  initialNextCursor: string | null;
  initialHasMore: boolean;
  currentStatus: string;
}

const STATUSES: { key: string; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
];

export function ProjectList({ initialItems, initialNextCursor, initialHasMore, currentStatus }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Project[]>(initialItems);
  const [nextCursor, setNextCursor] = useState<string | null>(initialNextCursor);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const search = searchParams.get("search") ?? "";

  function switchStatus(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "active") params.delete("status");
    else params.set("status", next);
    params.delete("cursor");
    startTransition(() => router.push(`/projects?${params.toString()}`));
  }

  async function loadMore() {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError(null);
    const res = await listProjectsAction({
      status: currentStatus,
      search: search || undefined,
      cursor: nextCursor,
    });
    if (!res.ok) {
      setError(res.error.message);
    } else {
      setItems((prev) => [...prev, ...res.data.items]);
      setNextCursor(res.data.nextCursor);
      setHasMore(res.data.hasMore);
    }
    setLoading(false);
  }

  return (
    <div>
      <div className="mb-6 flex items-center gap-1 border-b border-black/10 dark:border-white/10">
        {STATUSES.map((s) => {
          const isActive = currentStatus === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => switchStatus(s.key)}
              disabled={pending}
              className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
                isActive
                  ? "border-black text-black dark:border-white dark:text-white"
                  : "border-transparent text-black/60 hover:text-black dark:text-white/60 dark:hover:text-white"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-black/15 p-10 text-center dark:border-white/15">
          <p className="text-sm text-black/70 dark:text-white/70">
            No projects yet. Create your first one to start saving calculations.
          </p>
          <div className="mt-4">
            <Link href="/projects/new">
              <Button variant="primary">New project</Button>
            </Link>
          </div>
        </div>
      ) : (
        <ul className="divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
          {items.map((p) => (
            <li key={p.id}>
              <Link
                href={`/projects/${p.id}`}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.05]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-medium">{p.name}</span>
                    {p.status === "archived" ? (
                      <span className="rounded bg-black/[.06] px-1.5 py-0.5 text-xs uppercase tracking-wider text-black/60 dark:bg-white/[.08] dark:text-white/60">
                        Archived
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-black/60 dark:text-white/60">
                    {p.clientName ?? "No client"} · {p.currency} · {p.counts.calculations} calc
                    {p.counts.calculations === 1 ? "" : "s"} · {p.counts.materials} material
                    {p.counts.materials === 1 ? "" : "s"}
                  </p>
                </div>
                <span className="whitespace-nowrap text-xs text-black/50 dark:text-white/50">
                  {new Date(p.updatedAt).toLocaleDateString("en-IN")}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

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
