// Edit project page — server component fetching current project, delegating to shared form.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getProject } from "@/features/projects/service";
import { ProjectForm } from "@/components/projects/ProjectForm";

export const metadata: Metadata = {
  title: "Edit project",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProjectPage({ params }: PageProps) {
  const { id } = await params;
  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <div className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
            <Link href={`/projects/${project.id}`} className="hover:text-black dark:hover:text-white">
              ← Back to {project.name}
            </Link>
          </div>
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Edit project</h1>
          </header>
          <ProjectForm mode="edit" initial={project} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
