import React from 'react';
import { Database, Sparkles, RefreshCw, PlusCircle, Trash2, ShieldCheck, Activity } from 'lucide-react';

interface HeaderProps {
  onResetDemo: () => void;
  onClear: () => void;
  onLoadPreset: () => void;
  invoiceCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  onResetDemo,
  onClear,
  onLoadPreset,
  invoiceCount,
}) => {
  return (
    <header className="mb-6 rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90 p-5 shadow-2xl backdrop-blur-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 shadow-inner">
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-white lg:text-3xl">
                AutoExtract <span className="text-indigo-400">MIS</span> & Executive Control Tower
              </h1>
              <p className="text-xs font-medium text-slate-400 sm:text-sm">
                Unstructured Document Extraction • DuckDB SQL Hygiene Validation • Real-time Executive Analytics
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Status Badges & Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 shadow-sm">
            <Database className="h-3.5 w-3.5 text-amber-400" />
            <span>DuckDB Engine Active</span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1.5 text-xs font-semibold text-indigo-300 shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span>Gemini 3.8 Flash Connected</span>
          </div>

          <div className="flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>{invoiceCount} Staged Documents</span>
          </div>

          <div className="h-6 w-px bg-slate-800 hidden sm:block" />

          <button
            onClick={onLoadPreset}
            className="flex items-center gap-1.5 rounded-lg border border-indigo-500/30 bg-indigo-600/20 px-3 py-1.5 text-xs font-medium text-indigo-200 transition-all hover:bg-indigo-600/30 hover:border-indigo-500/50"
            title="Load an unstructured document preset to test parsing"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Sample Document</span>
          </button>

          <button
            onClick={onResetDemo}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-slate-700 hover:text-white"
            title="Reset to pre-configured enterprise test invoices"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Reset Demo</span>
          </button>

          <button
            onClick={onClear}
            className="flex items-center gap-1.5 rounded-lg border border-rose-900/40 bg-rose-950/20 px-2.5 py-1.5 text-xs font-medium text-rose-300 transition-all hover:bg-rose-900/30 hover:border-rose-700"
            title="Clear all currently staged invoices"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
