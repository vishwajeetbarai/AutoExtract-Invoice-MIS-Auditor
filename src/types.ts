export interface LineItem {
  item_description: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
}

export interface SupplierInvoiceRecord {
  id: string;
  invoice_number: string;
  po_number: string | null;
  vendor_name: string;
  invoice_date: string | null;
  due_date: string | null;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  total_amount_due: number;
  line_items: LineItem[];
  source_file?: string;
  source_type?: 'pdf' | 'csv' | 'manual' | 'sample';
}

export interface FlattenedSupplierRow {
  invoice_id: string;
  invoice_number: string;
  po_number: string | null;
  vendor_name: string;
  invoice_date: string | null;
  due_date: string | null;
  currency: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  item_description: string;
  quantity: number;
  unit_price: number;
  line_item_total: number;
  total_amount_due: number;
}

// 1. Overcharge Violation Check
export interface OverchargeViolation {
  invoice_number: string;
  vendor_name: string;
  item_description: string;
  quantity: number;
  unit_price: number;
  line_item_total: number;
  expected_line_total: number;
  overcharge_amount: number;
}

// 2. Duplicate Invoice Violation Check
export interface DuplicateViolation {
  invoice_number: string;
  vendor_name: string;
  occurrence_count: number;
  potential_double_pay_amount: number;
  duplicate_ids: string[];
}

// 3. Tax Calculation Violation Check
export interface TaxCalculationViolation {
  invoice_number: string;
  vendor_name: string;
  subtotal: number;
  tax_rate: number;
  tax_amount: number;
  expected_tax: number;
  tax_variance: number;
}

// 4. Missing PO Number Violation Check
export interface MissingPOViolation {
  invoice_number: string;
  vendor_name: string;
  invoice_date: string | null;
  total_amount_due: number;
  risk_reason: string;
}

export interface AuditedMISRecord {
  invoice_number: string;
  vendor_name: string;
  po_number: string;
  invoice_date: string;
  due_date: string;
  currency: string;
  item_count: number;
  subtotal: number;
  tax_amount: number;
  total_amount_due: number;
  audit_status: 'VERIFIED' | 'OVERCHARGED' | 'DUPLICATE' | 'MISSING PO';
  leakage_amount: number;
  discrepancy_details: string;
}

export interface FourWayAuditResults {
  overcharge_check: OverchargeViolation[];
  duplicate_check: DuplicateViolation[];
  tax_validation_check: TaxCalculationViolation[];
  missing_po_check: MissingPOViolation[];
  audited_mis_summary: AuditedMISRecord[];
  total_billed: number;
  total_leakage: number;
  audit_pass_rate: number;
  top_overcharging_vendor: string;
  unique_invoices_count: number;
}
