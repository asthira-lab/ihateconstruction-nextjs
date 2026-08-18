// Material detail page — shows the record + edit form (patch mode).

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { Container } from "@/components/layout/Container";
import { getProject } from "@/features/projects/service";
import { getMaterial } from "@/features/project-materials/service";
import { MaterialForm } from "@/components/projects/MaterialForm";
import { MaterialDetailActions } from "@/components/projects/MaterialDetailActions";

export const metadata: Metadata = {
  title: "Material",
  robots: { index: false, follow: false },
};

interface PageProps {
  params: Promise<{ id: string; materialId: string }>;
}

export default async function MaterialDetailPage({ params }: PageProps) {
  const { id, materialId } = await params;
  let project, material;
  try {
    project = await getProject(id);
    material = await getMaterial(materialId);
  } catch {
    notFound();
  }
  if (material.projectId !== project.id) notFound();

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
          <header className="mb-8 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded bg-black/[.06] px-1.5 py-0.5 text-xs uppercase tracking-wider text-black/70 dark:bg-white/[.08] dark:text-white/70">
                  {material.type}
                </span>
                <span className="text-xs text-black/60 dark:text-white/60">· {material.unit}</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                {material.brand ?? material.type}
              </h1>
              <p className="mt-2 text-sm text-black/70 dark:text-white/70">
                {project.currency} {material.unitPrice} / {material.unit}
              </p>
              {material.quantity ? (
                <p className="mt-1 text-sm text-black/80 dark:text-white/80">
                  <span className="text-black/60 dark:text-white/60">Quantity:</span> {formatQty(material.quantity)} {material.unit}
                  <span className="mx-2 text-black/40 dark:text-white/40">·</span>
                  <span className="font-semibold">{project.currency} {formatTotal(material.quantity, material.unitPrice)}</span>
                  <span className="text-black/50 dark:text-white/50"> total</span>
                </p>
              ) : null}
            </div>
            <MaterialDetailActions materialId={material.id} projectId={project.id} />
          </header>

          <section className="mb-8">
            <MaterialForm mode="edit" projectId={project.id} currency={project.currency} initial={material} />
          </section>

          <section className="text-xs text-black/50 dark:text-white/50">
            Effective from {new Date(material.effectiveFrom).toLocaleDateString("en-IN")} · Created {new Date(material.createdAt).toLocaleString("en-IN")} ·
            Updated {new Date(material.updatedAt).toLocaleString("en-IN")}
          </section>
        </Container>
      </main>
      <SiteFooter />
    </>
  );
}

function formatQty(q: string): string {
  const n = Number(q);
  return Number.isFinite(n) ? n.toString() : q;
}

function formatTotal(q: string, price: string): string {
  const n = Number(q) * Number(price);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
