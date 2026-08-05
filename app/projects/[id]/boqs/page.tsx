// BOQ list page

import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { getProject } from "@/features/projects/service";
import { listBoqs } from "@/features/project-boqs/service";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BoqListPage({ params }: PageProps) {
  const { id } = await params;

  let project, boqsResult;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  try {
    boqsResult = await listBoqs(id, { limit: 20 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load BOQs";
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
            <header className="mb-8 flex items-center justify-between gap-4">
              <h1 className="text-3xl font-semibold tracking-tight">Bills of Quantities</h1>
              <Link href={`/projects/${id}/boqs/new`}>
                <Button variant="primary">Generate BOQ</Button>
              </Link>
            </header>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
              <p className="text-sm text-red-700 dark:text-red-200">{msg}</p>
            </div>
          </Container>
        </main>
        <SiteFooter />
      </>
    );
  }

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
          <header className="mb-8 flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">Bills of Quantities</h1>
            <Link href={`/projects/${id}/boqs/new`}>
              <Button variant="primary">Generate BOQ</Button>
            </Link>
          </header>

          {boqsResult.items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/15 p-10 text-center dark:border-white/15">
              <p className="text-sm text-black/70 dark:text-white/70">
                No BOQs yet. Generate one from your saved calculations to see a structured bill of materials.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
              {boqsResult.items.map((boq) => (
                <li key={boq.id}>
                  <Link
                    href={`/projects/${id}/boqs/${boq.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                  >
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium">{boq.name}</h3>
                      {boq.notes ? (
                        <p className="mt-0.5 truncate text-xs text-black/60 dark:text-white/60">{boq.notes}</p>
                      ) : null}
                    </div>
                    <div className="whitespace-nowrap text-right">
                      <p className="font-semibold">
                        {boq.currency} {boq.totals.grandTotal}
                      </p>
                      <p className="text-xs text-black/50 dark:text-white/50">
                        {boq.totals.unknownPriceLineCount > 0 && `+${boq.totals.unknownPriceLineCount} unpriced · `}
                        {new Date(boq.generatedAt).toLocaleDateString("en-IN")}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
