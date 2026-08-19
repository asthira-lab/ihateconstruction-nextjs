"use client";

import { useState, useEffect, useDeferredValue, useCallback, useMemo } from "react";
import { CalculatorGrid, type LocalizedEntry } from "./CalculatorGrid";
import {
  CALCULATOR_CATEGORIES,
  type CalculatorCategory,
} from "@/features/calculators/registry";

// Union of the concrete categories plus the "all" pseudo-value.
type CategoryFilter = "all" | CalculatorCategory;

export interface CalculatorSearchProps {
  entries: LocalizedEntry[];
  placeholder: string;
  emptyLabel: string;
  clearLabel: string;
  resultsLabelTemplate: string;
  comingLabel: string;
  suggestions: string[];
  suggestionsLabel: string;
  categoriesLabel: string;
  categoryLabels: Record<CategoryFilter, string>;
  ctaLabel: string;
  locale: string;
}

export type { LocalizedEntry };

interface FuseInstance {
  search: (query: string) => Array<{ item: LocalizedEntry }>;
}

function useFuse(entries: LocalizedEntry[]) {
  const [fuse, setFuse] = useState<FuseInstance | null>(null);

  useEffect(() => {
    let mounted = true;
    import("fuse.js").then((mod) => {
      if (!mounted) return;
      const Fuse = mod.default;
      const instance = new Fuse(entries, {
        keys: [
          { name: "title", weight: 0.6 },
          { name: "keywords", weight: 0.3 },
          { name: "description", weight: 0.1 },
        ],
        includeScore: false,
        threshold: 0.4,
        ignoreLocation: true,
        minMatchCharLength: 2,
        useExtendedSearch: false,
      }) as FuseInstance;
      setFuse(instance);
    });
    return () => {
      mounted = false;
    };
  }, [entries]);

  return fuse;
}

function searchEntries(
  fuse: FuseInstance | null,
  entries: LocalizedEntry[],
  query: string,
) {
  if (!query.trim() || !fuse) return entries;
  return fuse.search(query).map((r) => r.item);
}

export function CalculatorSearch({
  entries,
  placeholder,
  emptyLabel,
  clearLabel,
  resultsLabelTemplate,
  comingLabel,
  suggestions,
  suggestionsLabel,
  categoriesLabel,
  categoryLabels,
  ctaLabel,
  locale,
}: CalculatorSearchProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const deferredQuery = useDeferredValue(query);
  const fuse = useFuse(entries);

  // Search wins when a query is active — matches user expectation ("I typed something, show me matches").
  // Otherwise the category chip narrows the full list.
  const filtered = useMemo(() => {
    if (deferredQuery.trim() !== "") {
      return searchEntries(fuse, entries, deferredQuery);
    }
    if (category === "all") return entries;
    return entries.filter((e) => e.category === category);
  }, [fuse, entries, deferredQuery, category]);

  const handleClear = useCallback(() => {
    setQuery("");
    const input = document.getElementById("calculator-search-input");
    input?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        handleClear();
      } else if (e.key === "ArrowDown" && filtered.length > 0) {
        e.preventDefault();
        const firstEntry = filtered[0];
        if (firstEntry) {
          const firstResult = document.getElementById(
            `calculator-result-${firstEntry.slug}`,
          );
          firstResult?.focus();
        }
      }
    },
    [filtered, handleClear],
  );

  const handleSuggestion = useCallback((s: string) => {
    setQuery(s);
    const input = document.getElementById(
      "calculator-search-input",
    ) as HTMLInputElement | null;
    input?.focus();
  }, []);

  const resultCount = filtered.length;
  const showEmpty = query.trim() !== "" && resultCount === 0;
  const isEmptySearch = query.trim() === "";
  const isFiltering = !isEmptySearch || category !== "all";

  const chipCategories: CategoryFilter[] = ["all", ...CALCULATOR_CATEGORIES];

  return (
    <div>
      <label htmlFor="calculator-search-input" className="sr-only">
        {placeholder}
      </label>
      <div className="relative mb-4">
        <input
          id="calculator-search-input"
          type="search"
          role="combobox"
          aria-expanded={query.trim() !== ""}
          aria-controls="calculator-results"
          aria-autocomplete="list"
          aria-describedby="calculator-search-status"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-4 py-3 text-base border border-black/10 dark:border-white/15 rounded-lg bg-white dark:bg-black placeholder-black/40 dark:placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent pr-12 dir-auto"
          dir="auto"
        />
        {query.trim() !== "" && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={clearLabel}
            className="absolute inset-y-0 right-3 flex items-center text-black/40 hover:text-black dark:text-white/40 dark:hover:text-white"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M15 5L5 15M5 5l10 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {isEmptySearch && suggestions.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-widest text-black/50 dark:text-white/50">
            {suggestionsLabel}
          </span>
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSuggestion(s)}
              className="rounded-full border border-black/10 px-3 py-1 text-xs text-black/70 transition-colors hover:border-black/25 hover:bg-black/[.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/15 dark:text-white/70 dark:hover:border-white/25 dark:hover:bg-white/[.05] dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div
        role="radiogroup"
        aria-label={categoriesLabel}
        className="mb-6 flex flex-wrap gap-2"
      >
        {chipCategories.map((c) => {
          const selected = category === c;
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setCategory(c)}
              className={
                selected
                  ? "rounded-full border border-black bg-black px-3 py-1 text-xs font-medium text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white dark:bg-white dark:text-black dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
                  : "rounded-full border border-black/10 px-3 py-1 text-xs text-black/70 transition-colors hover:border-black/25 hover:bg-black/[.03] focus:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-white/15 dark:text-white/70 dark:hover:border-white/25 dark:hover:bg-white/[.05] dark:focus-visible:ring-white dark:focus-visible:ring-offset-black"
              }
            >
              {categoryLabels[c]}
            </button>
          );
        })}
      </div>

      {isFiltering && !showEmpty && (
        <p className="mb-4 text-xs text-black/60 dark:text-white/60">
          {resultsLabelTemplate.replace("{n}", String(resultCount))}
        </p>
      )}

      <div
        id="calculator-search-status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isEmptySearch && category === "all"
          ? ""
          : resultCount === 0
          ? emptyLabel.replace("{q}", query)
          : resultsLabelTemplate.replace("{n}", String(resultCount))}
      </div>

      {showEmpty ? (
        <div
          id="calculator-results"
          role="listbox"
          aria-label={emptyLabel.replace("{q}", query)}
          className="text-center py-12"
        >
          <p className="text-black/70 dark:text-white/70">
            {emptyLabel.replace("{q}", query)}
          </p>
        </div>
      ) : (
        <CalculatorGrid
          id="calculator-results"
          locale={locale}
          comingLabel={comingLabel}
          categoryLabels={categoryLabels as Record<CalculatorCategory, string>}
          ctaLabel={ctaLabel}
          entries={filtered}
        />
      )}
    </div>
  );
}
