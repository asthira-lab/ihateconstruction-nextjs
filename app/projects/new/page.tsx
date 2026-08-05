// New project page — server component wrapper for the client form.

import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { ProjectForm } from "@/components/projects/ProjectForm";

export const metadata: Metadata = {
  title: "New project",
  robots: { index: false, follow: false },
};

export default function NewProjectPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <header className="mb-8">
            <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Workspace</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">New project</h1>
          </header>
          <ProjectForm mode="create" />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
