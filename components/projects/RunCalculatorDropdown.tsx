"use client";

// Header dropdown that lists every live calculator directly.

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CALCULATORS, calculatorHref } from "@/features/calculators/registry";

export function RunCalculatorDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // Close on outside click and Escape.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const live = CALCULATORS.filter((c) => c.status === "live");

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-md bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black dark:bg-white dark:text-black dark:hover:bg-white/85 dark:focus-visible:outline-white"
      >
        Run a calculator
        <svg
          aria-hidden="true"
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-72 overflow-hidden rounded-lg border border-black/10 bg-white shadow-lg ring-1 ring-black/5 dark:border-white/10 dark:bg-neutral-900 dark:ring-white/5"
        >
          <ul className="max-h-80 overflow-y-auto py-1">
            {live.map((c) => (
              <li key={c.slug}>
                <Link
                  href={calculatorHref(c)}
                  role="menuitem"
                  className="block px-4 py-2.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
                  onClick={() => setOpen(false)}
                >
                  <div className="font-medium text-black dark:text-white">{c.title}</div>
                  {/*<div className="mt-0.5 line-clamp-2 text-xs text-black/60 dark:text-white/60">*/}
                  {/*  {c.description}*/}
                  {/*</div>*/}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
