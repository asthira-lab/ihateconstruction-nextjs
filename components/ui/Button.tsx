import { forwardRef } from "react";

/**
 * Base button primitive. One place for focus rings, disabled state, and the
 * two variants we need right now (primary / secondary). Every button on the
 * site should route through this eventually.
 */

type Variant = "primary" | "secondary" | "ghost" | "danger";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
}

const base =
  "inline-flex items-center justify-center gap-2 rounded font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-black disabled:cursor-not-allowed disabled:opacity-50";

const variants: Record<Variant, string> = {
  primary:
    "bg-black text-white hover:bg-black/85 focus-visible:ring-black dark:bg-white dark:text-black dark:hover:bg-white/85 dark:focus-visible:ring-white",
  secondary:
    "border border-black/15 bg-white text-black hover:bg-black/[.04] focus-visible:ring-black dark:border-white/20 dark:bg-black dark:text-white dark:hover:bg-white/[.06] dark:focus-visible:ring-white",
  ghost:
    "text-black hover:bg-black/[.06] focus-visible:ring-black dark:text-white dark:hover:bg-white/[.08] dark:focus-visible:ring-white",
  danger:
    "border border-red-500/40 bg-red-500/[.06] text-red-700 hover:bg-red-500/[.12] focus-visible:ring-red-500 dark:text-red-300",
};

const sizes = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className = "", variant = "primary", size = "md", type = "button", ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    />
  );
});
