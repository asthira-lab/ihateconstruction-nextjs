import { AdSlot } from "./AdSlot";
import { AD_SLOTS, type AdSlotKey } from "@/app/lib/ads";

// Consistent in-content ad for every calculator page — same format + spacing.
export function CalculatorAd({ slotKey }: { slotKey: AdSlotKey }) {
  return <AdSlot slot={AD_SLOTS[slotKey]} format="auto" className="my-16" />;
}
