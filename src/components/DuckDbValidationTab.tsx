import React, { useState } from 'react';
import {
  Database,
  AlertOctagon,
  CopyCheck,
  FileQuestion,
  Calculator,
  Play,
  CheckCircle2,
  Terminal,
} from 'lucide-react';
import {
  FourWayAuditResults,
  FlattenedSupplierRow,
} from '../types';
import { executeInteractiveSql } from '../utils/duckdbEngine';

interface DuckDbValidationTabProps {
  auditResults: FourWayAuditResults;
  rawInvoices: FlattenedSupplierRow[];
  theme: 'light' | 'dark';
}

export const DuckDbValidationTab: React.FC<DuckDbValidationTabProps> = ({
  auditResults,
  rawInvoices,
  theme,
}) => {
  const isDark = theme === 'dark';
  const { overcharge_check, duplicate_check, tax_validation_check, missing_po_check, audited_mis_summary } = auditResults;

  const defaultQuery = `SELECT vendor_name, COUNT(*) as invoice_count, ROUND(SUM(total_amount_due), 2) as total_billed, ROUND(SUM(leakage_amount), 2) as leakage \nFROM audited_mis_summary \nGROUP BY vendor_name \nORDER BY total_billed DESC;`;

  const [queryInput, setQueryInput] = useState<string>(defaultQuery);
  const [queryOutput, setQueryOutput] = useState<{
    data?: any[];
    columns?: string[];
    error?: string;
    executionTimeMs: number;
  }>({
    data: undefined,
    columns: undefined,
    error: undefined,
    executionTimeMs: 0,
  });

  const handleRunQuery = (sqlToRun?: string) => {
    const q = sqlToRun || queryInput;
    const res = executeInteractiveSql(q, rawInvoices, audited_mis_summary);
    setQueryOutput(res);
  };

  const sqlPresets = [
    {
      label: 'Vendor Billed vs Leakage',
      sql: `SELECT vendor_name, COUNT(*) as invoice_count, ROUND(SUM(total_amount_due), 2) as total_billed, ROUND(SUM(leakage_amount), 2) as leakage \nFROM audited_mis_summary \nGROUP BY vendor_name \nORDER BY total_billed DESC;`,
    },
    {
      label: 'Overcharged Invoices',
      sql: `SELECT invoice_number, vendor_name, item_description, quantity, unit_price, line_item_total, overcharge_amount \nFROM invoices \nWHERE line_item_total - (quantity * unit_price) > 0.02;`,
    },
    {
      label: 'Rogue Spend (Missing PO)',
      sql: `SELECT invoice_number, vendor_name, total_amount_due, audit_status \nFROM audited_mis_summary \nWHERE audit_status = 'MISSING PO';`,
    },
    {
      label: 'Tax Calculation Discrepancies',
      sql: `SELECT invoice_number, vendor_name, subtotal, tax_rate, tax_amount \nFROM invoices \nWHERE ABS(tax_amount - (subtotal * (tax_rate / 100))) > 0.5;`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div
        className={`rounded-2xl border p-5 shadow-sm transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-white'
            : 'bg-white border-slate-200/90 text-slate-900'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isDark ? 'bg-amber-500/20 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
              }`}
            >
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">DuckDB 4 Automated Financial Audit Checks</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                In-memory SQL transformations to eliminate financial leakage across overcharges, duplicates, tax math, and unapproved POs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-lg px-2.5 py-1 font-mono text-xs border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              Table: <code className="text-amber-600 dark:text-amber-400 font-bold">invoices</code>
            </span>
            <span
              className={`rounded-lg px-2.5 py-1 font-mono text-xs border ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
            >
              View: <code className="text-indigo-600 dark:text-indigo-400 font-bold">audited_mis_summary</code>
            </span>
          </div>
        </div>
      </div>

      {/* 4 AUDIT CHECK CARDS */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
        {/* Check 1: Overcharge */}
        <div
          className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    overcharge_check.length > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <AlertOctagon className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider">1. Overcharge Check</h3>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  overcharge_check.length > 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {overcharge_check.length > 0 ? `${overcharge_check.length} Overcharged` : '0 Clean'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Flags <code className="font-mono text-xs text-rose-600 dark:text-rose-400">qty * unit_price != line_total</code>
            </p>

            {overcharge_check.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                {overcharge_check.map((o, i) => (
                  <div key={i} className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 p-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>{o.invoice_number}</span>
                      <span className="text-rose-600 dark:text-rose-400">+${o.overcharge_amount.toFixed(2)} Leak</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{o.vendor_name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium pt-2">
                <CheckCircle2 className="h-4 w-4" /> Zero math overcharges
              </div>
            )}
          </div>
        </div>

        {/* Check 2: Duplicate Bill */}
        <div
          className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    duplicate_check.length > 0 ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <CopyCheck className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider">2. Duplicate Bill</h3>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  duplicate_check.length > 0
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {duplicate_check.length > 0 ? `${duplicate_check.length} Duplicates` : '0 Clean'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Flags identical <code className="font-mono text-xs text-amber-600 dark:text-amber-400">vendor + invoice #</code>
            </p>

            {duplicate_check.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                {duplicate_check.map((d, i) => (
                  <div key={i} className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/60 dark:bg-amber-950/20 p-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>{d.invoice_number}</span>
                      <span className="text-amber-600 dark:text-amber-400">{d.occurrence_count} Bills</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{d.vendor_name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium pt-2">
                <CheckCircle2 className="h-4 w-4" /> Zero duplicate submissions
              </div>
            )}
          </div>
        </div>

        {/* Check 3: Tax Calculation */}
        <div
          className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    tax_validation_check.length > 0 ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <Calculator className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider">3. Tax Calculation</h3>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  tax_validation_check.length > 0
                    ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {tax_validation_check.length > 0 ? `${tax_validation_check.length} Tax Errors` : '0 Clean'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Validates <code className="font-mono text-xs text-purple-600 dark:text-purple-400">subtotal * tax_rate == tax</code>
            </p>

            {tax_validation_check.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                {tax_validation_check.map((t, i) => (
                  <div key={i} className="rounded-xl border border-purple-200 dark:border-purple-900/40 bg-purple-50/60 dark:bg-purple-950/20 p-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>{t.invoice_number}</span>
                      <span className="text-purple-600 dark:text-purple-400">+${t.tax_variance.toFixed(2)} Error</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{t.vendor_name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium pt-2">
                <CheckCircle2 className="h-4 w-4" /> All tax rates verified
              </div>
            )}
          </div>
        </div>

        {/* Check 4: Missing PO Number */}
        <div
          className={`rounded-2xl border p-4 shadow-sm flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                    missing_po_check.length > 0 ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400' : 'bg-emerald-50 text-emerald-600'
                  }`}
                >
                  <FileQuestion className="h-4 w-4" />
                </div>
                <h3 className="text-xs font-bold uppercase tracking-wider">4. Missing PO Flag</h3>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                  missing_po_check.length > 0
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                }`}
              >
                {missing_po_check.length > 0 ? `${missing_po_check.length} Rogue PO` : '0 Clean'}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Flags <code className="font-mono text-xs text-rose-600 dark:text-rose-400">po_number IS NULL OR BLANK</code>
            </p>

            {missing_po_check.length > 0 ? (
              <div className="space-y-1.5 mt-2">
                {missing_po_check.map((m, i) => (
                  <div key={i} className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 p-2 text-xs">
                    <div className="flex justify-between font-bold">
                      <span>{m.invoice_number}</span>
                      <span className="text-rose-600 dark:text-rose-400">No PO</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{m.vendor_name}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium pt-2">
                <CheckCircle2 className="h-4 w-4" /> All linked to approved POs
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SQL Sandbox */}
      <div
        className={`rounded-2xl border p-5 shadow-sm space-y-4 transition-all ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-base font-bold">DuckDB SQL Reconciliation Sandbox</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sqlPresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQueryInput(preset.sql);
                  handleRunQuery(preset.sql);
                }}
                className={`rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 text-slate-300 hover:text-white'
                    : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <textarea
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            rows={3}
            className={`w-full rounded-xl border p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
              isDark
                ? 'border-slate-800 bg-slate-950 text-emerald-400'
                : 'border-slate-300 bg-slate-900 text-emerald-400 shadow-inner'
            }`}
            placeholder="Type custom SQL..."
          />
          <button
            onClick={() => handleRunQuery()}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Execute SQL</span>
          </button>
        </div>

        {queryOutput.data && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Returned <strong>{queryOutput.data.length}</strong> rows</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">Execution: {queryOutput.executionTimeMs} ms</span>
            </div>
            <div
              className={`max-h-56 overflow-auto rounded-xl border ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <table className="w-full text-left font-mono text-xs">
                <thead className={isDark ? 'bg-slate-900 text-slate-400' : 'bg-slate-200/80 text-slate-700'}>
                  <tr>
                    {(queryOutput.columns || Object.keys(queryOutput.data[0] || {})).map((col) => (
                      <th key={col} className="p-2.5 font-bold">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-900 text-slate-300' : 'divide-slate-200 text-slate-800'}`}>
                  {queryOutput.data.map((row, rIdx) => (
                    <tr key={rIdx} className={isDark ? 'hover:bg-slate-900/50' : 'hover:bg-white'}>
                      {(queryOutput.columns || Object.keys(row)).map((col) => (
                        <td key={col} className="p-2.5">
                          {typeof row[col] === 'number' ? row[col].toLocaleString() : String(row[col] ?? 'NULL')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
