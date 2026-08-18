"use client";

// Mobile-only hamburger toggle + dropdown panel; hidden on sm+.

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/Icon";

export function MobileMenu({
  openLabel,
  closeLabel,
  children,
}: {
  openLabel: string;
  closeLabel: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on route change so tapping a link dismisses the panel.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Close on Escape for keyboard users.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="sm:hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? closeLabel : openLabel}
        className="inline-flex h-9 w-9 items-center justify-center rounded border border-black/10 text-black/75 hover:bg-black/[.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/15 dark:text-white/75 dark:hover:bg-white/[.06] dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
      >
        <Icon name={open ? "x" : "menu"} size={18} decorative />
      </button>

      {open ? (
        <div
          className="absolute inset-x-0 top-14 border-b border-black/10 bg-white shadow-lg dark:border-white/10 dark:bg-black"
          role="dialog"
          aria-modal="false"
        >
          <div className="mx-auto flex max-w-5xl flex-col gap-1 px-4 py-3">
            {children}
          </div>
        </div>
      ) : null}
    </div>
  );
}
