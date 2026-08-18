// Invoice detail page — server component showing full invoice with payment controls.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getProject } from "@/features/projects/service";
import { getInvoice } from "@/features/project-invoices/service";
import { InvoiceDetailView } from "@/components/projects/InvoiceDetailView";

export const metadata: Metadata = {
  title: "Invoice",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string; invoiceId: string }>;
}

export default async function InvoiceDetailPage({ params }: PageProps) {
  const { id, invoiceId } = await params;

  let project, invoice;
  try {
    project = await getProject(id);
    invoice = await getInvoice(invoiceId);
  } catch {
    notFound();
  }
  if (invoice.projectId !== project.id) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <div className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
            <Link
              href={`/projects/${project.id}/invoices`}
              className="hover:text-black dark:hover:text-white"
            >
              ← Invoices in {project.name}
            </Link>
          </div>
          <InvoiceDetailView invoice={invoice} projectId={project.id} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
