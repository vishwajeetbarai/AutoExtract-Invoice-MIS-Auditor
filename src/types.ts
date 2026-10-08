export interface LineItem {
  item_description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  vendor_name: string;
  invoice_date: string | null;
  due_date: string | null;
  currency: string;
  line_items: LineItem[];
  tax_amount: number;
  total_amount_due: number;
  source_file?: string;
  source_type?: 'pdf' | 'csv' | 'manual' | 'sample';
}

export interface FlattenedRow {
  invoice_id: string;
  invoice_number: string;
  vendor_name: string;
  invoice_date: string | null;
  due_date: string | null;
  currency: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  line_item_total: number;
  tax_amount: number;
  total_amount_due: number;
}

export interface CalcMismatchViolation {
  invoice_number: string;
  vendor_name: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  line_item_total: number;
  expected_line_total: number;
  variance: number;
}

export interface DuplicateViolation {
  invoice_number: string;
  vendor_name: string;
  occurrence_count: number;
  duplicate_ids: string[];
}

export interface NullCheckViolation {
  invoice_number: string;
  vendor_name: string;
  invoice_date: string | null;
  total_amount_due: number;
  reason: string;
}

export interface CleanedMISRecord {
  invoice_number: string;
  vendor_name: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  item_count: number;
  items_sum: number;
  tax_amount: number;
  total_amount_due: number;
  audit_status: 'Verified Clean' | 'Calc Mismatch Flag' | 'Duplicate Flag' | 'Missing Critical Metadata';
  discrepancy_details?: string;
}

export interface DuckDBValidationResults {
  calc_total_mismatch: CalcMismatchViolation[];
  duplicate_check: DuplicateViolation[];
  null_check: NullCheckViolation[];
  cleaned_mis_summary: CleanedMISRecord[];
  hygiene_score: number;
  total_spend: number;
  total_invoices: number;
  top_vendor: string;
}
