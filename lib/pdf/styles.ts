// Shared PDF stylesheet for A4 documents
import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: { padding: "40pt 40pt 50pt 40pt", fontSize: 10, fontFamily: "Helvetica" },
  header: { marginBottom: 20 },
  title: { fontSize: 18, fontWeight: "bold", fontFamily: "Helvetica-Bold" },
  subtitle: { fontSize: 11, color: "#555", marginTop: 4 },
  meta: { fontSize: 9, color: "#666", marginTop: 6 },
  sectionHeader: { fontSize: 11, fontWeight: "bold", fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: "#ddd" },
  table: { marginBottom: 12 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f5f5f5", borderBottomWidth: 1, borderBottomColor: "#ccc", paddingVertical: 4, paddingHorizontal: 4 },
  tableRow: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#eee", paddingVertical: 3, paddingHorizontal: 4 },
  cellLeft: { fontSize: 9 },
  cellRight: { fontSize: 9, textAlign: "right" },
  headerCell: { fontSize: 8, fontFamily: "Helvetica-Bold", color: "#333" },
  totalsBlock: { marginTop: 16, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#ccc", alignItems: "flex-end" },
  totalsRow: { flexDirection: "row", justifyContent: "flex-end", marginBottom: 4 },
  totalsLabel: { fontSize: 10, width: 140, textAlign: "right", marginRight: 12 },
  totalsValue: { fontSize: 10, width: 90, textAlign: "right" },
  totalsBold: { fontFamily: "Helvetica-Bold", fontSize: 11 },
  clientBlock: { marginTop: 10, marginBottom: 14, padding: 10, backgroundColor: "#fafafa", borderRadius: 4 },
  clientName: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  clientDetail: { fontSize: 9, color: "#555", marginTop: 2 },
  notesSection: { marginTop: 14 },
  notesTitle: { fontSize: 9, fontFamily: "Helvetica-Bold", color: "#555", marginBottom: 4 },
  notesText: { fontSize: 9, color: "#333", lineHeight: 1.4 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, textAlign: "center", fontSize: 8, color: "#999" },
});
