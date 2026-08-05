"use client";

// Embeddable on each calculator page. Only visible when signed in. Opens a project picker.

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import {
  listActiveProjectsForPickerAction,
  saveCalculationAction,
} from "@/app/projects/[id]/calculations/actions";
import type { CalculatorSlug } from "@/features/project-calculations";

interface Props {
  calculator: CalculatorSlug;
  request: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
}

interface ProjectOption {
  id: string;
  name: string;
}

export function SaveToProjectButton({ calculator, request, result }: Props) {
  const { isSignedIn, isLoaded } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [pickedId, setPickedId] = useState<string>("");
  const [label, setLabel] = useState("");
  const [group, setGroup] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const disabled = !request || !result;

  useEffect(() => {
    if (!open || projects.length) return;
    setLoading(true);
    setError(null);
    listActiveProjectsForPickerAction()
      .then((res) => {
        if (!res.ok) setError(res.error.message);
        else {
          setProjects(res.data);
          const first = res.data[0];
          if (first) setPickedId(first.id);
        }
      })
      .finally(() => setLoading(false));
  }, [open, projects.length]);

  if (!isLoaded || !isSignedIn) return null;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!pickedId || !request || !result) return;
    setError(null);
    startTransition(async () => {
      const res = await saveCalculationAction(pickedId, {
        calculator,
        label: label.trim() || `${calculator[0]?.toUpperCase()}${calculator.slice(1)} calc`,
        group: group.trim() || null,
        request,
        result,
      });
      if (!res.ok) {
        setError(res.error.message);
        return;
      }
      setOpen(false);
      setLabel("");
      setGroup("");
      router.push(`/projects/${pickedId}/calculations/${res.data.id}`);
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? "Run the calculator first" : "Save this run to a project"}
      >
        Save to project
      </Button>
      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-black/10 bg-white p-6 shadow-lg dark:border-white/10 dark:bg-black"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-4 text-lg font-semibold">Save calculation</h3>
            <form onSubmit={submit} className="space-y-4">
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Project</span>
                {loading ? (
                  <p className="text-sm text-black/60 dark:text-white/60">Loading projects…</p>
                ) : projects.length === 0 ? (
                  <p className="text-sm text-black/60 dark:text-white/60">
                    You have no active projects.{" "}
                    <a href="/projects/new" className="underline">
                      Create one
                    </a>
                    .
                  </p>
                ) : (
                  <select
                    value={pickedId}
                    onChange={(e) => setPickedId(e.target.value)}
                    className={inputClass}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                )}
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Label</span>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  maxLength={200}
                  placeholder="e.g. Ground floor bricks"
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm font-medium">Group (optional)</span>
                <input
                  type="text"
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  maxLength={60}
                  placeholder="e.g. Ground floor"
                  className={inputClass}
                />
              </label>
              {error ? <p className="text-sm text-red-600">{error}</p> : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={pending || !pickedId}>
                  {pending ? "Saving…" : "Save"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}

const inputClass =
  "w-full rounded border border-black/15 bg-white px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-1 dark:border-white/15 dark:bg-black dark:text-white dark:focus:ring-white";
