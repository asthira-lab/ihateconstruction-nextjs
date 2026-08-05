// Projects list page — server component. Auth-gated in Stage 6 via proxy.ts.

import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { listProjects } from "@/features/projects/service";
import { ProjectList } from "@/components/projects/ProjectList";

export const metadata: Metadata = {
  title: "Projects",
  description: "Your construction projects on ihateconstruction.co.",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ status?: string; search?: string; cursor?: string }>;
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const listing = await listProjects({
    status: sp.status,
    search: sp.search,
    cursor: sp.cursor,
  });

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <header className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Workspace</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Projects</h1>
              <p className="mt-3 max-w-2xl text-base text-black/70 dark:text-white/70">
                Every calculation, material price, and (soon) quotation lives inside a project. Create one per site or client.
              </p>
            </div>
            <Link href="/projects/new">
              <Button variant="primary">New project</Button>
            </Link>
          </header>

          <ProjectList
            initialItems={listing.items}
            initialNextCursor={listing.nextCursor}
            initialHasMore={listing.hasMore}
            currentStatus={sp.status ?? "active"}
          />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
