import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileCode,
  Download,
  Copy,
  Check,
  HardDriveDownload,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { SupplierInvoiceRecord, AuditedMISRecord, FlattenedSupplierRow } from '../types';

interface ExportTabProps {
  invoices: SupplierInvoiceRecord[];
  auditedSummary: AuditedMISRecord[];
  rawInvoices: FlattenedSupplierRow[];
  theme: 'light' | 'dark';
}

export const ExportTab: React.FC<ExportTabProps> = ({
  invoices,
  auditedSummary,
  rawInvoices,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState<boolean>(false);

  // 1. Export Cleaned CSV
  const handleExportCsv = () => {
    if (auditedSummary.length === 0) return;

    const headers = [
      'invoice_number',
      'po_number',
      'vendor_name',
      'invoice_date',
      'due_date',
      'currency',
      'subtotal',
      'tax_amount',
      'total_amount_due',
      'audit_status',
      'leakage_amount',
    ];

    const csvRows = [headers.join(',')];
    auditedSummary.forEach((r) => {
      const values = [
        `"${r.invoice_number}"`,
        `"${r.po_number}"`,
        `"${r.vendor_name}"`,
        `"${r.invoice_date}"`,
        `"${r.due_date}"`,
        `"${r.currency}"`,
        r.subtotal,
        r.tax_amount,
        r.total_amount_due,
        `"${r.audit_status}"`,
        r.leakage_amount,
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Audited_Supplier_MIS_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export Multi-Sheet Excel (.xlsx)
  const handleExportExcel = () => {
    if (auditedSummary.length === 0) return;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Audited MIS Summary View
    const misSheet = XLSX.utils.json_to_sheet(auditedSummary);
    XLSX.utils.book_append_sheet(workbook, misSheet, 'Audited_MIS_Summary');

    // Sheet 2: Raw Line Items Table
    const rawSheet = XLSX.utils.json_to_sheet(rawInvoices);
    XLSX.utils.book_append_sheet(workbook, rawSheet, 'Raw_Invoices_DuckDB');

    // Sheet 3: Overcharges Only
    const overcharges = rawInvoices.filter((r) => r.line_item_total - r.quantity * r.unit_price > 0.02);
    if (overcharges.length > 0) {
      const overchargeSheet = XLSX.utils.json_to_sheet(overcharges);
      XLSX.utils.book_append_sheet(workbook, overchargeSheet, 'Overcharge_Audit');
    }

    XLSX.writeFile(
      workbook,
      `Audited_Supplier_Reconciliation_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // 3. Export ERP JSON
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(invoices, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ERP_Audited_Invoices_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(invoices, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* CSV */}
        <div
          className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="space-y-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isDark ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-blue-50 border-blue-200 text-blue-600'
              }`}
            >
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Audited MIS CSV</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Flattened CSV with reconciliation status (VERIFIED, OVERCHARGED, DUPLICATE, MISSING PO).
              </p>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={handleExportCsv}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-blue-500"
            >
              <Download className="h-4 w-4" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Excel */}
        <div
          className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="space-y-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
              }`}
            >
              <HardDriveDownload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">Multi-Sheet Excel (.xlsx)</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Formatted workbook containing <strong>Audited_MIS_Summary</strong>, <strong>Raw_Invoices_DuckDB</strong>, and <strong>Overcharge_Audit</strong> sheets.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={handleExportExcel}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-md hover:bg-emerald-500"
            >
              <Download className="h-4 w-4" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* ERP JSON */}
        <div
          className={`rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="space-y-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'
              }`}
            >
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold">ERP-Ready JSON Schema</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Hierarchical JSON payload ready for SAP, NetSuite, Oracle, and data warehouse ingestion.
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={handleExportJson}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 px-3 text-xs font-bold text-white shadow-md hover:bg-purple-500"
            >
              <Download className="h-4 w-4" />
              <span>Download JSON</span>
            </button>
            <button
              onClick={handleCopyJson}
              className={`flex items-center justify-center rounded-xl border px-3 py-2.5 text-xs ${
                isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
              title="Copy JSON"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* JSON Preview */}
      <div
        className={`rounded-2xl border p-5 shadow-sm space-y-3 transition-all ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold">ERP JSON Payload Preview</h3>
          <button
            onClick={handleCopyJson}
            className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-medium ${
              isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'
            }`}
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        <pre
          className={`max-h-64 overflow-auto rounded-xl p-4 font-mono text-xs border ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}
        >
          {JSON.stringify(invoices, null, 2)}
        </pre>
      </div>
    </div>
  );
};
