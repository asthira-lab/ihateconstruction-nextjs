// Table of contents — ordered list of anchor links into the article.

export interface TocEntry {
  id: string;
  label: string;
}

export function TableOfContents({
  title,
  entries,
}: {
  title: string;
  entries: TocEntry[];
}) {
  return (
    <nav aria-label={title} className="rounded-lg border border-black/10 p-5 dark:border-white/10">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">
        {title}
      </p>
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-black/75 dark:text-white/75">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              className="underline decoration-black/20 underline-offset-2 hover:decoration-black/60 dark:decoration-white/20 dark:hover:decoration-white/60"
            >
              {entry.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
