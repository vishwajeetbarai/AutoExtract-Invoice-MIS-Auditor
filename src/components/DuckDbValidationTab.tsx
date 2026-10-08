import React, { useState } from 'react';
import {
  Database,
  AlertOctagon,
  CopyCheck,
  FileQuestion,
  Play,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Terminal,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  DuckDBValidationResults,
  FlattenedRow,
  CalcMismatchViolation,
  DuplicateViolation,
  NullCheckViolation,
} from '../types';
import { executeInteractiveSql } from '../utils/duckdbEngine';

interface DuckDbValidationTabProps {
  validationResults: DuckDBValidationResults;
  rawInvoices: FlattenedRow[];
}

export const DuckDbValidationTab: React.FC<DuckDbValidationTabProps> = ({
  validationResults,
  rawInvoices,
}) => {
  const { calc_total_mismatch, duplicate_check, null_check, cleaned_mis_summary } = validationResults;

  // SQL Sandbox State
  const defaultQuery = `SELECT vendor_name, COUNT(*) as invoice_count, ROUND(SUM(total_amount_due), 2) as total_spend 
FROM cleaned_mis_summary 
GROUP BY vendor_name 
ORDER BY total_spend DESC;`;

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
    const res = executeInteractiveSql(q, rawInvoices, cleaned_mis_summary, {
      mismatches: calc_total_mismatch,
      duplicates: duplicate_check,
      nulls: null_check,
    });

    setQueryOutput(res);
  };

  const sqlPresets = [
    {
      label: 'Vendor Spend Breakdown',
      sql: `SELECT vendor_name, COUNT(*) as invoice_count, ROUND(SUM(total_amount_due), 2) as total_spend \nFROM cleaned_mis_summary \nGROUP BY vendor_name \nORDER BY total_spend DESC;`,
    },
    {
      label: 'Filter Discrepancies Only',
      sql: `SELECT invoice_number, vendor_name, total_amount_due, audit_status \nFROM cleaned_mis_summary \nWHERE audit_status != 'Verified Clean';`,
    },
    {
      label: 'Inspect Math Mismatches',
      sql: `SELECT invoice_number, vendor_name, item_description, quantity, unit_price, line_item_total, variance \nFROM calc_total_mismatch;`,
    },
    {
      label: 'Inspect Incomplete Documents',
      sql: `SELECT invoice_number, vendor_name, invoice_date, total_amount_due, reason \nFROM null_check;`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">DuckDB In-Memory SQL & Data Hygiene Engine</h2>
              <p className="text-xs text-slate-400">
                Executes analytical integrity queries across math consistency, duplicate detection, and missing metadata.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-slate-800/80 px-3 py-1.5 font-mono text-xs text-slate-300 border border-slate-700">
              Table: <code className="text-amber-400">raw_invoices</code> ({rawInvoices.length} line items)
            </span>
            <span className="rounded-lg bg-slate-800/80 px-3 py-1.5 font-mono text-xs text-slate-300 border border-slate-700">
              View: <code className="text-indigo-400">cleaned_mis_summary</code>
            </span>
          </div>
        </div>
      </div>

      {/* 3 Core Validation Rule Cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Rule 1: Calculation Mismatch */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                  <AlertOctagon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white">1. calc_total_mismatch</h3>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  calc_total_mismatch.length > 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {calc_total_mismatch.length > 0 ? `${calc_total_mismatch.length} Flagged` : '0 Clean'}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Flags line items where quantity * unit_price != stated line total:
            </p>

            <pre className="rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-amber-300/90 border border-slate-800 overflow-x-auto">
              ABS(line_total - (qty * unit_price)) &gt; 0.02
            </pre>

            {calc_total_mismatch.length > 0 ? (
              <div className="space-y-2 mt-2">
                {calc_total_mismatch.map((m, idx) => (
                  <div key={idx} className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{m.invoice_number}</span>
                      <span className="text-rose-400">Variance: ${m.variance.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">{m.item_description}</div>
                    <div className="text-[11px] font-mono text-slate-400">
                      Billed: ${m.line_item_total.toFixed(2)} vs Expected: ${m.expected_line_total.toFixed(2)} ({m.quantity} × ${m.unit_price})
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>Zero arithmetic calculation errors identified.</span>
              </div>
            )}
          </div>
        </div>

        {/* Rule 2: Duplicate Check */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                  <CopyCheck className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white">2. duplicate_check</h3>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  duplicate_check.length > 0
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {duplicate_check.length > 0 ? `${duplicate_check.length} Duplicates` : '0 Clean'}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Flags double-billing risks on identical invoice_number + vendor_name pairs:
            </p>

            <pre className="rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-amber-300/90 border border-slate-800 overflow-x-auto">
              GROUP BY invoice_number, vendor_name HAVING COUNT(*) &gt; 1
            </pre>

            {duplicate_check.length > 0 ? (
              <div className="space-y-2 mt-2">
                {duplicate_check.map((d, idx) => (
                  <div key={idx} className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{d.invoice_number}</span>
                      <span className="text-amber-400">{d.occurrence_count} Occurrences</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">Vendor: {d.vendor_name}</div>
                    <div className="text-[11px] text-slate-400">Double-payment compliance hazard detected.</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>Zero duplicate vendor invoices present.</span>
              </div>
            )}
          </div>
        </div>

        {/* Rule 3: Null Check */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                  <FileQuestion className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-bold text-white">3. null_check</h3>
              </div>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${
                  null_check.length > 0
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {null_check.length > 0 ? `${null_check.length} Incomplete` : '0 Clean'}
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Flags missing essential accounting fields:
            </p>

            <pre className="rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-amber-300/90 border border-slate-800 overflow-x-auto">
              invoice_date IS NULL OR total_amount_due &lt;= 0
            </pre>

            {null_check.length > 0 ? (
              <div className="space-y-2 mt-2">
                {null_check.map((n, idx) => (
                  <div key={idx} className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-2.5 text-xs space-y-1">
                    <div className="flex justify-between font-bold text-white">
                      <span>{n.invoice_number}</span>
                      <span className="text-rose-400 font-semibold">{n.reason}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 truncate">Vendor: {n.vendor_name}</div>
                    <div className="text-[11px] text-slate-400">Missing critical attributes for ledger posting.</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-950/20 border border-emerald-500/30 p-3 text-xs text-emerald-300">
                <CheckCircle2 className="h-4 w-4" />
                <span>All documents contain mandatory metadata.</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Interactive DuckDB SQL Sandbox Console */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">DuckDB In-Memory SQL Sandbox</h3>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {sqlPresets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setQueryInput(preset.sql);
                  handleRunQuery(preset.sql);
                }}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300 hover:border-indigo-500 hover:text-white transition-all"
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
            rows={4}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 p-3.5 font-mono text-xs text-emerald-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner"
            placeholder="Type SQL query (e.g. SELECT * FROM cleaned_mis_summary...)"
          />
          <button
            onClick={() => handleRunQuery()}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-indigo-500 transition-all"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>Run SQL</span>
          </button>
        </div>

        {/* Query Output Table */}
        {queryOutput.error && (
          <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-3 text-xs text-rose-300">
            {queryOutput.error}
          </div>
        )}

        {queryOutput.data && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>
                Returned <strong className="text-white">{queryOutput.data.length}</strong> rows
              </span>
              <span className="font-mono text-emerald-400">
                Executed in {queryOutput.executionTimeMs} ms
              </span>
            </div>

            <div className="max-h-60 overflow-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left font-mono text-[11px] text-slate-300">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 sticky top-0">
                  <tr>
                    {(queryOutput.columns || Object.keys(queryOutput.data[0] || {})).map((col) => (
                      <th key={col} className="p-2.5 font-semibold">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900">
                  {queryOutput.data.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-900/50">
                      {(queryOutput.columns || Object.keys(row)).map((col) => (
                        <td key={col} className="p-2.5">
                          {typeof row[col] === 'number'
                            ? row[col].toLocaleString('en-US')
                            : String(row[col] ?? 'NULL')}
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
