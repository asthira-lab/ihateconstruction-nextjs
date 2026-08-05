/**
 * Card — bordered, rounded shell for content blocks.
 *
 * Matches the brick page's card styling (`rounded border border-black/10
 * dark:border-white/10`) so cards on the homepage and calculator index feel
 * like they came from the same design system.
 *
 * Renders as `<div>` by default; pass `as="a"` to make the whole card a link
 * (used by the calculator grid). Interactive cards get a subtle hover state
 * and a focus ring.
 */

import type { ElementType, ReactNode, ComponentPropsWithoutRef } from "react";

type CardTag = "div" | "a" | "article" | "section";

type CardProps<T extends CardTag> = {
  as?: T;
  children: ReactNode;
  className?: string;
  /** When true, apply hover/focus affordances suitable for a clickable card. */
  interactive?: boolean;
} & Omit<ComponentPropsWithoutRef<T>, "children" | "className">;

export function Card<T extends CardTag = "div">({
  as,
  children,
  className = "",
  interactive = false,
  ...rest
}: CardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  // `block` is here on purpose: when Card is rendered as `<a>` (a live
  // calculator card), the anchor's default inline layout collapses the box
  // to the width of its inline children, ignoring padding + width — the
  // card would look correct as a <div> but broken as an <a>. Forcing block
  // makes anchor + div render identically.
  const base =
    "block rounded-lg border border-black/10 bg-white p-6 dark:border-white/10 dark:bg-black";
  const active = interactive
    ? "transition-colors hover:border-black/25 hover:bg-black/[.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:hover:border-white/25 dark:hover:bg-white/[.03] dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
    : "";
  return (
    <Tag className={`${base} ${active} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}
