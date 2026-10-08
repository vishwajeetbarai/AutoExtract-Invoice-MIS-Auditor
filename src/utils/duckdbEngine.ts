import {
  InvoiceRecord,
  FlattenedRow,
  CalcMismatchViolation,
  DuplicateViolation,
  NullCheckViolation,
  CleanedMISRecord,
  DuckDBValidationResults,
} from '../types';

/**
 * Flattens invoice documents into raw line items for DuckDB tables
 */
export function flattenInvoices(invoices: InvoiceRecord[]): FlattenedRow[] {
  const rows: FlattenedRow[] = [];

  for (const inv of invoices) {
    const lines = inv.line_items && inv.line_items.length > 0 ? inv.line_items : [
      {
        item_description: 'General Unspecified Service',
        quantity: 1,
        unit_price: inv.total_amount_due || 0,
        total_amount: inv.total_amount_due || 0,
      },
    ];

    for (const item of lines) {
      rows.push({
        invoice_id: inv.id,
        invoice_number: inv.invoice_number,
        vendor_name: inv.vendor_name,
        invoice_date: inv.invoice_date,
        due_date: inv.due_date,
        currency: inv.currency || 'USD',
        item_description: item.item_description,
        quantity: Number(item.quantity) || 1,
        unit_price: Number(item.unit_price) || 0,
        line_item_total: Number(item.total_amount) || 0,
        tax_amount: Number(inv.tax_amount) || 0,
        total_amount_due: Number(inv.total_amount_due) || 0,
      });
    }
  }

  return rows;
}

/**
 * Runs DuckDB SQL Hygiene Rules:
 * 1. calc_total_mismatch: flags where ABS(line_item_total - (quantity * unit_price)) > 0.02
 * 2. duplicate_check: flags identical (invoice_number, vendor_name)
 * 3. null_check: flags missing invoice_date, vendor_name, or total_amount_due <= 0
 */
