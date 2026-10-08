import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  Sparkles,
  CheckCircle,
  AlertTriangle,
  Code,
  FileSpreadsheet,
  ArrowRight,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { InvoiceRecord, LineItem } from '../types';
import { UNSTRUCTURED_PRESETS, UnstructuredPreset } from '../mockData';

interface IngestionTabProps {
  invoices: InvoiceRecord[];
  onAddInvoice: (invoice: InvoiceRecord) => void;
  onDeleteInvoice: (id: string) => void;
  onAddBatch: (invoices: InvoiceRecord[]) => void;
}

export const IngestionTab: React.FC<IngestionTabProps> = ({
  invoices,
  onAddInvoice,
  onDeleteInvoice,
  onAddBatch,
}) => {
  const [selectedPreset, setSelectedPreset] = useState<UnstructuredPreset>(UNSTRUCTURED_PRESETS[0]);
  const [customText, setCustomText] = useState<string>(UNSTRUCTURED_PRESETS[0].rawText);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [extractedResult, setExtractedResult] = useState<any | null>(null);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extractionMode, setExtractionMode] = useState<string>('');
  const [csvRawText, setCsvRawText] = useState<string>('');
  const [csvPreview, setCsvPreview] = useState<any[]>([]);

  // Trigger Gemini Flash Extraction via Backend API
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
          file_type: 'unstructured_text',
        }),
      });

      const json = await response.json();
      if (!response.ok || json.error) {
        throw new Error(json.error || 'Failed to extract invoice schema');
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

  // Stage extracted JSON into state
  const handleStageExtracted = () => {
    if (!extractedResult) return;

    const newInvoice: InvoiceRecord = {
      id: `inv-${Date.now()}`,
      invoice_number: extractedResult.invoice_number || `INV-${Math.floor(Math.random() * 90000)}`,
      vendor_name: extractedResult.vendor_name || 'Generic Vendor',
      invoice_date: extractedResult.invoice_date || new Date().toISOString().split('T')[0],
      due_date: extractedResult.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      currency: extractedResult.currency || 'USD',
      tax_amount: Number(extractedResult.tax_amount) || 0,
      total_amount_due: Number(extractedResult.total_amount_due) || 0,
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

  // CSV Ingestion Handler
  const handleParseCsv = (text: string) => {
    setCsvRawText(text);
    try {
      const lines = text.trim().split('\n');
      if (lines.length < 2) {
        setCsvPreview([]);
        return;
      }
      // Standardize header: lowercase, trim, replace spaces with underscores
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

    const createdInvoices: InvoiceRecord[] = csvPreview.map((row, idx) => {
      const total = parseFloat(row.total_amount_due || row.amount || row.total || '0') || 500;
      return {
        id: `csv-${Date.now()}-${idx}`,
        invoice_number: row.invoice_number || row.inv_no || `CSV-${1000 + idx}`,
        vendor_name: row.vendor_name || row.vendor || 'Ingested CSV Vendor',
        invoice_date: row.invoice_date || row.date || new Date().toISOString().split('T')[0],
        due_date: row.due_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        currency: row.currency || 'USD',
        tax_amount: parseFloat(row.tax_amount || row.tax || '0') || 0,
        total_amount_due: total,
        source_type: 'csv',
        source_file: 'tabular_import.csv',
        line_items: [
          {
            item_description: row.item_description || row.description || 'Imported Goods / Services',
            quantity: parseFloat(row.quantity || row.qty || '1') || 1,
            unit_price: parseFloat(row.unit_price || row.rate || String(total)) || total,
            total_amount: total,
          },
        ],
      };
    });

    onAddBatch(createdInvoices);
    setCsvPreview([]);
    setCsvRawText('');
  };

  const sampleCsvTemplate = `invoice_number,vendor_name,invoice_date,due_date,currency,item_description,quantity,unit_price,total_amount_due
INV-CSV-901,Nexus Logistics Group,2026-03-25,2026-04-15,USD,Ocean Freight Drayage,1,1450.00,1450.00
INV-CSV-902,Apex Data Infrastructure,2026-03-26,2026-04-20,USD,High Performance SSD Storage,10,85.00,850.00
INV-CSV-903,Global Consulting Partners,2026-03-28,2026-04-25,USD,Financial MIS Systems Audit,1,3200.00,3200.00`;

  return (
    <div className="space-y-6">
      {/* SECTION 1: Dual Ingestion Lab */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: PDF & Unstructured Text Extraction */}
        <div className="lg:col-span-7 space-y-4 rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
                <FileText className="h-4 w-4" />
              </div>
              <h2 className="text-base font-bold text-white">
                1. Unstructured Document & PDF Extraction Lab
              </h2>
            </div>
            <span className="rounded-md border border-indigo-500/30 bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-300">
              Gemini 3.8 Flash Parser
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Select a raw unformatted invoice preset below or paste custom unstructured text to trigger layout parsing and Gemini Flash strict JSON schema extraction.
          </p>

          {/* Presets Selector */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2">
              Choose Unstructured Preset
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
                      ? 'border-indigo-500 bg-indigo-950/40 text-white shadow-md'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                  }`}
                >
                  <span className="font-semibold truncate text-white">{preset.title.split('(')[0]}</span>
                  <span className="text-[11px] text-indigo-400 font-mono mt-0.5">{preset.category}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Raw Text Input / PDF Layout Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <span>Raw Unstructured Text Content (Simulated pdfplumber Output)</span>
              </label>
              <button
                onClick={() => setCustomText(selectedPreset.rawText)}
                className="text-[11px] text-slate-400 hover:text-indigo-300 flex items-center gap-1"
              >
                <RefreshCw className="h-3 w-3" /> Reset Preset
              </button>
            </div>
            <textarea
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              rows={8}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-3 font-mono text-xs text-slate-300 placeholder-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Paste raw unstructured invoice text or PDF dump..."
            />
          </div>

          {/* Action Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleExtractWithGemini}
              disabled={isExtracting || !customText.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 px-4 text-xs font-bold text-white shadow-lg transition-all hover:bg-indigo-500 disabled:opacity-50"
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Extracting via Gemini Flash Schema Model...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Extract Structured Schema with Gemini Flash</span>
                </>
              )}
            </button>
          </div>

          {/* Extraction Error Display */}
          {extractError && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300">
              <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
              <span>{extractError}</span>
            </div>
          )}

          {/* Extracted Schema JSON Result Panel */}
          {extractedResult && (
            <div className="mt-4 rounded-xl border border-emerald-500/30 bg-slate-950/90 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>Validated Schema Extracted ({extractionMode})</span>
                </div>
                <button
                  onClick={handleStageExtracted}
                  className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-md hover:bg-emerald-500 transition-all"
                >
                  <span>Stage into In-Memory DuckDB</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs sm:grid-cols-4">
                <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 block">Invoice #</span>
                  <span className="font-semibold text-white">{extractedResult.invoice_number}</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 block">Vendor</span>
                  <span className="font-semibold text-white truncate block">{extractedResult.vendor_name}</span>
                </div>
                <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 block">Total Due</span>
                  <span className="font-semibold text-emerald-400">
                    ${Number(extractedResult.total_amount_due).toFixed(2)}
                  </span>
                </div>
                <div className="rounded-lg bg-slate-900 p-2 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 block">Line Items</span>
                  <span className="font-semibold text-white">
                    {(extractedResult.line_items || []).length} items
                  </span>
                </div>
              </div>

              <details className="text-xs">
                <summary className="cursor-pointer text-indigo-400 font-medium hover:text-indigo-300">
                  View Raw JSON Schema
                </summary>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-[11px] text-slate-300 border border-slate-800">
                  {JSON.stringify(extractedResult, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>

        {/* Right Column: Tabular CSV Ingestion */}
        <div className="lg:col-span-5 space-y-4 rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-400">
                  <FileSpreadsheet className="h-4 w-4" />
                </div>
                <h2 className="text-base font-bold text-white">2. Tabular CSV Ingestion</h2>
              </div>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-300">
                Auto-Standardizer
              </span>
            </div>

            <p className="text-xs text-slate-400">
              Paste messy tabular CSV data. The ingestion engine automatically normalizes column headers (lowercase, replaces spaces with underscores) and parses dates.
            </p>

            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-300">CSV Data Input</span>
              <button
                onClick={() => handleParseCsv(sampleCsvTemplate)}
                className="text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Load Sample CSV
              </button>
            </div>

            <textarea
              value={csvRawText}
              onChange={(e) => handleParseCsv(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 p-3 font-mono text-xs text-slate-300 placeholder-slate-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Paste raw comma-separated values (CSV)..."
            />

            {csvPreview.length > 0 && (
              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/80 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Normalized Preview ({csvPreview.length} rows detected)</span>
                  <button
                    onClick={handleIngestCsvRows}
                    className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-bold text-white hover:bg-emerald-500 transition-all"
                  >
                    Ingest {csvPreview.length} Records
                  </button>
                </div>
                <div className="max-h-36 overflow-auto">
                  <table className="w-full text-left font-mono text-[11px] text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-500">
                        <th className="py-1">invoice_number</th>
                        <th className="py-1">vendor_name</th>
                        <th className="py-1 text-right">total_amount_due</th>
                      </tr>
                    </thead>
                    <tbody>
                      {csvPreview.slice(0, 4).map((r, i) => (
                        <tr key={i} className="border-b border-slate-900/60">
                          <td className="py-1">{r.invoice_number}</td>
                          <td className="py-1 truncate max-w-[120px]">{r.vendor_name}</td>
                          <td className="py-1 text-right text-emerald-400 font-semibold">${r.total_amount_due}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-3 text-[11px] text-slate-400">
            <span className="font-semibold text-slate-300">Schema Validation Rule:</span> All ingested records are automatically staged into DuckDB memory as <code className="text-amber-400">raw_invoices</code>.
          </div>
        </div>
      </div>

      {/* SECTION 2: Staged Invoices Registry */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-white">Staged Invoices Registry</h3>
            <p className="text-xs text-slate-400">
              Live in-memory documents staged and registered for DuckDB SQL hygiene processing ({invoices.length} total)
            </p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <p className="text-sm">No invoices staged yet.</p>
            <p className="text-xs mt-1 text-slate-600">Use the extractors above or click "Reset Demo" in the top bar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-3 pl-2">Invoice #</th>
                  <th className="pb-3">Vendor Name</th>
                  <th className="pb-3">Invoice Date</th>
                  <th className="pb-3">Due Date</th>
                  <th className="pb-3 text-center">Items</th>
                  <th className="pb-3 text-right">Tax</th>
                  <th className="pb-3 text-right">Total Due</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 pl-2 font-bold text-white">{inv.invoice_number}</td>
                    <td className="py-3 font-sans text-slate-200">{inv.vendor_name}</td>
                    <td className="py-3 text-slate-400">{inv.invoice_date || <span className="text-rose-400 font-bold">NULL</span>}</td>
                    <td className="py-3 text-slate-400">{inv.due_date || '—'}</td>
                    <td className="py-3 text-center">
                      <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                        {(inv.line_items || []).length}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400">
                      ${(inv.tax_amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right font-bold text-emerald-400">
                      ${(inv.total_amount_due || 0).toFixed(2)}
                    </td>
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => onDeleteInvoice(inv.id)}
                        className="rounded p-1 text-slate-500 hover:bg-rose-950/50 hover:text-rose-400 transition-colors"
                        title="Remove Invoice"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
