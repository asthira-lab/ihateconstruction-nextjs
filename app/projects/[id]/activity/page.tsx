// Activity log page — server component showing audit trail for a project
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { getProject } from "@/features/projects/service";
import { listActivityLog } from "@/features/audit-log/service";

export const metadata: Metadata = {
  title: "Activity",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cursor?: string; type?: string }>;
}

const ACTION_ICONS: Record<string, string> = {
  created: "🆕",
  updated: "✏️",
  deleted: "🗑️",
  status_changed: "🔄",
  payment_recorded: "💰",
  regenerated: "♻️",
};

const TYPE_LABELS: Record<string, string> = {
  boq: "BOQ",
  quotation: "Quotation",
  invoice: "Invoice",
};

export default async function ActivityPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  const entityType = sp.type as "boq" | "quotation" | "invoice" | undefined;
  const listing = await listActivityLog(project.id, { cursor: sp.cursor, entityType });

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
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Activity Log</h1>
            <p className="mt-3 text-sm text-black/70 dark:text-white/70">
              All changes to BOQs, quotations, and invoices in this project.
            </p>
          </header>

          {/* Filters */}
          <div className="mb-6 flex gap-2">
            <Link href={`/projects/${project.id}/activity`}>
              <Button variant={!entityType ? "primary" : "secondary"} size="sm">All</Button>
            </Link>
            <Link href={`/projects/${project.id}/activity?type=boq`}>
              <Button variant={entityType === "boq" ? "primary" : "secondary"} size="sm">BOQ</Button>
            </Link>
            <Link href={`/projects/${project.id}/activity?type=quotation`}>
              <Button variant={entityType === "quotation" ? "primary" : "secondary"} size="sm">Quotation</Button>
            </Link>
            <Link href={`/projects/${project.id}/activity?type=invoice`}>
              <Button variant={entityType === "invoice" ? "primary" : "secondary"} size="sm">Invoice</Button>
            </Link>
          </div>

          {listing.items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/20 p-8 text-center dark:border-white/20">
              <p className="text-sm text-black/60 dark:text-white/60">No activity yet.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {listing.items.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 rounded-lg border border-black/5 p-3 dark:border-white/5">
                  <span className="mt-0.5 text-lg">{ACTION_ICONS[entry.action] ?? "•"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">{entry.summary}</p>
                    <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">
                      <span className="inline-block rounded bg-black/[.04] px-1.5 py-0.5 text-xs dark:bg-white/[.06]">
                        {TYPE_LABELS[entry.entityType] ?? entry.entityType}
                      </span>
                      {" · "}
                      {new Date(entry.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {listing.hasMore && listing.nextCursor ? (
            <div className="mt-6 text-center">
              <Link href={`/projects/${project.id}/activity?cursor=${listing.nextCursor}${entityType ? `&type=${entityType}` : ""}`}>
                <Button variant="secondary" size="sm">Load more</Button>
              </Link>
            </div>
          ) : null}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