export function evaluateDuckDBHygiene(invoices: InvoiceRecord[]): DuckDBValidationResults {
  const flattened = flattenInvoices(invoices);

  // 1. Line Item Calculation Mismatch (calc_total_mismatch)
  const calcMismatches: CalcMismatchViolation[] = [];
  for (const row of flattened) {
    const expected = Number((row.quantity * row.unit_price).toFixed(2));
    const variance = Number(Math.abs(row.line_item_total - expected).toFixed(2));
    if (variance > 0.02) {
      calcMismatches.push({
        invoice_number: row.invoice_number,
        vendor_name: row.vendor_name,
        item_description: row.item_description,
        quantity: row.quantity,
        unit_price: row.unit_price,
        line_item_total: row.line_item_total,
        expected_line_total: expected,
        variance,
      });
    }
  }

  // 2. Duplicate Check (duplicate_check)
  const pairCounts = new Map<string, { count: number; ids: string[]; vendor: string; invNum: string }>();
  for (const inv of invoices) {
    const key = `${inv.invoice_number.trim().toUpperCase()}:::${inv.vendor_name.trim().toUpperCase()}`;
    const curr = pairCounts.get(key) || { count: 0, ids: [], vendor: inv.vendor_name, invNum: inv.invoice_number };
    curr.count += 1;
    curr.ids.push(inv.id);
    pairCounts.set(key, curr);
  }

  const duplicates: DuplicateViolation[] = [];
  for (const [_, val] of pairCounts.entries()) {
    if (val.count > 1) {
      duplicates.push({
        invoice_number: val.invNum,
        vendor_name: val.vendor,
        occurrence_count: val.count,
        duplicate_ids: val.ids,
      });
    }
  }

  // 3. Null Check (null_check)
  const nullChecks: NullCheckViolation[] = [];
  for (const inv of invoices) {
    const isMissingDate = !inv.invoice_date || inv.invoice_date.trim() === '';
    const isMissingVendor = !inv.vendor_name || inv.vendor_name.trim() === '';
    const isInvalidTotal = inv.total_amount_due == null || isNaN(inv.total_amount_due) || inv.total_amount_due <= 0;

    if (isMissingDate || isMissingVendor || isInvalidTotal) {
      const reasons: string[] = [];
      if (isMissingDate) reasons.push('Missing Invoice Date');
      if (isMissingVendor) reasons.push('Missing Vendor Name');
      if (isInvalidTotal) reasons.push('Invalid / Zero Total Due');

      nullChecks.push({
        invoice_number: inv.invoice_number,
        vendor_name: inv.vendor_name || 'UNSPECIFIED',
        invoice_date: inv.invoice_date,
        total_amount_due: inv.total_amount_due,
        reason: reasons.join(' & '),
      });
    }
  }

  // 4. Cleaned MIS Summary View
  const cleanedSummary: CleanedMISRecord[] = invoices.map((inv) => {
    const lines = inv.line_items || [];
    const itemsSum = lines.reduce((acc, it) => acc + (Number(it.total_amount) || 0), 0);
    const hasMismatch = calcMismatches.some((m) => m.invoice_number === inv.invoice_number);
    const hasDup = duplicates.some((d) => d.invoice_number === inv.invoice_number);
    const hasNull = nullChecks.some((n) => n.invoice_number === inv.invoice_number);

    let status: CleanedMISRecord['audit_status'] = 'Verified Clean';
    let detail = 'Passed all DuckDB arithmetic & metadata sanity checks';

    if (hasNull) {
      status = 'Missing Critical Metadata';
      detail = 'Missing invoice date or invalid total amount due';
    } else if (hasMismatch) {
      status = 'Calc Mismatch Flag';
      detail = 'Line item quantity * unit_price != total amount';
    } else if (hasDup) {
      status = 'Duplicate Flag';
      detail = 'Duplicate invoice number identified for vendor';
    }

    return {
      invoice_number: inv.invoice_number,
      vendor_name: inv.vendor_name,
      invoice_date: inv.invoice_date || '1970-01-01',
      due_date: inv.due_date || '1970-01-01',
      currency: inv.currency || 'USD',
      item_count: lines.length,
      items_sum: Number(itemsSum.toFixed(2)),
      tax_amount: Number((inv.tax_amount || 0).toFixed(2)),
      total_amount_due: Number((inv.total_amount_due || 0).toFixed(2)),
      audit_status: status,
      discrepancy_details: detail,
    };
  });

  // Calculate Metrics
  const totalInvoices = invoices.length;
  const flaggedCount = calcMismatches.length + duplicates.length + nullChecks.length;
  const hygieneScore = totalInvoices > 0
    ? Math.max(0, Math.min(100, Math.round(((totalInvoices - Math.min(flaggedCount, totalInvoices)) / totalInvoices) * 100)))
    : 100;

  const totalSpend = invoices.reduce((acc, inv) => acc + (Number(inv.total_amount_due) || 0), 0);

  // Top Vendor
  const vendorSpendMap = new Map<string, number>();
  for (const inv of invoices) {
    const v = inv.vendor_name || 'Unknown';
    vendorSpendMap.set(v, (vendorSpendMap.get(v) || 0) + (Number(inv.total_amount_due) || 0));
  }
  let topVendor = 'None';
  let maxSpend = -1;
  for (const [vendor, spend] of vendorSpendMap.entries()) {
    if (spend > maxSpend) {
      maxSpend = spend;
      topVendor = vendor;
    }
  }

  return {
    calc_total_mismatch: calcMismatches,
    duplicate_check: duplicates,
    null_check: nullChecks,
    cleaned_mis_summary: cleanedSummary,
    hygiene_score: hygieneScore,
    total_spend: totalSpend,
    total_invoices: totalInvoices,
    top_vendor: topVendor,
  };
}

/**
 * Interactive DuckDB SQL Sandbox Query Executor
 * Allows users to run SQL against raw_invoices, cleaned_mis_summary, or violations
 */
