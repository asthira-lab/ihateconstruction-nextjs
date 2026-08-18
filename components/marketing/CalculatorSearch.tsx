"use client";

import { useState, useEffect, useDeferredValue, useCallback, useMemo } from "react";
import { CalculatorGrid } from "./CalculatorGrid";

export interface CalculatorSearchProps {
  entries: LocalizedEntry[];
  placeholder: string;
  emptyLabel: string;
  clearLabel: string;
  resultsLabelTemplate: string;
  comingLabel: string;
  locale: string;
}

export interface LocalizedEntry {
  slug: string;
  href: string;
  title: string;
  description: string;
  keywords: string[];
  status: "live" | "coming";
}

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

function filterEntries(fuse: FuseInstance | null, entries: LocalizedEntry[], query: string) {
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
  locale,
}: CalculatorSearchProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const fuse = useFuse(entries);

  const filtered = useMemo(() => filterEntries(fuse, entries, deferredQuery), [fuse, entries, deferredQuery]);

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
            `calculator-result-${firstEntry.slug}`
          );
          firstResult?.focus();
        }
      }
    },
    [filtered, handleClear]
  );

  const resultCount = filtered.length;
  const showEmpty = query.trim() !== "" && resultCount === 0;

  return (
    <div>
      <label htmlFor="calculator-search-input" className="sr-only">
        {placeholder}
      </label>
      <div className="relative mb-8">
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

      <div
        id="calculator-search-status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {query.trim() === ""
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
          entries={filtered}
        />
      )}
    </div>
  );
}