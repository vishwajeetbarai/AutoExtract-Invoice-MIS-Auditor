import React, { useState } from 'react';
import {
  FileSpreadsheet,
  FileCode,
  Download,
  Copy,
  Check,
  HardDriveDownload,
  Database,
  Layers,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { InvoiceRecord, CleanedMISRecord, FlattenedRow } from '../types';

interface ExportTabProps {
  invoices: InvoiceRecord[];
  cleanedSummary: CleanedMISRecord[];
  rawInvoices: FlattenedRow[];
}

export const ExportTab: React.FC<ExportTabProps> = ({
  invoices,
  cleanedSummary,
  rawInvoices,
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  // 1. Export Cleaned CSV
  const handleExportCsv = () => {
    if (cleanedSummary.length === 0) return;

    const headers = [
      'invoice_number',
      'vendor_name',
      'invoice_date',
      'due_date',
      'currency',
      'item_count',
      'items_sum',
      'tax_amount',
      'total_amount_due',
      'audit_status',
    ];

    const csvRows = [headers.join(',')];

    cleanedSummary.forEach((r) => {
      const values = [
        `"${r.invoice_number}"`,
        `"${r.vendor_name}"`,
        `"${r.invoice_date}"`,
        `"${r.due_date}"`,
        `"${r.currency}"`,
        r.item_count,
        r.items_sum,
        r.tax_amount,
        r.total_amount_due,
        `"${r.audit_status}"`,
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `Cleaned_MIS_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 2. Export Multi-Sheet Excel (.xlsx) using xlsx library
  const handleExportExcel = () => {
    if (cleanedSummary.length === 0) return;

    const workbook = XLSX.utils.book_new();

    // Sheet 1: Cleaned MIS Summary View
    const misSheet = XLSX.utils.json_to_sheet(cleanedSummary);
    XLSX.utils.book_append_sheet(workbook, misSheet, 'Cleaned_MIS_Summary');

    // Sheet 2: Raw Flattened Line Items Table
    const rawSheet = XLSX.utils.json_to_sheet(rawInvoices);
    XLSX.utils.book_append_sheet(workbook, rawSheet, 'Raw_Invoices_DuckDB');

    // Generate buffer & trigger download
    XLSX.writeFile(
      workbook,
      `Executive_MIS_Report_${new Date().toISOString().split('T')[0]}.xlsx`
    );
  };

  // 3. Export JSON Payload
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(invoices, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ERP_Invoice_Payload_${new Date().toISOString().split('T')[0]}.json`);
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
      {/* Exporter Cards Grid */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* CSV Export Card */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20 text-blue-400">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Cleaned MIS CSV</h3>
              <p className="text-xs text-slate-400 mt-1">
                Standard flattened CSV containing validated totals, vendor names, and audit discrepancy tags.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={handleExportCsv}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 px-4 text-xs font-bold text-white shadow-lg transition-all hover:bg-blue-500"
            >
              <Download className="h-4 w-4" />
              <span>Download Cleaned CSV</span>
            </button>
          </div>
        </div>

        {/* Excel Export Card */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
              <HardDriveDownload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Multi-Sheet Excel (.xlsx)</h3>
              <p className="text-xs text-slate-400 mt-1">
                Formatted workbook with dual tabs: <strong>Cleaned_MIS_Summary</strong> and <strong>Raw_Invoices_DuckDB</strong>.
              </p>
            </div>
          </div>

          <div className="mt-5">
            <button
              onClick={handleExportExcel}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 px-4 text-xs font-bold text-white shadow-lg transition-all hover:bg-emerald-500"
            >
              <Download className="h-4 w-4" />
              <span>Download Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* ERP JSON Schema Export Card */}
        <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/20 text-purple-400">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ERP Schema JSON</h3>
              <p className="text-xs text-slate-400 mt-1">
                Strict structured schema format ready for SAP, NetSuite, Oracle, and data lake ingestion pipelines.
              </p>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button
              onClick={handleExportJson}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-purple-600 py-2.5 px-3 text-xs font-bold text-white shadow-lg transition-all hover:bg-purple-500"
            >
              <Download className="h-4 w-4" />
              <span>Download JSON</span>
            </button>
            <button
              onClick={handleCopyJson}
              className="flex items-center justify-center rounded-xl border border-slate-700 bg-slate-800 px-3 py-2.5 text-xs font-medium text-slate-300 hover:text-white transition-all"
              title="Copy JSON to Clipboard"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* JSON Schema Viewer Panel */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white">Downstream ERP JSON Payload Preview</h3>
            <p className="text-xs text-slate-400">Strictly schema-validated hierarchical payload</p>
          </div>
          <button
            onClick={handleCopyJson}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:border-purple-500 hover:text-white transition-all"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Payload'}</span>
          </button>
        </div>

        <pre className="max-h-72 overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 border border-slate-800">
          {JSON.stringify(invoices, null, 2)}
        </pre>
      </div>
    </div>
  );
};
