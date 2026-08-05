// New invoice page — loads quotations for the picker, renders generate form.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getProject } from "@/features/projects/service";
import { InvoiceGenerateForm } from "@/components/projects/InvoiceGenerateForm";
import { getDb } from "@/lib/db";
import { requireUserId } from "@/lib/auth/require-user";
import { ensureProjectsSchema } from "@/lib/db/projects-schema";

export const metadata: Metadata = {
  title: "New Invoice",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function NewInvoicePage({ params }: PageProps) {
  const { id } = await params;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  const userId = await requireUserId();
  await ensureProjectsSchema();

  // Load quotations for the picker
  const quotRes = await getDb().query<{ id: string; name: string; grand_total: string }>(
    `SELECT id, name, grand_total FROM project_quotations WHERE project_id = $1 AND user_id = $2 ORDER BY created_at DESC LIMIT 100`,
    [project.id, userId],
  );
  const quotations = quotRes.rows.map((r) => ({ id: r.id, name: r.name, grandTotal: r.grand_total }));

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <div className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
            <Link href={`/projects/${project.id}/invoices`} className="hover:text-black dark:hover:text-white">
              ← Invoices
            </Link>
          </div>
          <h1 className="mb-8 text-3xl font-semibold tracking-tight sm:text-4xl">Generate Invoice</h1>
          {quotations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/20 p-8 text-center dark:border-white/20">
              <p className="text-sm text-black/60 dark:text-white/60">
                No quotations found. Create a quotation first, then generate an invoice from it.
              </p>
            </div>
          ) : (
            <InvoiceGenerateForm projectId={project.id} quotations={quotations} />
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
