import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  PieChart as PieChartIcon,
  BarChart3,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  FileQuestion,
  ChevronDown,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import { CleanedMISRecord, FlattenedRow } from '../types';

interface ExecutiveDashboardTabProps {
  cleanedSummary: CleanedMISRecord[];
  rawInvoices: FlattenedRow[];
}

export const ExecutiveDashboardTab: React.FC<ExecutiveDashboardTabProps> = ({
  cleanedSummary,
  rawInvoices,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof CleanedMISRecord>('total_amount_due');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // 1. Spend Velocity Timeline aggregation
  const timelineData = useMemo(() => {
    const map = new Map<string, number>();
    cleanedSummary.forEach((inv) => {
      const d = inv.invoice_date && inv.invoice_date !== '1970-01-01' ? inv.invoice_date : '2026-03-15';
      map.set(d, (map.get(d) || 0) + inv.total_amount_due);
    });

    return Array.from(map.entries())
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [cleanedSummary]);

  // Max spend for timeline scaling
  const maxTimelineAmount = useMemo(() => {
    return Math.max(...timelineData.map((d) => d.amount), 100);
  }, [timelineData]);

  // 2. Vendor Concentration aggregation
  const vendorBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    cleanedSummary.forEach((inv) => {
      const v = inv.vendor_name || 'Unknown';
      map.set(v, (map.get(v) || 0) + inv.total_amount_due);
    });

    const total = Array.from(map.values()).reduce((a, b) => a + b, 0);

    return Array.from(map.entries())
      .map(([vendor, spend]) => ({
        vendor,
        spend,
        percentage: total > 0 ? (spend / total) * 100 : 0,
      }))
      .sort((a, b) => b.spend - a.spend);
  }, [cleanedSummary]);

  // 3. Line-item category breakdown
  const lineItemCategories = useMemo(() => {
    const map = new Map<string, number>();
    rawInvoices.forEach((row) => {
      const cat = row.item_description.slice(0, 32);
      map.set(cat, (map.get(cat) || 0) + row.line_item_total);
    });

    return Array.from(map.entries())
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [rawInvoices]);

  const maxCategoryAmount = useMemo(() => {
    return Math.max(...lineItemCategories.map((c) => c.amount), 100);
  }, [lineItemCategories]);

  // Filtered & Sorted MIS Table
  const filteredRecords = useMemo(() => {
    return cleanedSummary
      .filter((rec) => {
        const matchesSearch =
          rec.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
          rec.vendor_name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus =
          statusFilter === 'all' || rec.audit_status === statusFilter;
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
  }, [cleanedSummary, searchTerm, statusFilter, sortField, sortAsc]);

  const getStatusBadge = (status: CleanedMISRecord['audit_status']) => {
    switch (status) {
      case 'Verified Clean':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-300">
            <CheckCircle2 className="h-3 w-3" /> Clean
          </span>
        );
      case 'Calc Mismatch Flag':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/30 bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-rose-300">
            <AlertOctagon className="h-3 w-3" /> Math Mismatch
          </span>
        );
      case 'Duplicate Flag':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-300">
            <AlertTriangle className="h-3 w-3" /> Duplicate
          </span>
        );
      case 'Missing Critical Metadata':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-purple-300">
            <FileQuestion className="h-3 w-3" /> Null Field
          </span>
        );
    }
  };

  const colors = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#3B82F6'];

  return (
    <div className="space-y-6">
      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Chart 1: Spend Velocity Timeline */}
        <div className="lg:col-span-7 rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Spend Velocity Timeline</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Cash Outflow Run-rate</span>
          </div>

          {timelineData.length === 0 ? (
            <div className="py-16 text-center text-xs text-slate-500">No timeline data available</div>
          ) : (
            <div className="space-y-3">
              <div className="h-48 flex items-end gap-3 pt-6 pb-2 px-2 border-b border-slate-800">
                {timelineData.map((d, i) => {
                  const heightPercent = Math.max((d.amount / maxTimelineAmount) * 100, 12);
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center group relative h-full justify-end">
                      {/* Tooltip */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-indigo-500/50 rounded-lg px-2 py-1 text-[10px] text-white whitespace-nowrap z-20 pointer-events-none shadow-xl">
                        {d.date}: ${d.amount.toLocaleString()}
                      </div>
                      <div
                        style={{ height: `${heightPercent}%` }}
                        className="w-full rounded-t-lg bg-gradient-to-t from-indigo-600 to-indigo-400/80 transition-all duration-300 group-hover:brightness-125"
                      />
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] font-mono text-slate-400 px-2">
                {timelineData.map((d, i) => (
                  <span key={i} className="truncate max-w-[70px]">
                    {d.date.replace('2026-', '')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Vendor Concentration Donut / Bars */}
        <div className="lg:col-span-5 rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Vendor Spend Concentration</h3>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Share of Total</span>
          </div>

          <div className="space-y-3">
            {vendorBreakdown.slice(0, 5).map((v, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300 truncate max-w-[180px]">{v.vendor}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 font-mono">{v.percentage.toFixed(1)}%</span>
                    <span className="text-white font-bold font-mono">${v.spend.toLocaleString()}</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{
                      width: `${v.percentage}%`,
                      backgroundColor: colors[idx % colors.length],
                    }}
                    className="h-full rounded-full transition-all duration-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Line Item Spend Breakdown */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Top Line-Item Spend Categories</h3>
          </div>
          <span className="text-[11px] text-slate-400">DuckDB Aggregated Line Items</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {lineItemCategories.map((item, idx) => {
            const widthPct = Math.min((item.amount / maxCategoryAmount) * 100, 100);
            return (
              <div key={idx} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300 truncate font-medium" title={item.category}>
                    {item.category}
                  </span>
                  <span className="font-bold text-emerald-400 font-mono">
                    ${item.amount.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${widthPct}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Executive Cleaned MIS Table */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Executive MIS Control Tower Data Table
            </h3>
            <p className="text-xs text-slate-400">
              Cleaned summary exposed via <code className="text-indigo-400">cleaned_mis_summary</code> with DuckDB audit badges.
            </p>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search vendor or invoice..."
                className="rounded-xl border border-slate-800 bg-slate-950 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="Verified Clean">Verified Clean</option>
              <option value="Calc Mismatch Flag">Math Mismatch Flag</option>
              <option value="Duplicate Flag">Duplicate Flag</option>
              <option value="Missing Critical Metadata">Null Metadata Flag</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400">
              <tr>
                <th
                  onClick={() => {
                    setSortField('invoice_number');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 pl-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Invoice #</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th
                  onClick={() => {
                    setSortField('vendor_name');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 cursor-pointer hover:text-white"
                >
                  <div className="flex items-center gap-1">
                    <span>Vendor</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3">Invoice Date</th>
                <th className="py-3">Due Date</th>
                <th className="py-3 text-center">Items</th>
                <th className="py-3 text-right">Items Sum</th>
                <th
                  onClick={() => {
                    setSortField('total_amount_due');
                    setSortAsc(!sortAsc);
                  }}
                  className="py-3 text-right cursor-pointer hover:text-white"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Total Due</span>
                    <ArrowUpDown className="h-3 w-3" />
                  </div>
                </th>
                <th className="py-3 pr-3 text-right">DuckDB Audit Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No matching invoices found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-900/60 transition-colors">
                    <td className="py-3 pl-3 font-bold text-white">{r.invoice_number}</td>
                    <td className="py-3 font-sans text-slate-200">{r.vendor_name}</td>
                    <td className="py-3 text-slate-400">{r.invoice_date}</td>
                    <td className="py-3 text-slate-400">{r.due_date}</td>
                    <td className="py-3 text-center">
                      <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-300">
                        {r.item_count}
                      </span>
                    </td>
                    <td className="py-3 text-right text-slate-400">${r.items_sum.toFixed(2)}</td>
                    <td className="py-3 text-right font-bold text-emerald-400">
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
