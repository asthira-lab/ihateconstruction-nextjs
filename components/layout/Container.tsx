/**
 * Container — the horizontal wrapper every section uses.
 *
 * `mx-auto max-w-5xl px-6` matches the brick page's wrapper exactly. Section
 * padding (`py-*`) is applied by the caller so the same container can host
 * both tight and generous rhythms without duplicating classes.
 */

import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  /** Optional semantic tag. Defaults to `<div>` — use `<section>` on sections. */
  as?: "div" | "section" | "header" | "footer" | "main" | "nav";
}

export function Container({
  children,
  className = "",
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag className={`mx-auto w-full max-w-5xl px-6 ${className}`}>{children}</Tag>
  );
}
