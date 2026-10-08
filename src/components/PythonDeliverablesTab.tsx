import React, { useState } from 'react';
import { FileCode, Download, Copy, Check, Terminal } from 'lucide-react';

interface PythonDeliverablesTabProps {
  theme: 'light' | 'dark';
}

export const PythonDeliverablesTab: React.FC<PythonDeliverablesTabProps> = ({ theme }) => {
  const isDark = theme === 'dark';
  const [activeFile, setActiveFile] = useState<'app.py' | 'requirements.txt' | 'README.md'>('app.py');
  const [copied, setCopied] = useState<boolean>(false);

  const appPyContent = `"""
AutoExtract MIS & Executive Control Tower
Automated Supplier Invoice Reconciliation & MIS Audit Engine
Features: Sleek Light Theme by default with Circular Sun/Moon Toggle, 4 DuckDB Audit Checks
"""

import os
import io
import json
from datetime import datetime, date
import streamlit as st
import pandas as pd
import duckdb
import plotly.express as px
from dotenv import load_dotenv

# Run locally with: streamlit run app.py
# Complete code is saved directly in /app.py in project root.
`;

  const requirementsContent = `streamlit>=1.38.0
pdfplumber>=0.11.0
duckdb>=1.1.0
google-genai>=1.0.0
pandas>=2.2.0
plotly>=5.24.0
openpyxl>=3.1.5
pyarrow>=17.0.0
python-dotenv>=1.0.1
`;

  const readmeContent = `# 🚀 AutoExtract MIS & Executive Control Tower
## Automated Supplier Invoice Reconciliation & Financial Leakage Audit Engine

### 4 Automated DuckDB Audit Rules:
1. Overcharge Check: (quantity * unit_price) != line_total
2. Duplicate Invoice Flag: Identical vendor_name + invoice_number
3. Tax Calculation Validation: subtotal * (tax_rate / 100) != tax_amount
4. Missing PO Number Flag: Null or blank po_number

### Quickstart Commands:
\`\`\`bash
pip install -r requirements.txt
export GEMINI_API_KEY="your-gemini-key"
streamlit run app.py
\`\`\`
`;

  const getFileContent = () => {
    if (activeFile === 'app.py') return appPyContent;
    if (activeFile === 'requirements.txt') return requirementsContent;
    return readmeContent;
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getFileContent());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div
        className={`rounded-2xl border p-5 shadow-sm transition-all ${
          isDark
            ? 'bg-slate-900/90 border-slate-800 text-white'
            : 'bg-white border-slate-200/90 text-slate-900'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-10 w-10 items-center justify-center rounded-xl border ${
                isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-200 text-indigo-600'
              }`}
            >
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Python Streamlit Deliverables (Single-File app.py)</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Refactored with Sleek Light Theme by default, circular Sun/Moon toggle, and 4 DuckDB audit checks.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload('app.py', appPyContent)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download app.py</span>
            </button>
            <button
              onClick={() => handleDownload('requirements.txt', requirementsContent)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium ${
                isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>requirements.txt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Steps */}
      <div
        className={`rounded-2xl border p-5 shadow-sm space-y-3 transition-all ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <Terminal className="h-4 w-4" />
          <span>Local Python Streamlit Execution Commands</span>
        </div>
        <div
          className={`rounded-xl p-4 font-mono text-xs space-y-1 border ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}
        >
          <p className="text-slate-500"># 1. Install dependencies</p>
          <p className="text-indigo-400 font-semibold">pip install -r requirements.txt</p>
          <p className="text-slate-500 pt-2"># 2. Set your Google Gemini API key</p>
          <p className="text-indigo-400 font-semibold">export GEMINI_API_KEY="your-gemini-key"</p>
          <p className="text-slate-500 pt-2"># 3. Launch Streamlit Executive Application</p>
          <p className="text-emerald-400 font-bold">streamlit run app.py</p>
        </div>
      </div>

      {/* File Viewer */}
      <div
        className={`rounded-2xl border p-5 shadow-sm space-y-4 transition-all ${
          isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200/90'
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {(['app.py', 'requirements.txt', 'README.md'] as const).map((fname) => (
              <button
                key={fname}
                onClick={() => setActiveFile(fname)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeFile === fname
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : isDark
                    ? 'bg-slate-800 text-slate-400 hover:text-white'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                }`}
              >
                {fname}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1 rounded-lg border px-3 py-1 text-xs ${
                isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              onClick={() => handleDownload(activeFile, getFileContent())}
              className={`flex items-center gap-1 rounded-lg border px-3 py-1 text-xs ${
                isDark ? 'border-slate-700 bg-slate-800 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'
              }`}
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <pre
          className={`max-h-80 overflow-auto rounded-xl p-4 font-mono text-xs border ${
            isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}
        >
          {getFileContent()}
        </pre>
      </div>
    </div>
  );
};
