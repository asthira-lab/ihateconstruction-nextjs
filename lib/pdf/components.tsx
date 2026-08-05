// Reusable PDF components
import { View, Text, Page, Document } from "@react-pdf/renderer";
import { styles } from "./styles";

export function PdfHeader({ title, subtitle, meta }: { title: string; subtitle?: string; meta?: string }) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {meta ? <Text style={styles.meta}>{meta}</Text> : null}
    </View>
  );
}

export function PdfClientBlock({ name, email, phone }: { name?: string | null; email?: string | null; phone?: string | null }) {
  if (!name && !email && !phone) return null;
  return (
    <View style={styles.clientBlock}>
      {name ? <Text style={styles.clientName}>{name}</Text> : null}
      {email ? <Text style={styles.clientDetail}>{email}</Text> : null}
      {phone ? <Text style={styles.clientDetail}>{phone}</Text> : null}
    </View>
  );
}

export function PdfSectionHeader({ title, subtotal }: { title: string; subtotal?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text>{title}{subtotal ? `  —  ${subtotal}` : ""}</Text>
    </View>
  );
}

export function PdfTableHeader({ columns }: { columns: { label: string; width: string; align?: "left" | "right" }[] }) {
  return (
    <View style={styles.tableHeader}>
      {columns.map((col, i) => (
        <Text key={i} style={[col.align === "right" ? styles.headerCell : styles.headerCell, { width: col.width, textAlign: col.align ?? "left" }]}>
          {col.label}
        </Text>
      ))}
    </View>
  );
}

export function PdfTableRow({ cells, widths, aligns }: { cells: string[]; widths: string[]; aligns?: ("left" | "right")[] }) {
  return (
    <View style={styles.tableRow}>
      {cells.map((cell, i) => (
        <Text key={i} style={[styles.cellLeft, { width: widths[i], textAlign: aligns?.[i] ?? "left" }]}>
          {cell}
        </Text>
      ))}
    </View>
  );
}

export function PdfTotalsBlock({ rows }: { rows: { label: string; value: string; bold?: boolean }[] }) {
  return (
    <View style={styles.totalsBlock}>
      {rows.map((row, i) => (
        <View key={i} style={styles.totalsRow}>
          <Text style={[styles.totalsLabel, row.bold ? styles.totalsBold : {}]}>{row.label}</Text>
          <Text style={[styles.totalsValue, row.bold ? styles.totalsBold : {}]}>{row.value}</Text>
        </View>
      ))}
    </View>
  );
}

export function PdfNotes({ title, text }: { title: string; text: string | null | undefined }) {
  if (!text) return null;
  return (
    <View style={styles.notesSection}>
      <Text style={styles.notesTitle}>{title}</Text>
      <Text style={styles.notesText}>{text}</Text>
    </View>
  );
}

export function PdfFooter() {
  return (
    <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
  );
}

export { Page, Document, View, Text };
