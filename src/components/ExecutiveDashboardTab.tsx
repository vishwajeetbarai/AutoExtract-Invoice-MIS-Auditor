import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  Search,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileQuestion,
  ArrowUpDown,
  Filter,
} from 'lucide-react';
import { AuditedMISRecord, FlattenedSupplierRow } from '../types';

interface ExecutiveDashboardTabProps {
  auditedSummary: AuditedMISRecord[];
  rawInvoices: FlattenedSupplierRow[];
  theme: 'light' | 'dark';
}

export const ExecutiveDashboardTab: React.FC<ExecutiveDashboardTabProps> = ({
  auditedSummary,
  rawInvoices,
  theme,
}) => {
  const isDark = theme === 'dark';
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof AuditedMISRecord>('total_amount_due');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // 1. Vendor Spend vs Leakage breakdown
  const vendorBreakdown = useMemo(() => {
    const map = new Map<string, { total: number; leakage: number; count: number }>();
    auditedSummary.forEach((inv) => {
      const v = inv.vendor_name || 'Unknown';
      const curr = map.get(v) || { total: 0, leakage: 0, count: 0 };
      curr.total += inv.total_amount_due;
      curr.leakage += inv.leakage_amount;
      curr.count += 1;
      map.set(v, curr);
    });

    return Array.from(map.entries())
      .map(([vendor, val]) => ({
        vendor,
        total: val.total,
        leakage: val.leakage,
        count: val.count,
      }))
      .sort((a, b) => b.total - a.total);
  }, [auditedSummary]);

  const maxVendorTotal = useMemo(() => {
    return Math.max(...vendorBreakdown.map((v) => v.total), 100);
  }, [vendorBreakdown]);

  // 2. Risk Distribution breakdown
  const riskCounts = useMemo(() => {
    const counts = {
      OVERCHARGED: 0,
      DUPLICATE: 0,
      'MISSING PO': 0,
      VERIFIED: 0,
    };
    auditedSummary.forEach((r) => {
      counts[r.audit_status] = (counts[r.audit_status] || 0) + 1;
    });
    return counts;
  }, [auditedSummary]);

  // Filtered & Sorted Table
  const filteredRecords = useMemo(() => {
    return auditedSummary
      .filter((rec) => {
        const matchesSearch =
          rec.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rec.vendor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rec.po_number.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || rec.audit_status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => {
        const valA = a[sortField];
        const valB = b[sortField];
        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortAsc ? valA - valB : valB - valA;
        }
        return sortAsc
          ? String(valA).localeCompare(String(valB))
          : String(valB).localeCompare(String(valA));
      });
  }, [auditedSummary, searchTerm, statusFilter, sortField, sortAsc]);

  const getStatusBadge = (status: AuditedMISRecord['audit_status']) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" /> VERIFIED
          </span>
        );
      case 'OVERCHARGED':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-300 dark:border-rose-500/30 bg-rose-50 dark:bg-rose-950/40 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-400">
            <AlertOctagon className="h-3 w-3" /> OVERCHARGED
          </span>
        );
      case 'DUPLICATE':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400">
            <AlertTriangle className="h-3 w-3" /> DUPLICATE
          </span>
        );
      case 'MISSING PO':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-300 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/40 px-2.5 py-0.5 text-[11px] font-bold text-purple-700 dark:text-purple-400">
            <FileQuestion className="h-3 w-3" /> MISSING PO
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Chart 1: Vendor Spend & Discrepancy Breakdown */}
        <div
          className={`lg:col-span-7 rounded-2xl border p-5 shadow-sm transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold">Vendor Billed Spend & Financial Discrepancies</h3>
            </div>
            <span className="text-[11px] text-slate-500">Spend vs Leakage</span>
          </div>

          <div className="space-y-3">
            {vendorBreakdown.map((v, i) => {
              const widthPct = Math.min((v.total / maxVendorTotal) * 100, 100);
              return (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold truncate max-w-[200px]">{v.vendor}</span>
                    <div className="flex items-center gap-3 font-mono">
                      {v.leakage > 0 && (
                        <span className="text-rose-600 dark:text-rose-400 font-bold text-[11px]">
                          -${v.leakage.toFixed(2)} Leak
                        </span>
                      )}
                      <span className="font-bold">${v.total.toLocaleString()}</span>
                    </div>
                  </div>
                  <div
                    className={`h-2.5 w-full rounded-full overflow-hidden ${
                      isDark ? 'bg-slate-800' : 'bg-slate-100'
                    }`}
                  >
                    <div
                      style={{ width: `${widthPct}%` }}
                      className="h-full rounded-full bg-indigo-600 transition-all duration-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Audit Risk Priority Distribution */}
        <div
          className={`lg:col-span-5 rounded-2xl border p-5 shadow-sm transition-all ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold">Audit Risk Priority Distribution</h3>
            </div>
            <span className="text-[11px] text-slate-500">Classification</span>
          </div>

          <div className="space-y-3 pt-2">
            {[
              { label: 'OVERCHARGED', count: riskCounts.OVERCHARGED, color: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400' },
              { label: 'DUPLICATE', count: riskCounts.DUPLICATE, color: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
              { label: 'MISSING PO', count: riskCounts['MISSING PO'], color: 'bg-purple-500', text: 'text-purple-600 dark:text-purple-400' },
              { label: 'VERIFIED', count: riskCounts.VERIFIED, color: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
            ].map((item, idx) => {
              const total = auditedSummary.length || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-bold flex items-center gap-1.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.color}`} />
                      {item.label}
                    </span>
                    <span className="font-mono font-bold">
                      {item.count} bills ({pct}%)
                    </span>
                  </div>
                  <div
                    className={`h-2 w-full rounded-full overflow-hidden ${
                      isDark ? 'bg-slate-800' : 'bg-slate-100'
                    }`}
                  >
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full ${item.color} transition-all duration-500`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filterable Table */}
      <div
        className={`rounded-2xl border p-5 shadow-sm space-y-4 transition-all ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold">Audited MIS Reconciliation Control Tower</h3>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Standardized summary view from <code className="text-indigo-600 dark:text-indigo-400 font-bold">audited_mis_summary</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendor, invoice, PO..."
                className={`rounded-xl border pl-8 pr-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                  isDark
                    ? 'border-slate-800 bg-slate-950 text-slate-200'
                    : 'border-slate-300 bg-slate-50 text-slate-800'
                }`}
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`rounded-xl border px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
                isDark
                  ? 'border-slate-800 bg-slate-950 text-slate-300'
                  : 'border-slate-300 bg-slate-50 text-slate-700'
              }`}
            >
              <option value="all">All Audit Statuses</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="OVERCHARGED">OVERCHARGED</option>
              <option value="DUPLICATE">DUPLICATE</option>
              <option value="MISSING PO">MISSING PO</option>
            </select>
          </div>
        </div>

        <div
          className={`overflow-x-auto rounded-xl border ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50/50 border-slate-200'
          }`}
        >
          <table className="w-full text-left text-xs">
            <thead className={isDark ? 'bg-slate-900 text-slate-400 border-b border-slate-800' : 'bg-slate-100 text-slate-600 border-b border-slate-200'}>
              <tr>
                <th
                  onClick={() => {
                    setSortField('invoice_number');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 pl-3 cursor-pointer hover:underline"
                >
                  <div className="flex items-center gap-1 font-bold">
                    <span>Invoice #</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 font-bold">PO Number</th>
                <th
                  onClick={() => {
                    setSortField('vendor_name');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 cursor-pointer hover:underline font-bold"
                >
                  <div className="flex items-center gap-1">
                    <span>Vendor Name</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 font-bold">Invoice Date</th>
                <th className="py-3 text-right font-bold">Subtotal</th>
                <th
                  onClick={() => {
                    setSortField('total_amount_due');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 text-right cursor-pointer hover:underline font-bold"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Due</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 pr-3 text-right font-bold">Audit Status</th>
              </tr>
            </thead>
            <tbody className={`divide-y font-mono ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-200 text-slate-700'}`}>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, i) => (
                  <tr key={i} className={isDark ? 'hover:bg-slate-900/60' : 'hover:bg-white'}>
                    <td className="py-3 pl-3 font-bold">{r.invoice_number}</td>
                    <td className="py-3 font-sans">
                      {r.po_number && r.po_number !== 'MISSING' ? (
                        <span className="font-semibold text-indigo-600 dark:text-indigo-400">{r.po_number}</span>
                      ) : (
                        <span className="rounded bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40">
                          MISSING PO
                        </span>
                      )}
                    </td>
                    <td className="py-3 font-sans font-medium">{r.vendor_name}</td>
                    <td className="py-3 text-slate-500">{r.invoice_date}</td>
                    <td className="py-3 text-right">${r.subtotal.toFixed(2)}</td>
                    <td className="py-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ${r.total_amount_due.toFixed(2)}
                    </td>
                    <td className="py-3 pr-3 text-right">{getStatusBadge(r.audit_status)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
