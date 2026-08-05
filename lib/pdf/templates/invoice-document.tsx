// Invoice PDF template
import { Document, Page, View, Text } from "@react-pdf/renderer";
import { styles } from "../styles";
import { formatCurrency, formatDate } from "../format";
import { PdfHeader, PdfFooter, PdfClientBlock, PdfTotalsBlock, PdfNotes } from "../components";
import type { Invoice } from "@/features/project-invoices/types";

export function InvoicePdfDocument({ invoice }: { invoice: Invoice }) {
  const remaining = (parseFloat(invoice.amountDue) - parseFloat(invoice.amountPaid)).toFixed(2);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PdfHeader
          title="INVOICE"
          subtitle={`${invoice.invoiceNumber}  —  ${invoice.name}`}
          meta={`Status: ${invoice.status.toUpperCase()}  ·  Due: ${formatDate(invoice.dueDate)}  ·  Created: ${formatDate(invoice.createdAt)}`}
        />

        <PdfClientBlock name={invoice.clientName} email={invoice.clientEmail} phone={invoice.clientPhone} />

        <PdfTotalsBlock
          rows={[
            { label: "Amount Due:", value: formatCurrency(invoice.amountDue, invoice.currency), bold: true },
            { label: "Amount Paid:", value: formatCurrency(invoice.amountPaid, invoice.currency) },
            { label: "Remaining:", value: formatCurrency(remaining, invoice.currency), bold: true },
          ]}
        />

        <PdfNotes title="Payment Notes" text={invoice.paymentNotes} />
        <PdfNotes title="Notes" text={invoice.notes} />

        {invoice.paidAt ? (
          <View style={styles.notesSection}>
            <Text style={styles.meta}>Paid on {formatDate(invoice.paidAt)}</Text>
          </View>
        ) : null}

        <PdfFooter />
      </Page>
    </Document>
  );
}
