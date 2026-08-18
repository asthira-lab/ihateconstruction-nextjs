"use client";

import { useEffect } from "react";
import { ADSENSE_CLIENT } from "@/app/lib/ads";

type AdFormat = "auto" | "rectangle" | "horizontal";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const RESERVED: Record<AdFormat, string> = {
  auto: "min-h-[250px] sm:min-h-[90px]",
  rectangle: "min-h-[250px]",
  horizontal: "min-h-[100px]",
};

const DEV_LABEL: Record<AdFormat, string> = {
  auto: "Responsive",
  rectangle: "Rectangle 300×250",
  horizontal: "Horizontal 728×90",
};

export function AdSlot({
  slot,
  format = "auto",
  className = "",
  label = "Advertisement",
}: {
  slot: string;
  format?: AdFormat;
  className?: string;
  label?: string;
}) {
  const isProd = process.env.NODE_ENV === "production";

  useEffect(() => {
    if (!isProd || !slot) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad loader absent (blocked/failed) — reserved box stays empty.
    }
  }, [slot, isProd]);

  // Dev: always show a placeholder so placement is visible without real requests.
  if (!isProd) {
    return (
      <div
        className={`flex items-center justify-center rounded border border-dashed border-black/20 bg-black/[.03] text-center text-xs text-black/50 dark:border-white/20 dark:bg-white/[.03] dark:text-white/50 ${RESERVED[format]} ${className}`}
      >
        Ad placeholder — {DEV_LABEL[format]}
      </div>
    );
  }

  // Prod with no unit configured yet: render nothing (no ad, no reserved gap).
  if (!slot) return null;

  return (
    <div className={`w-full ${RESERVED[format]} ${className}`}>
      <span className="sr-only">{label}</span>
      <ins
        className="adsbygoogle block"
        style={{ display: "block" }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={format === "auto" ? "true" : undefined}
      />
    </div>
  );
}
