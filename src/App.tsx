import React, { useState, useMemo } from 'react';
import {
  FileText,
  Database,
  BarChart3,
  Download,
  Code2,
} from 'lucide-react';
import { SupplierInvoiceRecord } from './types';
import { INITIAL_SUPPLIER_INVOICES, UNSTRUCTURED_PRESETS } from './mockData';
import { evaluateFourWayAudit, flattenSupplierInvoices } from './utils/duckdbEngine';
import { Header } from './components/Header';
import { KpiMetricsBar } from './components/KpiMetricsBar';
import { IngestionTab } from './components/IngestionTab';
import { DuckDbValidationTab } from './components/DuckDbValidationTab';
import { ExecutiveDashboardTab } from './components/ExecutiveDashboardTab';
import { ExportTab } from './components/ExportTab';
import { PythonDeliverablesTab } from './components/PythonDeliverablesTab';

export default function App() {
  // SLEEK LIGHT THEME BY DEFAULT (as requested: "#FFFFFF / #F8FAFC surface backgrounds, dark slate typography #0F172A")
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [invoices, setInvoices] = useState<SupplierInvoiceRecord[]>(INITIAL_SUPPLIER_INVOICES);
  const [activeTab, setActiveTab] = useState<number>(0);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const isDark = theme === 'dark';

  // Evaluate 4-way financial audit checks in DuckDB engine
  const auditResults = useMemo(() => {
    return evaluateFourWayAudit(invoices);
  }, [invoices]);

  const rawFlattenedInvoices = useMemo(() => {
    return flattenSupplierInvoices(invoices);
  }, [invoices]);

  const handleAddInvoice = (newInv: SupplierInvoiceRecord) => {
    setInvoices((prev) => [newInv, ...prev]);
  };

  const handleDeleteInvoice = (id: string) => {
    setInvoices((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddBatch = (batch: SupplierInvoiceRecord[]) => {
    setInvoices((prev) => [...batch, ...prev]);
  };

  const handleResetDemo = () => {
    setInvoices(INITIAL_SUPPLIER_INVOICES);
  };

  const handleClear = () => {
    setInvoices([]);
  };

  const handleLoadPreset = () => {
    const preset = UNSTRUCTURED_PRESETS[Math.floor(Math.random() * UNSTRUCTURED_PRESETS.length)];
    const newInv: SupplierInvoiceRecord = {
      id: `preset-${Date.now()}`,
      invoice_number: `PRESET-${Math.floor(Math.random() * 9000 + 1000)}`,
      po_number: `PO-${Math.floor(Math.random() * 90000 + 10000)}`,
      vendor_name: preset.vendor,
      invoice_date: '2026-03-29',
      due_date: '2026-04-28',
      currency: 'USD',
      subtotal: 3300.0,
      tax_rate: 8.5,
      tax_amount: 280.5,
      total_amount_due: 3580.5,
      source_type: 'pdf',
      source_file: `${preset.title.slice(0, 20)}.pdf`,
      line_items: [
        {
          item_description: preset.category + ' Reconciled Service Tier',
          quantity: 1,
          unit_price: 3300.0,
          total_amount: 3300.0,
        },
      ],
    };
    handleAddInvoice(newInv);
  };

  const totalFlags =
    auditResults.overcharge_check.length +
    auditResults.duplicate_check.length +
    auditResults.tax_validation_check.length +
    auditResults.missing_po_check.length;

  const tabs = [
    {
      label: 'Document Ingestion & Extraction Lab',
      icon: FileText,
      badge: `${invoices.length} Invoices`,
    },
    {
      label: 'DuckDB 4-Way Financial Audit Engine',
      icon: Database,
      badge: totalFlags > 0 ? `${totalFlags} Flags` : 'Clean',
      badgeColor: totalFlags > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300',
    },
    {
      label: 'MIS Analytics & Reconciliation Tower',
      icon: BarChart3,
      badge: 'Live MIS',
    },
    {
      label: 'Multi-Format Audit Exporter',
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
    <div
      className={`min-h-screen transition-colors duration-300 ${
        isDark ? 'bg-[#0B0F19] text-slate-100' : 'bg-[#F8FAFC] text-slate-900'
      } p-4 sm:p-6 lg:p-8`}
    >
      <div className="mx-auto max-w-7xl">
        {/* Header Bar with Circular Sun/Moon Toggle */}
        <Header
          theme={theme}
          onToggleTheme={toggleTheme}
          onResetDemo={handleResetDemo}
          onClear={handleClear}
          onLoadPreset={handleLoadPreset}
          invoiceCount={invoices.length}
        />

        {/* Financial Summary KPIs */}
        <KpiMetricsBar
          totalBilled={auditResults.total_billed}
          totalLeakage={auditResults.total_leakage}
          auditPassRate={auditResults.audit_pass_rate}
          topOverchargingVendor={auditResults.top_overcharging_vendor}
          totalInvoices={auditResults.unique_invoices_count}
          theme={theme}
        />

        {/* Tab Navigation */}
        <div
          className={`mb-6 flex flex-wrap gap-1.5 rounded-2xl border p-1.5 transition-all ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-slate-200/90 shadow-sm'
          }`}
        >
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeTab === idx;
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md'
                    : isDark
                    ? 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                {tab.badge && (
                  <span
                    className={`rounded-md px-1.5 py-0.5 text-[10px] font-mono ${
                      tab.badgeColor || (isActive ? 'bg-indigo-700 text-white' : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-700')
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Panels */}
        <main className="transition-opacity duration-200">
          {activeTab === 0 && (
            <IngestionTab
              invoices={invoices}
              onAddInvoice={handleAddInvoice}
              onDeleteInvoice={handleDeleteInvoice}
              onAddBatch={handleAddBatch}
              theme={theme}
            />
          )}

          {activeTab === 1 && (
            <DuckDbValidationTab
              auditResults={auditResults}
              rawInvoices={rawFlattenedInvoices}
              theme={theme}
            />
          )}

          {activeTab === 2 && (
            <ExecutiveDashboardTab
              auditedSummary={auditResults.audited_mis_summary}
              rawInvoices={rawFlattenedInvoices}
              theme={theme}
            />
          )}

          {activeTab === 3 && (
            <ExportTab
              invoices={invoices}
              auditedSummary={auditResults.audited_mis_summary}
              rawInvoices={rawFlattenedInvoices}
              theme={theme}
            />
          )}

          {activeTab === 4 && <PythonDeliverablesTab theme={theme} />}
        </main>
      </div>
    </div>
  );
}
