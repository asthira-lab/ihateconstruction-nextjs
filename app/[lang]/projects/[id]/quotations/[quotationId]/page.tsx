// Quotation detail page

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getProject } from "@/features/projects/service";
import { getQuotation } from "@/features/project-quotations/service";
import { QuotationDetailView } from "@/components/projects/QuotationDetailView";

export const metadata: Metadata = {
  title: "Quotation",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string; quotationId: string }>;
}

export default async function QuotationDetailPage({ params }: PageProps) {
  const { id, quotationId } = await params;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  let quotation;
  try {
    quotation = await getQuotation(quotationId);
  } catch {
    notFound();
  }

  if (quotation.projectId !== project.id) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <div className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
            <Link href={`/projects/${project.id}/quotations`} className="hover:text-black dark:hover:text-white">
              ← Quotations in {project.name}
            </Link>
          </div>
          <QuotationDetailView quotation={quotation} projectId={project.id} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
