// Calculations list under a project — server component with grouped display.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getProject } from "@/features/projects/service";
import { listCalculations } from "@/features/project-calculations/service";
import { listMaterialKeysForProject } from "@/features/project-materials/service";
import { CalculationList } from "@/components/projects/CalculationList";
import { RunCalculatorDropdown } from "@/components/projects/RunCalculatorDropdown";

export const metadata: Metadata = {
  title: "Calculations",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ calculator?: string; group?: string; cursor?: string }>;
}

export default async function CalculationsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  const listing = await listCalculations(project.id, {
    calculator: sp.calculator,
    group: sp.group,
    cursor: sp.cursor,
  });
  const alreadyAdded = Array.from(await listMaterialKeysForProject(project.id));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <div className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
            <Link href={`/projects/${project.id}`} className="hover:text-black dark:hover:text-white">
              ← {project.name}
            </Link>
          </div>
          <header className="mb-8 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Calculations</h1>
              <p className="mt-3 text-sm text-black/70 dark:text-white/70">
                Snapshots of every calculator run saved into this project. Recompute to re-run against the latest presets.
              </p>
            </div>
            <RunCalculatorDropdown />
          </header>

          <CalculationList
            projectId={project.id}
            initialItems={listing.items}
            initialNextCursor={listing.nextCursor}
            initialHasMore={listing.hasMore}
            alreadyAddedMaterialKeys={alreadyAdded}
          />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
