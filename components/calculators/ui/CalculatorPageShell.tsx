// Two-column calculator layout — calculator sidebar (sticky on desktop, top on mobile) + article column.

export function CalculatorPageShell({
  calculator,
  children,
}: {
  calculator: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)]">
      <div className="order-2 min-w-0 lg:order-1">{children}</div>
      <div className="order-1 min-w-0 lg:order-2">
        <div className="space-y-4 lg:sticky lg:top-20">{calculator}</div>
      </div>
    </div>
  );
}
