// GET /api/pdf/invoice/[invoiceId] — stream Invoice as PDF
import { renderToStream } from "@react-pdf/renderer";
import { getInvoice } from "@/features/project-invoices/service";
import { InvoicePdfDocument } from "@/lib/pdf/templates/invoice-document";

export async function GET(_req: Request, { params }: { params: Promise<{ invoiceId: string }> }) {
  const { invoiceId } = await params;

  let invoice;
  try {
    invoice = await getInvoice(invoiceId);
  } catch {
    return new Response("Not Found", { status: 404 });
  }

  const stream = await renderToStream(<InvoicePdfDocument invoice={invoice} />);
  const filename = `Invoice-${invoice.invoiceNumber}.pdf`;

  return new Response(stream as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
