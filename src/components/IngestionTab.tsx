import React, { useState } from 'react';
import {
  FileText,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  FileSpreadsheet,
  ArrowRight,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { SupplierInvoiceRecord } from '../types';
import { UNSTRUCTURED_PRESETS, UnstructuredPreset } from '../mockData';

interface IngestionTabProps {
  invoices: SupplierInvoiceRecord[];
  onAddInvoice: (invoice: SupplierInvoiceRecord) => void;
  onDeleteInvoice: (id: string) => void;
  onAddBatch: (invoices: SupplierInvoiceRecord[]) => void;
  theme: 'light' | 'dark';
}

export const IngestionTab: React.FC<IngestionTabProps> = ({
  invoices,
  onAddInvoice,
  onDeleteInvoice,
  onAddBatch,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [selectedPreset, setSelectedPreset] = useState<UnstructuredPreset>(UNSTRUCTURED_PRESETS[0]);
  const [customText, setCustomText] = useState<string>(UNSTRUCTURED_PRESETS[0].rawText);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedResult, setExtractedResult] = useState<any | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractionMode, setExtractionMode] = useState<string>('');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  // Trigger Gemini Flash Extraction
  const handleExtractWithGemini = async () => {
    if (!customText.trim()) return;

    setIsExtracting(true);
    setExtractError(null);
    setExtractedResult(null);

    try {
      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: customText,
          file_type: 'unstructured_supplier_invoice',
        }),
      });

      const json = await response.json();
      if (!response.ok || json.error) {
        throw new Error(json.error || 'Failed to extract supplier invoice');
      }

      setExtractedResult(json.data);
      setExtractionMode(json.mode || 'gemini_flash');
    } catch (err: any) {
      console.error('Extraction error:', err);
      setExtractError(err.message || 'An error occurred during extraction');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleStageExtracted = () => {
    if (!extractedResult) return;

    const sub = Number(extractedResult.subtotal) || Number(extractedResult.total_amount_due) || 1000;
    const taxRate = Number(extractedResult.tax_rate) || 8.0;
    const taxAmt = Number(extractedResult.tax_amount) || Number((sub * (taxRate / 100)).toFixed(2));

    const newInvoice: SupplierInvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoice_number: extractedResult.invoice_number || `INV-${Math.floor(Math.random() * 90000)}`,
      po_number: extractedResult.po_number || 'PO-AUTO-99',
      vendor_name: extractedResult.vendor_name || 'Generic Supplier Corp',
      invoice_date: extractedResult.invoice_date || new Date().toISOString().split('T')[0],
      due_date: extractedResult.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      currency: extractedResult.currency || 'USD',
      subtotal: sub,
      tax_rate: taxRate,
      tax_amount: taxAmt,
      total_amount_due: Number(extractedResult.total_amount_due) || (sub + taxAmt),
      source_type: 'pdf',
      source_file: selectedPreset.title,
      line_items: (extractedResult.line_items || []).map((li: any) => ({
        item_description: li.item_description || 'Item Description',
        quantity: Number(li.quantity) || 1,
        unit_price: Number(li.unit_price) || 0,
        total_amount: Number(li.total_amount) || 0,
      })),
    };

    onAddInvoice(newInvoice);
    setExtractedResult(null);
  };

  const handleParseCsv = (text: string) => {
    setCsvRawText(text);
    try {
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setCsvPreview([]);
        return;
      }
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/\s+/g, '_'));
      const parsedRows = lines.slice(1).map((line) => {
        const values = line.split(',').map((v) => v.trim());
        const row: Record<string, any> = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] || '';
        });
        return row;
      });
      setCsvPreview(parsedRows);
    } catch (err) {
      console.error('CSV parse error:', err);
    }
  };

  const handleIngestCsvRows = () => {
    if (csvPreview.length === 0) return;

    const createdInvoices: SupplierInvoiceRecord[] = csvPreview.map((row, idx) => {
      const sub = parseFloat(row.subtotal || row.amount || '1000') || 1000;
      const taxRate = parseFloat(row.tax_rate || '10') || 10;
      const taxAmt = parseFloat(row.tax_amount || '100') || 100;
      const total = parseFloat(row.total_amount_due || String(sub + taxAmt)) || (sub + taxAmt);

      return {
        id: `csv-${Date.now()}-${idx}`,
        invoice_number: row.invoice_number || row.inv_no || `CSV-${1000 + idx}`,
        po_number: row.po_number || null,
        vendor_name: row.vendor_name || row.vendor || 'Ingested Supplier',
        invoice_date: row.invoice_date || row.date || new Date().toISOString().split('T')[0],
        due_date: row.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        currency: row.currency || 'USD',
        subtotal: sub,
        tax_rate: taxRate,
        tax_amount: taxAmt,
        total_amount_due: total,
        source_type: 'csv',
        source_file: 'vendor_log.csv',
        line_items: [
          {
            item_description: row.item_description || row.description || 'Imported Goods',
            quantity: parseFloat(row.quantity || '1') || 1,
            unit_price: parseFloat(row.unit_price || String(sub)) || sub,
            total_amount: sub,
          },
        ],
      };
    });

    onAddBatch(createdInvoices);
    setCsvPreview([]);
    setCsvRawText('');
  };

  const sampleCsvTemplate = `invoice_number,po_number,vendor_name,invoice_date,due_date,subtotal,tax_rate,tax_amount,total_amount_due
INV-CSV-901,PO-33019,Nexus Logistics Group,2026-03-25,2026-04-15,1450.00,0,0,1450.00
INV-CSV-902,PO-88120,Apex Data Infrastructure,2026-03-26,2026-04-20,850.00,10,85.00,935.00
INV-CSV-903,,Unapproved Consulting LLC,2026-03-28,2026-04-25,3200.00,8,256.00,3456.00`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: PDF & Unstructured Text Extraction */}
        <div
          className={`lg:col-span-7 space-y-4 rounded-2xl border p-5 shadow-sm transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                  isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
                }`}
              >
                <FileText className="h-4 w-4" />
              </div>
              <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                1. Supplier PDF Extraction Lab (pdfplumber + Gemini Flash)
              </h2>
            </div>
            <span
              className={`rounded-md px-2 py-0.5 text-xs font-semibold border ${
                isDark ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'
              }`}
            >
              Strict Schema
            </span>
          </div>

          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Parse unstructured supplier invoices into structured PO #, line items, subtotals, and taxes via Gemini Flash API.
          </p>

          {/* Presets */}
          <div>
            <label className={`text-xs font-bold uppercase tracking-wider block mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Select Real-World Supplier Preset
            </label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {UNSTRUCTURED_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSelectedPreset(preset);
                    setCustomText(preset.rawText);
                    setExtractedResult(null);
                  }}
                  className={`flex flex-col text-left rounded-xl border p-2.5 transition-all text-xs ${
                    selectedPreset.title === preset.title
                      ? isDark
                        ? 'border-indigo-500 bg-indigo-950/40 text-white'
                        : 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold'
                      : isDark
                      ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <span className="font-semibold truncate">{preset.title.split('(')[0]}</span>
                  <span className="text-[11px] text-indigo-500 font-mono mt-0.5">{preset.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Raw Text Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Unstructured Document Text Stream (Simulated pdfplumber Layout Output)
              </label>
              <button
                onClick={() => setCustomText(selectedPreset.rawText)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Reset
              </button>
            </div>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={7}
              className={`w-full rounded-xl border p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isDark
                  ? 'border-slate-800 bg-slate-950 text-slate-200 placeholder-slate-600'
                  : 'border-slate-300 bg-slate-50 text-slate-800 placeholder-slate-400'
              }`}
              placeholder="Paste raw unstructured supplier invoice text..."
            />
          </div>

          <button
            onClick={handleExtractWithGemini}
            disabled={isExtracting || !customText.trim()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-bold text-white shadow-md transition-all hover:bg-indigo-500 disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Extracting Structured Schema via Gemini Flash...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                <span>Extract Structured Schema with Gemini Flash</span>
              </>
            )}
          </button>

          {extractError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-300">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{extractError}</span>
            </div>
          )}

          {extractedResult && (
            <div
              className={`mt-4 rounded-xl border p-4 space-y-3 ${
                isDark ? 'border-emerald-500/30 bg-slate-950' : 'border-emerald-300 bg-emerald-50/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Validated Supplier Schema Extracted ({extractionMode})</span>
                </div>
                <button
                  onClick={handleStageExtracted}
                  className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500"
                >
                  <span>Stage into DuckDB</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-[10px] uppercase text-slate-500 block">Invoice #</span>
                  <span className="font-bold">{extractedResult.invoice_number}</span>
                </div>
                <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-[10px] uppercase text-slate-500 block">PO #</span>
                  <span className="font-bold">{extractedResult.po_number || 'NULL (Missing)'}</span>
                </div>
                <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-[10px] uppercase text-slate-500 block">Vendor</span>
                  <span className="font-bold truncate block">{extractedResult.vendor_name}</span>
                </div>
                <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-[10px] uppercase text-slate-500 block">Total Due</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    ${Number(extractedResult.total_amount_due).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Tabular CSV Normalizer */}
        <div
          className={`lg:col-span-5 space-y-4 rounded-2xl border p-5 shadow-sm transition-all flex flex-col justify-between ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg border ${
                    isDark ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
                  }`}
                >
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  2. Vendor CSV Normalizer
                </h2>
              </div>
              <button
                onClick={() => handleParseCsv(sampleCsvTemplate)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline"
              >
                Load Sample
              </button>
            </div>

            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Automatically standardizes header names, lowercases, replaces spaces with underscores, and standardizes tax rates.
            </p>

            <textarea
              value={csvRawText}
              onChange={(e) => handleParseCsv(e.target.value)}
              rows={6}
              className={`w-full rounded-xl border p-3 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-emerald-500 ${
                isDark
                  ? 'border-slate-800 bg-slate-950 text-slate-200 placeholder-slate-600'
                  : 'border-slate-300 bg-slate-50 text-slate-800 placeholder-slate-400'
              }`}
              placeholder="Paste raw vendor CSV lines..."
            />

            {csvPreview.length > 0 && (
              <div
                className={`rounded-xl border p-3 space-y-2 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>Normalized {csvPreview.length} Rows</span>
                  <button
                    onClick={handleIngestCsvRows}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs text-white hover:bg-emerald-500"
                  >
                    Ingest into DuckDB
                  </button>
                </div>
              </div>
            )}
          </div>

          <div
            className={`rounded-xl border p-3 text-[11px] ${
              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
            }`}
          >
            <strong>Audit Hygiene Rule:</strong> All records are registered into DuckDB table <code className="text-amber-600 dark:text-amber-400">invoices</code>.
          </div>
        </div>
      </div>

      {/* Staged Registry Table */}
      <div
        className={`rounded-2xl border p-5 shadow-sm transition-all ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              In-Memory Supplier Invoices Registry
            </h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Registered DuckDB in-memory dataset ({invoices.length} total supplier invoices)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className={`border-b font-bold ${isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                <th className="py-2.5 pl-2">Invoice #</th>
                <th className="py-2.5">PO Number</th>
                <th className="py-2.5">Vendor Name</th>
                <th className="py-2.5">Date</th>
                <th className="py-2.5 text-right">Subtotal</th>
                <th className="py-2.5 text-right">Tax</th>
                <th className="py-2.5 text-right">Total Due</th>
                <th className="py-2.5 text-right pr-2">Action</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
              {invoices.map((inv) => (
                <tr key={inv.id} className={isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'}>
                  <td className={`py-2.5 pl-2 font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {inv.invoice_number}
                  </td>
                  <td className="py-2.5">
                    {inv.po_number ? (
                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">{inv.po_number}</span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 font-bold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded">
                        MISSING
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 font-sans font-medium">{inv.vendor_name}</td>
                  <td className="py-2.5 text-slate-500">{inv.invoice_date || 'NULL'}</td>
                  <td className="py-2.5 text-right">${inv.subtotal.toFixed(2)}</td>
                  <td className="py-2.5 text-right text-slate-500">${inv.tax_amount.toFixed(2)}</td>
                  <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                    ${inv.total_amount_due.toFixed(2)}
                  </td>
                  <td className="py-2.5 text-right pr-2">
                    <button
                      onClick={() => onDeleteInvoice(inv.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
