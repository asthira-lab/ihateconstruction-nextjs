// GET /api/pdf/quotation/[quotationId] — stream Quotation as PDF
import { renderToStream } from "@react-pdf/renderer";
import { getQuotation } from "@/features/project-quotations/service";
import { QuotationPdfDocument } from "@/lib/pdf/templates/quotation-document";

export async function GET(_req: Request, { params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId } = await params;

  let quotation;
  try {
    quotation = await getQuotation(quotationId);
  } catch {
    return new Response("Not Found", { status: 404 });
  }

  const stream = await renderToStream(<QuotationPdfDocument quotation={quotation} />);
  const filename = `Quotation-${quotation.quotationNumber}.pdf`;

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
