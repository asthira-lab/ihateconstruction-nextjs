/**
 * Icon — a thin wrapper over inline SVG glyphs.
 *
 * We're not installing a library. Each glyph is a stroke-based 24×24 SVG
 * matching Lucide/Feather visual style, with `stroke="currentColor"` so it
 * inherits text color. Add new glyphs by extending the `paths` map.
 *
 * All decorative usage should pass `decorative` so screen readers skip it;
 * pass `label` for interactive icons.
 */

import type { ReactElement, SVGProps } from "react";

type IconName =
  | "calculator"
  | "layers"
  | "receipt"
  | "arrow-right"
  | "check"
  | "hammer";

interface IconProps extends Omit<SVGProps<SVGSVGElement>, "name"> {
  name: IconName;
  size?: number;
  /** True for purely visual icons — sets aria-hidden. */
  decorative?: boolean;
  /** Accessible label for interactive icons. Sets role="img". */
  label?: string;
}

// Path strings only; the outer <svg> is shared.
const paths: Record<IconName, ReactElement> = {
  calculator: (
    <>
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 7h8" />
      <path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01" />
    </>
  ),
  layers: (
    <>
      <path d="M12 3 3 8l9 5 9-5-9-5Z" />
      <path d="m3 12 9 5 9-5" />
      <path d="m3 16 9 5 9-5" />
    </>
  ),
  receipt: (
    <>
      <path d="M4 3h16v18l-2-1-2 1-2-1-2 1-2-1-2 1-2-1-2 1V3Z" />
      <path d="M8 8h8" />
      <path d="M8 12h8" />
      <path d="M8 16h5" />
    </>
  ),
  "arrow-right": (
    <>
      <path d="M5 12h14" />
      <path d="m13 5 7 7-7 7" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 5 5 9-11" />
    </>
  ),
  hammer: (
    <>
      <path d="m15 4-3 3 5 5 3-3-5-5Z" />
      <path d="m12 7-9 9 3 3 9-9" />
    </>
  ),
};

export function Icon({
  name,
  size = 20,
  decorative = false,
  label,
  className = "",
  ...rest
}: IconProps) {
  const glyph = paths[name];
  const a11y = decorative
    ? { "aria-hidden": true as const }
    : label
      ? { role: "img" as const, "aria-label": label }
      : {};

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...a11y}
      {...rest}
    >
      {glyph}
    </svg>
  );
}

export type { IconName };
