// Saved calculation detail — server component. Renders raw JSON of request + result, plus actions.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getProject } from "@/features/projects/service";
import { getCalculation } from "@/features/project-calculations/service";
import { CalculationDetailActions } from "@/components/projects/CalculationDetailActions";
import { CalculationEditForm } from "@/components/projects/CalculationEditForm";
import { CalculationResult } from "@/components/projects/CalculationResult";
import { MaterialsFromCalculation } from "@/components/projects/MaterialsFromCalculation";
import { extractMaterialSuggestions } from "@/features/project-materials/from-calculation";
import { listMaterialKeysForProject } from "@/features/project-materials/service";

export const metadata: Metadata = {
  title: "Calculation",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string; calcId: string }>;
}

export default async function CalculationDetailPage({ params }: PageProps) {
  const { id, calcId } = await params;

  let project, calc;
  try {
    project = await getProject(id);
    calc = await getCalculation(calcId);
  } catch {
    notFound();
  }
  if (calc.projectId !== project.id) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <div className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
            <Link
              href={`/projects/${project.id}/calculations`}
              className="hover:text-black dark:hover:text-white"
            >
              ← Calculations in {project.name}
            </Link>
          </div>
          <header className="mb-8 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-black/[.06] px-1.5 py-0.5 text-xs uppercase tracking-wider text-black/70 dark:bg-white/[.08] dark:text-white/70">
                  {calc.calculator}
                </span>
                {calc.group ? (
                  <span className="text-xs text-black/60 dark:text-white/60">· {calc.group}</span>
                ) : null}
              </div>
              <h1 className="truncate text-2xl font-semibold tracking-tight sm:text-3xl">{calc.label}</h1>
              {calc.description ? (
                <p className="mt-2 text-sm text-black/70 dark:text-white/70">{calc.description}</p>
              ) : null}
            </div>
            <CalculationDetailActions calc={calc} projectId={project.id} />
          </header>

          <section className="mb-8">
            <CalculationEditForm calc={calc} />
          </section>

          <section className="mb-8">
            <h2 className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">Result</h2>
            <CalculationResult calc={calc} />
            <MaterialsFromCalculation
              projectId={project.id}
              calcLabel={calc.label}
              suggestions={extractMaterialSuggestions(calc)}
              alreadyAdded={Array.from(await listMaterialKeysForProject(project.id))}
            />
          </section>

          <section className="text-xs text-black/50 dark:text-white/50">
            Computed {new Date(calc.computedAt).toLocaleString()} · Created {new Date(calc.createdAt).toLocaleString()} ·
            Updated {new Date(calc.updatedAt).toLocaleString()}
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
