// BOQ wire shapes and DB row types

export interface BoqMaterial {
  id: string;
  type: string;
  brand: string | null;
  quantity: { value: string; unit: string };
  unitPrice: string | null;
  amount: string | null;
  priceUnknown: boolean;
}

export interface BoqLineOverride {
  label?: string;
  amount?: string;
  reason?: string;
}

export interface BoqLine {
  id: string;
  sourceCalculationId: string;
  calculator: string;
  label: string;
  description: string | null;
  materials: BoqMaterial[];
  subtotal: string;
  override: BoqLineOverride | null;
}

export interface BoqSection {
  group: string | null;
  lines: BoqLine[];
  sectionSubtotal: string;
}

export interface Boq {
  id: string;
  projectId: string;
  name: string;
  notes: string | null;
  currency: string;
  generatedAt: string;
  sections: BoqSection[];
  totals: {
    materialsSubtotal: string;
    unknownPriceLineCount: number;
    grandTotal: string;
  };
  createdAt: string;
  updatedAt: string;
}

// DB row types (snake_case)
export interface BoqRow {
  id: string;
  project_id: string;
  user_id: string;
  name: string;
  notes: string | null;
  currency: string;
  generated_at: string;
  ordering_json: unknown | null;
  filters_json: unknown | null;
  created_at: string;
  updated_at: string;
}

export interface BoqSectionRow {
  id: string;
  boq_id: string;
  group_name: string | null;
  section_order: number;
  section_subtotal: string;
  created_at: string;
}

export interface BoqLineRow {
  id: string;
  boq_id: string;
  section_id: string;
  line_key: string;
  source_calculation_id: string;
  calculator: string;
  label: string;
  description: string | null;
  line_subtotal: string;
  override_json: unknown | null;
  line_order: number;
  created_at: string;
}

export interface BoqLineMaterialRow {
  id: string;
  line_id: string;
  material_type: string;
  brand: string | null;
  quantity_value: string;
  quantity_unit: string;
  unit_price: string | null;
  amount: string | null;
  price_unknown: boolean;
  line_order: number;
  created_at: string;
}

export interface BoqTotalsCacheRow {
  boq_id: string;
  materials_subtotal: string;
  unknown_price_count: number;
  grand_total: string;
  updated_at: string;
}
