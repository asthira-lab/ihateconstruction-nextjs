// Materials list under a project — server component.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { getProject } from "@/features/projects/service";
import { listMaterials } from "@/features/project-materials/service";
import { MaterialList } from "@/components/projects/MaterialList";

export const metadata: Metadata = {
  title: "Materials",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string; cursor?: string }>;
}

export default async function MaterialsPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  const listing = await listMaterials(project.id, { type: sp.type, cursor: sp.cursor });

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
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Materials</h1>
              <p className="mt-3 text-sm text-black/70 dark:text-white/70">
                Prices used to turn calculator quantities into a bill of materials. Currency: {project.currency}.
              </p>
            </div>
            <Link href={`/projects/${project.id}/materials/new`}>
              <Button variant="primary">Add material</Button>
            </Link>
          </header>

          <MaterialList
            projectId={project.id}
            currency={project.currency}
            initialItems={listing.items}
            initialNextCursor={listing.nextCursor}
            initialHasMore={listing.hasMore}
          />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
