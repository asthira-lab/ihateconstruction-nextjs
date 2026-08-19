// CalculatorGrid — cards for /calculators and homepage. Locale-aware links + "Coming soon" label.

import { Card } from "@/components/ui/Card";
import { Icon } from "@/components/ui/Icon";
import {
  CALCULATORS,
  calculatorHref,
  type CalculatorEntry,
  type CalculatorCategory,
} from "@/features/calculators/registry";

interface LocalizedEntry {
  slug: string;
  href: string;
  title: string;
  description: string;
  keywords: string[];
  status: "live" | "coming";
  category: CalculatorCategory;
}

// Pick up to 3 short, human-scannable pills from the keyword list. Long
// SEO phrases are skipped; a bad list just yields fewer pills.
function pillsFrom(keywords: string[]): string[] {
  const short = keywords.filter((k) => k.length > 0 && k.length <= 16);
  return short.slice(0, 3);
}

interface CardProps {
  entry: CalculatorEntry | LocalizedEntry;
  locale: string;
  categoryLabels?: Record<CalculatorCategory, string>;
  ctaLabel?: string;
}

function LiveCard({ entry, locale, categoryLabels, ctaLabel }: CardProps) {
  const href = "href" in entry ? entry.href : calculatorHref(entry, locale);
  const pills = pillsFrom(entry.keywords ?? []);
  return (
    <Card as="a" href={href} interactive className="group flex h-full flex-col">
      <div className="flex items-center justify-between">
        {categoryLabels ? (
          <span className="text-[10px] font-medium uppercase tracking-widest text-black/60 dark:text-white/60">
            {categoryLabels[entry.category]}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
        <span
          aria-hidden="true"
          className="inline-flex h-10 w-10 items-center justify-center rounded border border-black/10 text-black dark:border-white/15 dark:text-white"
        >
          <Icon name="calculator" size={20} decorative />
        </span>
      </div>
      <h3 className="mt-5 text-lg font-semibold">{entry.title}</h3>
      <p className="mt-2 text-sm text-black/70 dark:text-white/70">
        {entry.description}
      </p>
      {pills.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {pills.map((p) => (
            <li
              key={p}
              className="rounded-full border border-black/10 px-2 py-0.5 text-[11px] text-black/60 dark:border-white/15 dark:text-white/60"
            >
              {p}
            </li>
          ))}
        </ul>
      )}
      {ctaLabel ? (
        <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-black transition-transform group-hover:translate-x-0.5 dark:text-white">
          {ctaLabel}
          <Icon name="arrow-right" size={16} decorative />
        </span>
      ) : (
        <Icon
          name="arrow-right"
          size={18}
          decorative
          className="mt-6 self-end text-black/40 transition-transform group-hover:translate-x-0.5 dark:text-white/40"
        />
      )}
    </Card>
  );
}

function ComingCard({
  entry,
  comingLabel,
  categoryLabels,
}: {
  entry: CalculatorEntry | LocalizedEntry;
  comingLabel: string;
  categoryLabels?: Record<CalculatorCategory, string>;
}) {
  return (
    <Card as="div" aria-disabled="true" className="flex h-full flex-col opacity-70">
      <div className="flex items-center justify-between">
        {categoryLabels ? (
          <span className="text-[10px] font-medium uppercase tracking-widest text-black/50 dark:text-white/50">
            {categoryLabels[entry.category]}
          </span>
        ) : (
          <span aria-hidden="true" />
        )}
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
  categoryLabels?: Record<CalculatorCategory, string>;
  ctaLabel?: string;
  filter?: (entry: CalculatorEntry) => boolean;
  entries?: LocalizedEntry[];
  emptyState?: React.ReactNode;
  id?: string;
}

export function CalculatorGrid({
  locale,
  comingLabel,
  categoryLabels,
  ctaLabel,
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
        <li key={entry.slug} className="h-full">
          {entry.status === "live" ? (
            <LiveCard
              entry={entry}
              locale={locale}
              categoryLabels={categoryLabels}
              ctaLabel={ctaLabel}
            />
          ) : (
            <ComingCard
              entry={entry}
              comingLabel={comingLabel}
              categoryLabels={categoryLabels}
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export type { LocalizedEntry };
