import React from 'react';
import { DollarSign, ShieldAlert, Award, AlertOctagon, TrendingDown, CheckCircle2 } from 'lucide-react';

interface KpiMetricsBarProps {
  totalBilled: number;
  totalLeakage: number;
  auditPassRate: number;
  topOverchargingVendor: string;
  totalInvoices: number;
  theme: 'light' | 'dark';
}

export const KpiMetricsBar: React.FC<KpiMetricsBarProps> = ({
  totalBilled,
  totalLeakage,
  auditPassRate,
  topOverchargingVendor,
  totalInvoices,
  theme,
}) => {
  const isDark = theme === 'dark';

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Billed Spend */}
      <div
        className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 ${
          isDark
            ? 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/40'
            : 'bg-white border-slate-200/90 hover:border-indigo-400 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Billed Spend
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
            }`}
          >
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-3xl font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
            ${totalBilled.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span>Across {totalInvoices} Invoices Analyzed</span>
          </div>
        </div>
      </div>

      {/* 2. Total Leakage / Discrepancy Amount */}
      <div
        className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 ${
          isDark
            ? 'bg-slate-900/80 border-slate-800 hover:border-rose-500/40'
            : 'bg-white border-slate-200/90 hover:border-rose-400 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Total Leakage Detected
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}
          >
            <AlertOctagon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold tracking-tight text-rose-600 dark:text-rose-400">
            ${totalLeakage.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <TrendingDown className="h-3.5 w-3.5" />
            <span>Overcharges + Taxes + Duplicates</span>
          </div>
        </div>
      </div>

      {/* 3. Audit Pass Rate */}
      <div
        className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 ${
          isDark
            ? 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/40'
            : 'bg-white border-slate-200/90 hover:border-indigo-400 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Audit Pass Rate
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              isDark ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-600'
            }`}
          >
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-3xl font-extrabold tracking-tight ${
              auditPassRate >= 80 ? 'text-emerald-600 dark:text-emerald-400' : auditPassRate >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {auditPassRate}%
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
            {auditPassRate === 100 ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Reconciled
              </span>
            ) : (
              <span>4-Way DuckDB Validation</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Top Overcharging Vendor */}
      <div
        className={`group relative overflow-hidden rounded-2xl border p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 ${
          isDark
            ? 'bg-slate-900/80 border-slate-800 hover:border-indigo-500/40'
            : 'bg-white border-slate-200/90 hover:border-indigo-400 hover:shadow-md'
        }`}
      >
        <div className="flex items-center justify-between">
          <span className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Top Overcharging Vendor
          </span>
          <div
            className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
              isDark ? 'bg-purple-500/10 border-purple-500/20 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'
            }`}
          >
            <Award className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div
            className={`text-xl font-extrabold tracking-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}
            title={topOverchargingVendor}
          >
            {topOverchargingVendor}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
            <span>Highest Math Discrepancy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
