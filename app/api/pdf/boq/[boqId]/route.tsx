// GET /api/pdf/boq/[boqId] — stream BOQ as PDF
import { renderToStream } from "@react-pdf/renderer";
import { getBoq } from "@/features/project-boqs/service";
import { BoqPdfDocument } from "@/lib/pdf/templates/boq-document";

export async function GET(_req: Request, { params }: { params: Promise<{ boqId: string }> }) {
  const { boqId } = await params;

  let boq;
  try {
    boq = await getBoq(boqId);
  } catch {
    return new Response("Not Found", { status: 404 });
  }

  const stream = await renderToStream(<BoqPdfDocument boq={boq} />);
  const filename = `BOQ-${boq.name.replace(/[^a-zA-Z0-9\-_ ]/g, "").slice(0, 60)}.pdf`;

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
