import React from 'react';
import { DollarSign, FileSpreadsheet, ShieldAlert, Award, ArrowUpRight, CheckCircle2 } from 'lucide-react';

interface KpiMetricsBarProps {
  totalSpend: number;
  totalInvoices: number;
  hygieneScore: number;
  topVendor: string;
  violationsCount: number;
}

export const KpiMetricsBar: React.FC<KpiMetricsBarProps> = ({
  totalSpend,
  totalInvoices,
  hygieneScore,
  topVendor,
  violationsCount,
}) => {
  const getHygieneBadge = () => {
    if (hygieneScore >= 85) return { color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' };
    if (hygieneScore >= 60) return { color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' };
    return { color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' };
  };

  const badgeStyle = getHygieneBadge();

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* 1. Total Spend Incurred */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-indigo-500/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Spend Incurred</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <DollarSign className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold tracking-tight text-white">
            ${totalSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-emerald-400">
            <ArrowUpRight className="h-3.5 w-3.5" />
            <span>Across All Line Items</span>
          </div>
        </div>
      </div>

      {/* 2. Outstanding Invoices Parsed */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-indigo-500/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Invoices Parsed</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <FileSpreadsheet className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="text-3xl font-extrabold tracking-tight text-white">{totalInvoices}</div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />
            <span>In-Memory DuckDB Table</span>
          </div>
        </div>
      </div>

      {/* 3. Data Quality / Hygiene Score */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-indigo-500/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hygiene Score</span>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${badgeStyle.bg} border ${badgeStyle.border} ${badgeStyle.color}`}>
            <ShieldAlert className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className={`text-3xl font-extrabold tracking-tight ${badgeStyle.color}`}>
            {hygieneScore}%
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-400">
            {violationsCount === 0 ? (
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" /> 100% Schema Valid
              </span>
            ) : (
              <span className="text-amber-400">
                {violationsCount} Audit Flags Detected
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Top Vendor by Spend */}
      <div className="group relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-slate-900/80 via-slate-900/60 to-slate-950/80 p-5 shadow-lg backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-500/30 hover:shadow-indigo-500/10">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Top Vendor Spend</span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
            <Award className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-3">
          <div className="truncate text-xl font-extrabold tracking-tight text-white" title={topVendor}>
            {topVendor}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-purple-300">
            <span>Largest Spend Concentration</span>
          </div>
        </div>
      </div>
    </div>
  );
};
