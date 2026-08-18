"use client";

// Client action buttons for a Project — archive / unarchive / delete.

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/Button";
import {
  archiveProjectAction,
  deleteProjectAction,
  unarchiveProjectAction,
} from "@/app/[lang]/projects/actions";
import type { Project } from "@/features/projects";

export function ProjectActions({ project }: { project: Project }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggleArchive() {
    setError(null);
    startTransition(async () => {
      const res =
        project.status === "archived"
          ? await unarchiveProjectAction(project.id)
          : await archiveProjectAction(project.id);
      if (!res.ok) setError(res.error.message);
      else router.refresh();
    });
  }

  function confirmDelete() {
    if (!window.confirm(`Delete project "${project.name}"? This cannot be undone.`)) return;
    setError(null);
    startTransition(async () => {
      const res = await deleteProjectAction(project.id);
      if (!res.ok) setError(res.error.message);
      else router.push("/projects");
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={toggleArchive} disabled={pending}>
          {project.status === "archived" ? "Unarchive" : "Archive"}
        </Button>
        <Button variant="danger" size="sm" onClick={confirmDelete} disabled={pending}>
          Delete
        </Button>
      </div>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
