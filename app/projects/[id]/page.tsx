// Project detail page — server component. Shows counts, metadata, edit/archive/delete controls.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { getProject } from "@/features/projects/service";
import { ProjectActions } from "@/components/projects/ProjectActions";

export const metadata: Metadata = {
  title: "Project",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
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
            <Link href="/projects" className="hover:text-black dark:hover:text-white">
              ← All projects
            </Link>
          </div>
          <header className="mb-8 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-3xl font-semibold tracking-tight sm:text-4xl">{project.name}</h1>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                {project.clientName ?? "No client"} · {project.currency} · Tax region {project.taxRegion}
                {project.status === "archived" ? " · Archived" : ""}
              </p>
            </div>
            <div className="flex gap-2">
              <Link href={`/projects/${project.id}/edit`}>
                <Button variant="secondary" size="sm">
                  Edit
                </Button>
              </Link>
              <ProjectActions project={project} />
            </div>
          </header>

          <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatLink label="Calculations" value={project.counts.calculations} href={`/projects/${project.id}/calculations`} />
            <StatLink label="Materials" value={project.counts.materials} href={`/projects/${project.id}/materials`} />
            <StatLink label="Bills of Quantities" value={project.counts.boqs ?? 0} href={`/projects/${project.id}/boqs`} />
            <StatLink label="Quotations" value={project.counts.quotations} href={`/projects/${project.id}/quotations`} />
            <StatLink label="Invoices" value={project.counts.invoices ?? 0} href={`/projects/${project.id}/invoices`} />
          </section>

          {project.notes ? (
            <section className="mb-10 rounded-lg border border-black/10 p-4 dark:border-white/10">
              <h2 className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Notes</h2>
              <p className="whitespace-pre-wrap text-sm text-black/80 dark:text-white/80">{project.notes}</p>
            </section>
          ) : null}

          {project.location ? (
            <section className="mb-10 rounded-lg border border-black/10 p-4 dark:border-white/10">
              <h2 className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Location</h2>
              <address className="not-italic text-sm text-black/80 dark:text-white/80">
                {[project.location.address, project.location.city, project.location.state, project.location.pincode, project.location.country]
                  .filter(Boolean)
                  .join(", ")}
              </address>
            </section>
          ) : null}

          <section className="text-xs text-black/50 dark:text-white/50">
            Created {new Date(project.createdAt).toLocaleString()} · Updated {new Date(project.updatedAt).toLocaleString()}
            {" · "}
            <Link href={`/projects/${project.id}/activity`} className="underline hover:text-black dark:hover:text-white">
              Activity Log
            </Link>
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="rounded-lg border border-black/10 p-4 dark:border-white/10">
      <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {sub ? <p className="mt-1 text-xs text-black/40 dark:text-white/40">{sub}</p> : null}
    </div>
  );
}

function StatLink({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-black/10 p-4 transition-colors hover:bg-black/[.03] dark:border-white/10 dark:hover:bg-white/[.05]"
    >
      <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-1 text-xs text-black/40 dark:text-white/40">View →</p>
    </Link>
  );
}
