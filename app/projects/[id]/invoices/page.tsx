// Invoices list under a project — server component with status badges.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { Button } from "@/components/ui/Button";
import { getProject } from "@/features/projects/service";
import { listInvoices } from "@/features/project-invoices/service";

export const metadata: Metadata = {
  title: "Invoices",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ cursor?: string }>;
}

export default async function InvoicesPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  const listing = await listInvoices(project.id, { cursor: sp.cursor });

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
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Invoices</h1>
              <p className="mt-3 text-sm text-black/70 dark:text-white/70">
                Invoices generated from quotations. Track payments and outstanding amounts.
              </p>
            </div>
            <Link href={`/projects/${project.id}/invoices/new`}>
              <Button size="sm">New Invoice</Button>
            </Link>
          </header>

          {listing.items.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/20 p-8 text-center dark:border-white/20">
              <p className="text-sm text-black/60 dark:text-white/60">No invoices yet. Generate one from a quotation.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {listing.items.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/projects/${project.id}/invoices/${inv.id}`}
                  className="block rounded-lg border border-black/10 p-4 transition-colors hover:bg-black/[.03] dark:border-white/10 dark:hover:bg-white/[.05]"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{inv.invoiceNumber}</span>
                        <StatusBadge status={inv.status} />
                      </div>
                      <p className="mt-1 truncate text-sm text-black/70 dark:text-white/70">{inv.name}</p>
                      {inv.clientName ? (
                        <p className="mt-0.5 text-xs text-black/50 dark:text-white/50">{inv.clientName}</p>
                      ) : null}
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-medium">{inv.currency} {inv.amountDue}</p>
                      <p className="text-xs text-black/50 dark:text-white/50">
                        Paid: {inv.currency} {inv.amountPaid}
                      </p>
                      {inv.dueDate ? (
                        <p className="mt-1 text-xs text-black/50 dark:text-white/50">
                          Due {new Date(inv.dueDate).toLocaleDateString("en-IN")}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {listing.hasMore && listing.nextCursor ? (
            <div className="mt-6 text-center">
              <Link href={`/projects/${project.id}/invoices?cursor=${listing.nextCursor}`}>
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

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    unpaid: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    partial: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  };
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium uppercase ${colors[status] ?? ""}`}>
      {status}
    </span>
  );
}
