/**
 * Container — the horizontal wrapper every section uses.
 *
 * `mx-auto max-w-5xl px-4 sm:px-6` keeps text off the edge on narrow phones
 * (a 320px viewport still gets 16px gutters) while matching the desktop
 * rhythm. Section padding (`py-*`) is applied by the caller so the same
 * container can host both tight and generous rhythms without duplicating.
 */

import type { ReactNode } from "react";

interface ContainerProps {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "header" | "footer" | "main" | "nav";
}

export function Container({
  children,
  className = "",
  as: Tag = "div",
}: ContainerProps) {
  return (
    <Tag className={`mx-auto w-full max-w-5xl px-4 sm:px-6 ${className}`}>
      {children}
    </Tag>
  );
}

