// New material page wrapper.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getProject } from "@/features/projects/service";
import { MaterialForm, type MaterialSuggestionPrefill } from "@/components/projects/MaterialForm";
import type { MaterialType } from "@/features/project-materials";
import { MATERIAL_TYPES } from "@/features/project-materials";

export const metadata: Metadata = {
  title: "Add material",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    type?: string;
    unit?: string;
    brand?: string;
    quantity?: string;
    quantityHint?: string;
    sourceLabel?: string;
  }>;
}

function isMaterialType(v: string | undefined): v is MaterialType {
  return typeof v === "string" && (MATERIAL_TYPES as readonly string[]).includes(v);
}

export default async function NewMaterialPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const sp = await searchParams;
  let project;
  try {
    project = await getProject(id);
  } catch {
    notFound();
  }

  // Sanitize URL params into a prefill object — unknown values fall through to the form's defaults.
  const prefill: MaterialSuggestionPrefill | undefined =
    sp.type || sp.unit || sp.brand || sp.quantity || sp.quantityHint || sp.sourceLabel
      ? {
          type: isMaterialType(sp.type) ? sp.type : undefined,
          unit: sp.unit,
          brand: sp.brand,
          quantity: sp.quantity,
          quantityHint: sp.quantityHint,
          sourceLabel: sp.sourceLabel,
        }
      : undefined;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <Container className="py-12">
          <div className="mb-2 text-xs uppercase tracking-widest text-black/60 dark:text-white/60">
            <Link href={`/projects/${project.id}/materials`} className="hover:text-black dark:hover:text-white">
              ← Materials in {project.name}
            </Link>
          </div>
          <header className="mb-8">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Add material</h1>
          </header>
          <MaterialForm mode="create" projectId={project.id} currency={project.currency} prefill={prefill} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
