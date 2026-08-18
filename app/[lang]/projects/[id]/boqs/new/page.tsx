// BOQ generate form page

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getProject } from "@/features/projects/service";
import { listCalculations } from "@/features/project-calculations/service";
import { listMaterials } from "@/features/project-materials/service";
import { BoqGenerateForm } from "@/components/projects/BoqGenerateForm";

export const metadata: Metadata = {
  title: "Generate BOQ",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BoqNewPage({ params }: PageProps) {
  const { id } = await params;

  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  // Fetch calculations and materials for the form
  let calculations: { id: string; label: string; calculator: string; group: string | null }[] = [];
  let materialCount = 0;

  try {
    const calcs = await listCalculations(id, { limit: 100 });
    calculations = calcs.items.map((c) => {
      return { id: c.id, label: c.label, calculator: c.calculator, group: c.group ?? null };
    });
  } catch { /* ignore */ }

  try {
    const mats = await listMaterials(id, { limit: 100 });
    materialCount = mats.items.length;
  } catch { /* ignore */ }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <div className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
            <Link href={`/projects/${project.id}/boqs`} className="hover:text-black dark:hover:text-white">
              ← BOQs in {project.name}
            </Link>
          </div>
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight">Generate Bill of Quantities</h1>
            <p className="mt-2 text-sm text-black/70 dark:text-white/70">
              Create a structured breakdown from your project materials. Optionally include calculation results.
            </p>
          </header>
          <BoqGenerateForm
            projectId={project.id}
            calculations={calculations}
            materialCount={materialCount}
          />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
