// BOQ PDF template
import { Document, Page, View } from "@react-pdf/renderer";
import { styles } from "../styles";
import { formatCurrency, formatDate } from "../format";
import { PdfHeader, PdfFooter, PdfSectionHeader, PdfTableHeader, PdfTableRow, PdfTotalsBlock, PdfNotes } from "../components";
import type { Boq } from "@/features/project-boqs/types";

const COLS = [
  { label: "Material", width: "30%", align: "left" as const },
  { label: "Brand", width: "18%", align: "left" as const },
  { label: "Qty", width: "12%", align: "right" as const },
  { label: "Unit", width: "12%", align: "left" as const },
  { label: "Price/Unit", width: "14%", align: "right" as const },
  { label: "Amount", width: "14%", align: "right" as const },
];
const WIDTHS = COLS.map((c) => c.width);
const ALIGNS = COLS.map((c) => c.align);

export function BoqPdfDocument({ boq }: { boq: Boq }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader
          title="Bill of Quantities"
          subtitle={boq.name}
          meta={`Generated ${formatDate(boq.generatedAt)}  ·  Currency: ${boq.currency}`}
        />

        {boq.sections.map((section, si) => (
          <View key={si} wrap={false}>
            <PdfSectionHeader
              title={section.group || "General"}
              subtotal={formatCurrency(section.sectionSubtotal, boq.currency)}
            />
            <PdfTableHeader columns={COLS} />
            {section.lines.map((line) =>
              line.materials.map((m, mi) => (
                <PdfTableRow
                  key={`${line.id}-${mi}`}
                  cells={[
                    m.type,
                    m.brand ?? "—",
                    m.quantity.value,
                    m.quantity.unit,
                    formatCurrency(m.unitPrice, boq.currency),
                    formatCurrency(m.amount, boq.currency),
                  ]}
                  widths={WIDTHS}
                  aligns={ALIGNS}
                />
              ))
            )}
          </View>
        ))}

        <PdfTotalsBlock
          rows={[
            { label: "Materials Subtotal:", value: formatCurrency(boq.totals.materialsSubtotal, boq.currency) },
            { label: "Grand Total:", value: formatCurrency(boq.totals.grandTotal, boq.currency), bold: true },
          ]}
        />

        <PdfNotes title="Notes" text={boq.notes} />
        <PdfFooter />
      </Page>
    </Document>
  );
}
