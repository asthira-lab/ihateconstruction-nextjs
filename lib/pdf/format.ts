// PDF formatting helpers
export function formatCurrency(amount: string | null | undefined, currency: string): string {
  const num = parseFloat(amount ?? "0");
  return `${currency} ${num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
