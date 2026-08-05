// Quotation wire shapes and DB row types

export type QuotationStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export interface QuotationLine {
  id: string;
  label: string;
  description: string | null;
  quantity: string;
  unit: string | null;
  unitRate: string;
  amount: string;
}

export interface QuotationSection {
  group: string | null;
  lines: QuotationLine[];
  sectionSubtotal: string;
}

export interface Quotation {
  id: string;
  projectId: string;
  boqId: string | null;
  quotationNumber: string;
  name: string;
  clientName: string | null;
  clientEmail: string | null;
  clientPhone: string | null;
  currency: string;
  status: QuotationStatus;
  validUntil: string | null;
  materialsSubtotal: string;
  markupPercentage: string;
  markupAmount: string;
  discountPercentage: string;
  discountAmount: string;
  taxPercentage: string;
  taxAmount: string;
  grandTotal: string;
  notes: string | null;
  terms: string | null;
  sections: QuotationSection[];
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
}

// DB row types (snake_case)
export interface QuotationRow {
  id: string;
  project_id: string;
  boq_id: string | null;
  user_id: string;
  quotation_number: string;
  name: string;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  currency: string;
  status: string;
  valid_until: string | null;
  materials_subtotal: string;
  markup_percentage: string;
  markup_amount: string;
  discount_percentage: string;
  discount_amount: string;
  tax_percentage: string;
  tax_amount: string;
  grand_total: string;
  notes: string | null;
  terms: string | null;
  created_at: string;
  updated_at: string;
  sent_at: string | null;
}

export interface QuotationSectionRow {
  id: string;
  quotation_id: string;
  group_name: string | null;
  section_order: number;
  section_subtotal: string;
  created_at: string;
}

export interface QuotationLineRow {
  id: string;
  quotation_id: string;
  section_id: string;
  label: string;
  description: string | null;
  quantity: string;
  unit: string | null;
  unit_rate: string;
  amount: string;
  line_order: number;
  created_at: string;
}
