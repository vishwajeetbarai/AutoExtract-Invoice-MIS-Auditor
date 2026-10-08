import React from 'react';
import { Database, Sparkles, RefreshCw, PlusCircle, Trash2, Sun, Moon, ShieldCheck, Activity } from 'lucide-react';

interface HeaderProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  onResetDemo: () => void;
  onClear: () => void;
  onLoadPreset: () => void;
  invoiceCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  onResetDemo,
  onClear,
  onLoadPreset,
  invoiceCount,
}) => {
  const isDark = theme === 'dark';

  return (
    <header
      className={`mb-6 rounded-2xl border p-4 sm:p-5 transition-all duration-300 shadow-sm backdrop-blur-md ${
        isDark
          ? 'bg-slate-900/90 border-indigo-500/20 text-white'
          : 'bg-white border-slate-200/90 text-slate-900 shadow-slate-100'
      }`}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl border shadow-sm ${
                isDark
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                  : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              }`}
            >
              <Activity className="h-6 w-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
                  AutoExtract <span className="text-indigo-600">MIS</span> & Executive Control Tower
                </h1>
              </div>
              <p
                className={`text-xs font-medium mt-0.5 ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}
              >
                Automated Supplier Invoice Reconciliation • DuckDB Financial Leakage Engine • PO & Tax Audit
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Status Badges & Circular Sun/Moon Toggle */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${
              isDark
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}
          >
            <Database className="h-3.5 w-3.5 text-amber-500" />
            <span>DuckDB In-Memory</span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${
              isDark
                ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300'
                : 'bg-indigo-50 border-indigo-200 text-indigo-700'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
            <span>Gemini 3.8 Flash</span>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold border ${
              isDark
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>{invoiceCount} Invoices</span>
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* Quick Preset Actions */}
          <button
            onClick={onLoadPreset}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all ${
              isDark
                ? 'border-indigo-500/30 bg-indigo-600/20 text-indigo-200 hover:bg-indigo-600/30'
                : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
            }`}
            title="Load an unstructured supplier invoice preset"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Add Preset</span>
          </button>

          <button
            onClick={onResetDemo}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium border transition-all ${
              isDark
                ? 'border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700'
                : 'border-slate-200 bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
            title="Reset to pre-configured enterprise audit batch"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Reset Batch</span>
          </button>

          <button
            onClick={onClear}
            className={`flex items-center rounded-lg p-1.5 border transition-all ${
              isDark
                ? 'border-rose-900/40 bg-rose-950/20 text-rose-300 hover:bg-rose-900/30'
                : 'border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100'
            }`}
            title="Clear Staged Invoices"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          {/* CIRCULAR ICON-ONLY SUN/MOON TOGGLE BUTTON (NO TEXT LABELS!) */}
          <button
            onClick={onToggleTheme}
            aria-label="Toggle Light/Dark Theme"
            className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm transition-all duration-300 hover:scale-105 active:scale-95 ${
              isDark
                ? 'bg-slate-800 border-slate-700 text-amber-400 hover:bg-slate-700 hover:border-amber-400/50 hover:text-amber-300'
                : 'bg-slate-100 border-slate-200 text-indigo-600 hover:bg-slate-200 hover:border-indigo-400/50 hover:text-indigo-700'
            }`}
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {isDark ? (
              <Sun className="h-4.5 w-4.5 fill-amber-400/20" />
            ) : (
              <Moon className="h-4.5 w-4.5 fill-indigo-600/20" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
