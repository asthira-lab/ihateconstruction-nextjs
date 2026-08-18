// Quotation generate form page

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getProject } from "@/features/projects/service";
import { listBoqs } from "@/features/project-boqs/service";
import { QuotationGenerateForm } from "@/components/projects/QuotationGenerateForm";

export const metadata: Metadata = {
  title: "New Quotation",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuotationNewPage({ params }: PageProps) {
  const { id } = await params;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  // Load available BOQs for the picker
  let boqs: { id: string; name: string; grandTotal: string; currency: string }[] = [];
  try {
    const result = await listBoqs(id, { limit: 50 });
    boqs = result.items.map((b) => ({
      id: b.id,
      name: b.name,
      grandTotal: b.totals.grandTotal,
      currency: b.currency,
    }));
  } catch {
    // If BOQs fail to load, show form with empty picker
  }

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
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">New Quotation</h1>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">
              Generate a client-facing quotation from a Bill of Quantities with markup, discount, and tax.
            </p>
          </header>
          {boqs.length === 0 ? (
            <div className="rounded-lg border border-dashed border-black/15 p-10 text-center dark:border-white/15">
              <p className="text-sm text-black/70 dark:text-white/70">
                No BOQs available. Generate a BOQ first before creating a quotation.
              </p>
              <div className="mt-4">
                <Link href={`/projects/${id}/boqs/new`}>
                  <span className="text-sm font-medium underline">Generate BOQ →</span>
                </Link>
              </div>
            </div>
          ) : (
            <QuotationGenerateForm projectId={project.id} currency={project.currency} boqs={boqs} />
          )}
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
