// Labelled input row with optional hint and error — label + control + unit.

export function VariableRow({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm text-black/70 dark:text-white/70">{label}</label>
      {hint ? (
        <p className="mt-0.5 text-[11px] text-black/50 dark:text-white/50">{hint}</p>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
