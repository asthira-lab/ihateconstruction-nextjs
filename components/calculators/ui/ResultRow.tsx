// Read-only result line — key on the left, value on the right.

export function ResultRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="text-xs text-black/60 dark:text-white/60">{label}</span>
      <span
        className={`font-mono tabular-nums ${strong ? "text-base font-semibold" : "text-xs"}`}
      >
        {value}
      </span>
    </div>
  );
}
