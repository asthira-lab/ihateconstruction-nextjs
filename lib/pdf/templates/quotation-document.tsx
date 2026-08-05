// Quotation PDF template
import { Document, Page, View } from "@react-pdf/renderer";
import { styles } from "../styles";
import { formatCurrency, formatDate } from "../format";
import { PdfHeader, PdfFooter, PdfClientBlock, PdfSectionHeader, PdfTableHeader, PdfTableRow, PdfTotalsBlock, PdfNotes } from "../components";
import type { Quotation } from "@/features/project-quotations/types";

const COLS = [
  { label: "Item", width: "32%", align: "left" as const },
  { label: "Qty", width: "10%", align: "right" as const },
  { label: "Unit", width: "12%", align: "left" as const },
  { label: "Rate", width: "18%", align: "right" as const },
  { label: "Amount", width: "18%", align: "right" as const },
];
const WIDTHS = COLS.map((c) => c.width);
const ALIGNS = COLS.map((c) => c.align);

export function QuotationPdfDocument({ quotation }: { quotation: Quotation }) {
  const q = quotation;
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader
          title="QUOTATION"
          subtitle={`${q.quotationNumber}  —  ${q.name}`}
          meta={`Status: ${q.status.toUpperCase()}  ·  Valid until: ${formatDate(q.validUntil)}  ·  Created: ${formatDate(q.createdAt)}`}
        />

        <PdfClientBlock name={q.clientName} email={q.clientEmail} phone={q.clientPhone} />

        {q.sections.map((section, si) => (
          <View key={si} wrap={false}>
            <PdfSectionHeader
              title={section.group || "General"}
              subtotal={formatCurrency(section.sectionSubtotal, q.currency)}
            />
            <PdfTableHeader columns={COLS} />
            {section.lines.map((line) => (
              <PdfTableRow
                key={line.id}
                cells={[
                  line.label,
                  line.quantity,
                  line.unit ?? "—",
                  formatCurrency(line.unitRate, q.currency),
                  formatCurrency(line.amount, q.currency),
                ]}
                widths={WIDTHS}
                aligns={ALIGNS}
              />
            ))}
          </View>
        ))}

        <PdfTotalsBlock
          rows={[
            { label: "Materials Subtotal:", value: formatCurrency(q.materialsSubtotal, q.currency) },
            { label: `Markup (${q.markupPercentage}%):`, value: `+ ${formatCurrency(q.markupAmount, q.currency)}` },
            { label: `Discount (${q.discountPercentage}%):`, value: `− ${formatCurrency(q.discountAmount, q.currency)}` },
            { label: `Tax (${q.taxPercentage}%):`, value: `+ ${formatCurrency(q.taxAmount, q.currency)}` },
            { label: "Grand Total:", value: formatCurrency(q.grandTotal, q.currency), bold: true },
          ]}
        />

        <PdfNotes title="Notes" text={q.notes} />
        <PdfNotes title="Terms & Conditions" text={q.terms} />
        <PdfFooter />
      </Page>
    </Document>
  );
}
