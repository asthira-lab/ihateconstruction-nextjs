"use client";

// Collapsible "Related calculators" list.

import { useState } from "react";

export function RelatedCalculators({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-black/10 dark:border-white/10">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold"
      >
        {title}
        <span
          aria-hidden="true"
          className={`text-black/50 transition-transform dark:text-white/50 ${open ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>
      {open ? (
        <ul className="space-y-1.5 border-t border-black/10 px-4 py-3 text-sm dark:border-white/10">
          {links.map((l) => (
            <li key={l.href}>
              <a
                href={l.href}
                className="text-black/75 underline decoration-black/20 underline-offset-2 hover:decoration-black/60 dark:text-white/75 dark:decoration-white/20 dark:hover:decoration-white/60"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
