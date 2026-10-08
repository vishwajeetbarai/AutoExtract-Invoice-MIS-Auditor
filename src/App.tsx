import React, { useState, useMemo } from 'react';
import {
  FileText,
  Database,
  BarChart3,
  Download,
  Code2,
  FileCheck,
} from 'lucide-react';
import { InvoiceRecord } from './types';
import { INITIAL_INVOICES, UNSTRUCTURED_PRESETS } from './mockData';
import { evaluateDuckDBHygiene, flattenInvoices } from './utils/duckdbEngine';
import { Header } from './components/Header';
import { KpiMetricsBar } from './components/KpiMetricsBar';
import { IngestionTab } from './components/IngestionTab';
import { DuckDbValidationTab } from './components/DuckDbValidationTab';
import { ExecutiveDashboardTab } from './components/ExecutiveDashboardTab';
import { ExportTab } from './components/ExportTab';
import { PythonDeliverablesTab } from './components/PythonDeliverablesTab';

export default function App() {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [activeTab, setActiveTab] = useState<number>(0);

  // Compute DuckDB In-Memory SQL hygiene validation & cleaned MIS summary
  const validationResults = useMemo(() => {
    return evaluateDuckDBHygiene(invoices);
  }, [invoices]);

  const rawFlattenedInvoices = useMemo(() => {
    return flattenInvoices(invoices);
  }, [invoices]);

  // Actions
  const handleAddInvoice = (newInv: InvoiceRecord) => {
    setInvoices((prev) => [newInv, ...prev]);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddBatch = (batch: InvoiceRecord[]) => {
    setInvoices((prev) => [...batch, ...prev]);
  };

  const handleResetDemo = () => {
    setInvoices(INITIAL_INVOICES);
  };

  const handleClear = () => {
    setInvoices([]);
  };

  const handleLoadPreset = () => {
    const preset = UNSTRUCTURED_PRESETS[Math.floor(Math.random() * UNSTRUCTURED_PRESETS.length)];
    const newInv: InvoiceRecord = {
      id: `preset-${Date.now()}`,
      invoice_number: `PRESET-${Math.floor(Math.random() * 9000 + 1000)}`,
      vendor_name: preset.vendor,
      invoice_date: '2026-03-29',
      due_date: '2026-04-28',
      currency: 'USD',
      tax_amount: 180.0,
      total_amount_due: 3480.0,
      source_type: 'pdf',
      source_file: `${preset.title.slice(0, 20)}.pdf`,
      line_items: [
        {
          item_description: preset.category + ' Core Enterprise Service Tier',
          quantity: 1,
          unit_price: 3300.0,
          total_amount: 3300.0,
        },
      ],
    };
    handleAddInvoice(newInv);
  };

  const totalViolations =
    validationResults.calc_total_mismatch.length +
    validationResults.duplicate_check.length +
    validationResults.null_check.length;

  const tabs = [
    {
      label: 'Document Ingestion & Extraction Lab',
      icon: FileText,
      badge: `${invoices.length} docs`,
    },
    {
      label: 'DuckDB SQL Cleaning & Validation Rules',
      icon: Database,
      badge: totalViolations > 0 ? `${totalViolations} flags` : 'Clean',
      badgeColor: totalViolations > 0 ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300',
    },
    {
      label: 'Executive MIS Dashboard & Control Tower',
      icon: BarChart3,
      badge: 'Live MIS',
    },
    {
      label: 'Multi-Format Data Exporter',
      icon: Download,
      badge: 'CSV • Excel • JSON',
    },
    {
      label: 'Python Streamlit Deliverables (app.py)',
      icon: Code2,
      badge: 'Python Source',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 p-4 sm:p-6 lg:p-8 selection:bg-indigo-500/30">
      <div className="mx-auto max-w-7xl">
        {/* Header Bar */}
        <Header
          onResetDemo={handleResetDemo}
          onClear={handleClear}
          onLoadPreset={handleLoadPreset}
          invoiceCount={invoices.length}
        />

        {/* KPI Metrics Bar */}
        <KpiMetricsBar
          totalSpend={validationResults.total_spend}
          totalInvoices={validationResults.total_invoices}
          hygieneScore={validationResults.hygiene_score}
          topVendor={validationResults.top_vendor}
          violationsCount={totalViolations}
        />

        {/* Tab Navigation */}
        <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-white/5 bg-slate-900/60 p-1.5 backdrop-blur-md">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {tab.badge && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                      tab.badgeColor || (isActive ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-400')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <main className="transition-opacity duration-200">
          {activeTab === 0 && (
            <IngestionTab
              invoices={invoices}
              onAddInvoice={handleAddInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onAddBatch={handleAddBatch}
            />
          )}

          {activeTab === 1 && (
            <DuckDbValidationTab
              validationResults={validationResults}
              rawInvoices={rawFlattenedInvoices}
            />
          )}

          {activeTab === 2 && (
            <ExecutiveDashboardTab
              cleanedSummary={validationResults.cleaned_mis_summary}
              rawInvoices={rawFlattenedInvoices}
            />
          )}

          {activeTab === 3 && (
            <ExportTab
              invoices={invoices}
              cleanedSummary={validationResults.cleaned_mis_summary}
              rawInvoices={rawFlattenedInvoices}
            />
          )}

          {activeTab === 4 && <PythonDeliverablesTab />}
        </main>
      </div>
    </div>
  );
}
