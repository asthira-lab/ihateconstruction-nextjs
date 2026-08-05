// BOQ detail page

import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getProject } from "@/features/projects/service";
import { getBoq } from "@/features/project-boqs/service";
import { listMaterials } from "@/features/project-materials/service";
import { BoqDetailView } from "@/components/projects/BoqDetailView";

export const metadata: Metadata = {
  title: "Bill of Quantities",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string; boqId: string }>;
}

export default async function BoqDetailPage({ params }: PageProps) {
  const { id, boqId } = await params;

  let project, boq;
  try {
    project = await getProject(id);
    boq = await getBoq(boqId);
  } catch {
    notFound();
  }

  if (boq.projectId !== project.id) notFound();

  let projectMaterials: { type: string; brand: string | null; unitPrice: string }[] = [];
  try {
    const mats = await listMaterials(project.id, { limit: 100 });
    projectMaterials = mats.items.map((m) => ({ type: m.type, brand: m.brand, unitPrice: m.unitPrice }));
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
          <BoqDetailView boq={boq} projectId={project.id} projectMaterials={projectMaterials} />
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}
