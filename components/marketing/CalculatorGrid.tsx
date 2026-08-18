// CalculatorGrid — 5-card grid used by /calculators. Locale-aware links + "Coming soon" label.

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import {
  CALCULATORS,
  calculatorHref,
  type CalculatorEntry,
} from "@/features/calculators/registry";

interface LocalizedEntry {
  slug: string;
  href: string;
  title: string;
  description: string;
  keywords: string[];
  status: "live" | "coming";
}

interface LiveCardProps {
  entry: CalculatorEntry | LocalizedEntry;
  locale: string;
}

function LiveCard({ entry, locale }: LiveCardProps) {
  const href = "href" in entry ? entry.href : calculatorHref(entry, locale);
  return (
    <Card as="a" href={href} interactive className="group">
      <div className="flex items-center justify-between">
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 items-center justify-center rounded border border-black/10 text-black dark:border-white/15 dark:text-white"
        >
          <Icon name="calculator" size={20} decorative />
        </span>
        <Icon
          name="arrow-right"
          size={18}
          decorative
          className="text-black/40 transition-transform group-hover:translate-x-0.5 dark:text-white/40"
        />
      </div>
      <h3 className="mt-5 text-lg font-semibold">{entry.title}</h3>
      <p className="mt-2 text-sm text-black/70 dark:text-white/70">
        {entry.description}
      </p>
    </Card>
  );
}

function ComingCard({ entry, comingLabel }: { entry: CalculatorEntry | LocalizedEntry; comingLabel: string }) {
  return (
    <Card as="div" aria-disabled="true" className="opacity-70">
      <div className="flex items-center justify-between">
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 items-center justify-center rounded border border-black/10 text-black/50 dark:border-white/15 dark:text-white/50"
        >
          <Icon name="calculator" size={20} decorative />
        </span>
        <span className="rounded-full border border-black/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest text-black/60 dark:border-white/15 dark:text-white/60">
          {comingLabel}
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold text-black/70 dark:text-white/70">
        {entry.title}
      </h3>
      <p className="mt-2 text-sm text-black/60 dark:text-white/60">
        {entry.description}
      </p>
    </Card>
  );
}

type DisplayEntry = CalculatorEntry | LocalizedEntry;

interface CalculatorGridProps {
  locale: string;
  comingLabel: string;
  filter?: (entry: CalculatorEntry) => boolean;
  entries?: LocalizedEntry[];
  emptyState?: React.ReactNode;
  id?: string;
}

export function CalculatorGrid({
  locale,
  comingLabel,
  filter,
  entries,
  emptyState,
  id,
}: CalculatorGridProps) {
  const displayEntries: DisplayEntry[] = entries ?? (filter ? CALCULATORS.filter(filter) : CALCULATORS);

  if (displayEntries.length === 0 && emptyState) {
    return <div id={id} role="listbox">{emptyState}</div>;
  }

  return (
    <ul id={id} className="grid gap-4 md:grid-cols-2" role="listbox">
      {displayEntries.map((entry) => (
        <li key={entry.slug}>
          {entry.status === "live" ? (
            <LiveCard entry={entry} locale={locale} />
          ) : (
            <ComingCard entry={entry} comingLabel={comingLabel} />
          )}
        </li>
      ))}
    </ul>
  );
}
