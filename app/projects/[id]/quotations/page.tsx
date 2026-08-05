// Quotation list page

import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { getProject } from "@/features/projects/service";
import { listQuotations } from "@/features/project-quotations/service";

interface PageProps {
  params: Promise<{ id: string }>;
}

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-black/[.06] text-black/60 dark:bg-white/[.08] dark:text-white/60",
  sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  accepted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
  expired: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
};

export default async function QuotationListPage({ params }: PageProps) {
  const { id } = await params;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  let quotationsResult;
  try {
    quotationsResult = await listQuotations(id, { limit: 20 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to load quotations";
    return (
      <>
        <SiteHeader />
        <main className="flex-1">
          <Container className="py-12">
            <div className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
              <Link href={`/projects/${project.id}`} className="hover:text-black dark:hover:text-white">← {project.name}</Link>
            </div>
            <header className="mb-8 flex items-center justify-between gap-4">
              <h1 className="text-3xl font-semibold tracking-tight">Quotations</h1>
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
            <Link href={`/projects/${project.id}`} className="hover:text-black dark:hover:text-white">← {project.name}</Link>
          </div>
          <header className="mb-8 flex items-center justify-between gap-4">
            <h1 className="text-3xl font-semibold tracking-tight">Quotations</h1>
            <Link href={`/projects/${id}/quotations/new`}>
              <Button variant="primary">New Quotation</Button>
            </Link>
          </header>

          {quotationsResult.items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/15 p-10 text-center dark:border-white/15">
              <p className="text-sm text-black/70 dark:text-white/70">
                No quotations yet. Generate one from a BOQ to create a client-facing quote with markup.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-black/10 rounded-lg border border-black/10 dark:divide-white/10 dark:border-white/10">
              {quotationsResult.items.map((q) => (
                <li key={q.id}>
                  <Link
                    href={`/projects/${id}/quotations/${q.id}`}
                    className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-black/[.03] dark:hover:bg-white/[.05]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{q.name}</h3>
                        <span className={`rounded px-1.5 py-0.5 text-xs uppercase tracking-wider ${STATUS_COLORS[q.status] ?? ""}`}>
                          {q.status}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-black/60 dark:text-white/60">
                        {q.quotationNumber} · {q.clientName ?? "No client"} · +{q.markupPercentage}% markup
                      </p>
                    </div>
                    <div className="whitespace-nowrap text-right">
                      <p className="font-semibold">{q.currency} {q.grandTotal}</p>
                      <p className="text-xs text-black/50 dark:text-white/50">
                        {new Date(q.createdAt).toLocaleDateString("en-IN")}
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
