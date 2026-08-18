// "Check out similar calculators" strip — link list to sibling tools.

import Link from "next/link";

export function SimilarCalculators({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <p className="text-sm font-semibold">{title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="rounded-full border border-black/15 px-3 py-1 text-sm text-black/75 transition-colors hover:border-black/30 hover:text-black dark:border-white/20 dark:text-white/75 dark:hover:border-white/40 dark:hover:text-white"
          >
            {l.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
