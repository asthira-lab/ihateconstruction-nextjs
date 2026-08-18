"use client";

// Collapsible calculator section (e.g. "Slab dimensions", "Results").

import { useState } from "react";

export function BlockGroup({
  title,
  children,
  defaultExpanded = true,
  badge,
}: {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string;
}) {
  const [open, setOpen] = useState(defaultExpanded);

  return (
    <section className="overflow-hidden rounded-lg border border-black/10 bg-white dark:border-white/10 dark:bg-black">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          {title}
          {badge ? (
            <span className="rounded-full bg-black/[.06] px-2 py-0.5 text-xs font-medium text-black/60 dark:bg-white/10 dark:text-white/60">
              {badge}
            </span>
          ) : null}
        </span>
        <span
          aria-hidden="true"
          className={`text-black/50 transition-transform dark:text-white/50 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open ? <div className="px-4 pb-4">{children}</div> : null}
    </section>
  );
}
