"use client";

// Inline brand picker for BOQ material rows
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { swapBrandAction } from "@/app/projects/[id]/boqs/actions";

interface Props {
  boqId: string;
  materialRowId: string;
  currentBrand: string | null;
  availableBrands: { brand: string | null; unitPrice: string }[];
}

export function BrandSwapDropdown({ boqId, materialRowId, currentBrand, availableBrands }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  if (availableBrands.length <= 1) {
    return <span className="text-xs text-black/60 dark:text-white/60">{currentBrand ?? "Generic"}</span>;
  }

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const newBrand = e.target.value === "__null__" ? null : e.target.value;
    if (newBrand === currentBrand) return;
    startTransition(async () => {
      await swapBrandAction(boqId, { materialRowId, newBrand });
      router.refresh();
    });
  }

  return (
    <select
      value={currentBrand ?? "__null__"}
      onChange={handleChange}
      disabled={pending}
      className="w-full rounded border border-black/10 bg-transparent px-1 py-0.5 text-xs dark:border-white/10"
    >
      {availableBrands.map((b, i) => (
        <option key={i} value={b.brand ?? "__null__"}>
          {b.brand ?? "Generic"} — ₹{b.unitPrice}
        </option>
      ))}
    </select>
  );
}
