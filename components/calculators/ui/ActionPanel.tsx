"use client";

// Share / reload / clear action row under the calculator.

import { Button } from "@/components/ui/Button";

export function ActionPanel({
  shareLabel,
  reloadLabel,
  clearLabel,
  onReload,
  onClear,
  onShare,
}: {
  shareLabel?: string;
  reloadLabel: string;
  clearLabel: string;
  onReload: () => void;
  onClear: () => void;
  onShare?: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {shareLabel && onShare ? (
        <Button type="button" variant="primary" size="sm" onClick={onShare} className="flex-1">
          {shareLabel}
        </Button>
      ) : null}
      <Button type="button" variant="secondary" size="sm" onClick={onReload} className="flex-1">
        {reloadLabel}
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={onClear} className="flex-1">
        {clearLabel}
      </Button>
    </div>
  );
}
