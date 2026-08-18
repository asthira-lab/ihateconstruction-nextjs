// Single source of truth for AdSense publisher ID + ad unit slot IDs.

export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT ?? "ca-pub-9420524527207355";

// Named slot map — one in-content slot per calculator. Empty value → placeholder
// in dev, nothing in prod (safe default until units exist in AdSense).
export const AD_SLOTS = {
  cementInContent: process.env.NEXT_PUBLIC_AD_CEMENT_IN_CONTENT ?? "",
  concreteInContent: process.env.NEXT_PUBLIC_AD_CONCRETE_IN_CONTENT ?? "",
  brickInContent: process.env.NEXT_PUBLIC_AD_BRICK_IN_CONTENT ?? "",
  steelInContent: process.env.NEXT_PUBLIC_AD_STEEL_IN_CONTENT ?? "",
  paintInContent: process.env.NEXT_PUBLIC_AD_PAINT_IN_CONTENT ?? "",
  tileInContent: process.env.NEXT_PUBLIC_AD_TILE_IN_CONTENT ?? "",
  rebarInContent: process.env.NEXT_PUBLIC_AD_REBAR_IN_CONTENT ?? "",
} as const;

export type AdSlotKey = keyof typeof AD_SLOTS;

// True only when at least one in-content slot is configured — used to skip
// loading the AdSense script entirely until ad units exist.
export function hasConfiguredAdSlots(): boolean {
  return Object.values(AD_SLOTS).some((slot) => slot.length > 0);
}
