// Article header — title, subtitle, and optional updated date / authors / reviewers / helpful count.

export function ArticleHeader({
  eyebrow,
  title,
  subtitle,
  updatedLabel,
  updatedValue,
  creatorsLabel,
  creators,
  reviewersLabel,
  reviewers,
  helpfulLabel,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  updatedLabel?: string;
  updatedValue?: string;
  creatorsLabel?: string;
  creators?: string[];
  reviewersLabel?: string;
  reviewers?: string[];
  helpfulLabel?: string;
}) {
  return (
    <header className="space-y-4">
      <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
        {eyebrow}
      </p>
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
      {subtitle ? (
        <p className="max-w-2xl text-base text-black/70 dark:text-white/70">{subtitle}</p>
      ) : null}

      {updatedLabel && updatedValue ? (
        <p className="text-xs text-black/50 dark:text-white/50">
          {updatedLabel}: <time>{updatedValue}</time>
        </p>
      ) : null}

      {(creators?.length || reviewers?.length) ? (
        <div className="grid gap-4 border-t border-black/10 pt-4 text-sm dark:border-white/10 sm:grid-cols-2">
          {creators?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">
                {creatorsLabel}
              </p>
              <p className="mt-1 text-black/75 dark:text-white/75">{creators.join(", ")}</p>
            </div>
          ) : null}
          {reviewers?.length ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-black/60 dark:text-white/60">
                {reviewersLabel}
              </p>
              <p className="mt-1 text-black/75 dark:text-white/75">{reviewers.join(", ")}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {helpfulLabel ? (
        <p className="text-sm text-black/60 dark:text-white/60">{helpfulLabel}</p>
      ) : null}
    </header>
  );
}