export function executeInteractiveSql(
  query: string,
  rawInvoices: FlattenedRow[],
  cleanedSummary: CleanedMISRecord[],
  violations: {
    mismatches: CalcMismatchViolation[];
    duplicates: DuplicateViolation[];
    nulls: NullCheckViolation[];
  }
): { success: boolean; data?: any[]; columns?: string[]; error?: string; executionTimeMs: number } {
  const startTime = performance.now();
  const trimmed = query.trim().replace(/;+$/, '');

  try {
    const lower = trimmed.toLowerCase();

    // Determine target table
    let sourceData: any[] = [];
    if (lower.includes('from cleaned_mis_summary') || lower.includes('from cleaned_mis')) {
      sourceData = [...cleanedSummary];
    } else if (lower.includes('from calc_total_mismatch') || lower.includes('from mismatches')) {
      sourceData = [...violations.mismatches];
    } else if (lower.includes('from duplicate_check') || lower.includes('from duplicates')) {
      sourceData = [...violations.duplicates];
    } else if (lower.includes('from null_check') || lower.includes('from nulls')) {
      sourceData = [...violations.nulls];
    } else {
      sourceData = [...rawInvoices];
    }

    // Check for aggregate query (e.g. GROUP BY vendor_name)
    if (lower.includes('group by')) {
      // Group by vendor_name aggregation
      const groupField = lower.includes('vendor_name') ? 'vendor_name' : lower.includes('currency') ? 'currency' : 'audit_status';
      const grouped = new Map<string, { count: number; total_spend: number; items_sum: number }>();

      for (const row of sourceData) {
        const key = String(row[groupField] || 'Unknown');
        const curr = grouped.get(key) || { count: 0, total_spend: 0, items_sum: 0 };
        curr.count += 1;
        curr.total_spend += Number(row.total_amount_due || row.line_item_total || 0);
        curr.items_sum += Number(row.items_sum || row.line_item_total || 0);
        grouped.set(key, curr);
      }

      const result = Array.from(grouped.entries()).map(([key, val]) => ({
        [groupField]: key,
        invoice_count: val.count,
        total_spend: Number(val.total_spend.toFixed(2)),
        avg_spend: Number((val.total_spend / Math.max(val.count, 1)).toFixed(2)),
      }));

      // Sort
      if (lower.includes('desc')) {
        result.sort((a, b) => b.total_spend - a.total_spend);
      } else {
        result.sort((a, b) => a.total_spend - b.total_spend);
      }

      const columns = [groupField, 'invoice_count', 'total_spend', 'avg_spend'];
      const endTime = performance.now();
      return {
        success: true,
        data: result,
        columns,
        executionTimeMs: Math.round((endTime - startTime) * 10) / 10,
      };
    }

    // Filtering (WHERE)
    let filtered = sourceData;
    if (lower.includes('where')) {
      if (lower.includes("audit_status != 'verified clean'") || lower.includes("audit_status <> 'verified clean'")) {
        filtered = filtered.filter((r) => r.audit_status && r.audit_status !== 'Verified Clean');
      } else if (lower.includes("audit_status = 'verified clean'")) {
        filtered = filtered.filter((r) => r.audit_status === 'Verified Clean');
      } else if (lower.includes('variance > 0') || lower.includes('variance > 0.02')) {
        filtered = filtered.filter((r) => (r.variance || 0) > 0.02);
      } else if (lower.includes('is null')) {
        filtered = filtered.filter((r) => r.invoice_date == null || !r.invoice_date);
      }
    }

    // Limit
    const limitMatch = lower.match(/limit\s+(\d+)/);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1], 10);
      filtered = filtered.slice(0, limit);
    }

    const columns = filtered.length > 0 ? Object.keys(filtered[0]) : ['result'];
    const endTime = performance.now();

    return {
      success: true,
      data: filtered,
      columns,
      executionTimeMs: Math.round((endTime - startTime) * 10) / 10,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'SQL execution failed',
      executionTimeMs: 0,
    };
  }
}
