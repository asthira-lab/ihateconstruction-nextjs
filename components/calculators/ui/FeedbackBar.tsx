"use client";

// "Did we solve your problem?" yes/no feedback bar.

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function FeedbackBar({
  question,
  yesLabel,
  noLabel,
  thanksLabel,
}: {
  question: string;
  yesLabel: string;
  noLabel: string;
  thanksLabel?: string;
}) {
  const [answered, setAnswered] = useState<null | "yes" | "no">(null);

  if (answered && thanksLabel) {
    return <p className="text-sm text-black/60 dark:text-white/60">{thanksLabel}</p>;
  }

  if (answered) return null;

  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-black/60 dark:text-white/60">{question}</span>
      <Button type="button" variant="secondary" size="sm" onClick={() => setAnswered("yes")}>
        {yesLabel}
      </Button>
      <Button type="button" variant="secondary" size="sm" onClick={() => setAnswered("no")}>
        {noLabel}
      </Button>
    </div>
  );
}
