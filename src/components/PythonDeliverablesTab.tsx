import React, { useState } from 'react';
import { FileCode, Download, Copy, Check, Terminal, ExternalLink, CheckCircle } from 'lucide-react';

export const PythonDeliverablesTab: React.FC = () => {
  const [activeFile, setActiveFile] = useState<'app.py' | 'requirements.txt' | 'README.md'>('app.py');
  const [copied, setCopied] = useState<boolean>(false);

  // App.py content excerpt for display and download
  const appPyContent = `"""
AutoExtract MIS & Executive Control Tower
Production-Grade Streamlit Application
Tech Stack: Streamlit, DuckDB, Google Gemini Flash API, pdfplumber, Pandas, Plotly Express
"""

import os
import io
import json
import re
from datetime import datetime, date
import streamlit as st
import pandas as pd
import duckdb
import plotly.express as px
import plotly.graph_objects as go
from dotenv import load_dotenv

# Try importing google-genai
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# Try importing pdfplumber
try:
    import pdfplumber
    PDFPLUMBER_AVAILABLE = True
except ImportError:
    PDFPLUMBER_AVAILABLE = False

load_dotenv()

# Streamlit Page Configuration
st.set_page_config(
    page_title="AutoExtract MIS & Executive Control Tower",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Executive Dark Theme CSS
CUSTOM_CSS = \"\"\"
<style>
    .stApp {
        background-color: #0B0F19;
        color: #F8FAFC;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    .header-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.25rem 1.75rem;
        background: linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.8));
        backdrop-filter: blur(12px);
        border: 1px solid rgba(99, 102, 241, 0.2);
        border-radius: 14px;
        margin-bottom: 1.5rem;
    }
    .status-badge {
        padding: 6px 14px;
        border-radius: 9999px;
        font-size: 0.82rem;
        font-weight: 600;
    }
    .badge-duckdb {
        background: rgba(245, 158, 11, 0.15);
        color: #FBBF24;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }
    .kpi-card {
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.75));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1.25rem 1.5rem;
    }
</style>
\"\"\"
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# Full code is saved in /app.py in project root.
`;

  const requirementsContent = `streamlit>=1.38.0
pdfplumber>=0.11.0
duckdb>=1.1.0
google-genai>=1.0.0
pandas>=2.2.0
plotly>=5.24.0
openpyxl>=3.1.5
python-dotenv>=1.0.1
pyarrow>=17.0.0
`;

  const readmeContent = `# 🚀 AutoExtract MIS & Executive Control Tower

> **Production-grade automated unstructured document extraction, DuckDB SQL data hygiene validation, and Executive MIS analytics dashboard.**

### Quickstart Guide:
\`\`\`bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure .env with your Gemini API key
echo 'GEMINI_API_KEY="your-key-here"' > .env

# 3. Launch the Streamlit application
streamlit run app.py
\`\`\`

### Architecture:
1. pdfplumber -> Local Layout Parsing & Text Bounding Boxes
2. Gemini 3.8/2.5 Flash -> Strict JSON Schema Extraction
3. DuckDB In-Memory -> SQL Hygiene Validation (calc_total_mismatch, duplicate_check, null_check)
4. Plotly Express -> Executive MIS Visualizations
`;

  const getFileContent = () => {
    if (activeFile === 'app.py') return appPyContent;
    if (activeFile === 'requirements.txt') return requirementsContent;
    return readmeContent;
  };

  const handleDownload = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
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
      <div className="rounded-2xl border border-indigo-500/20 bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90 p-5 shadow-xl backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <FileCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Streamlit Python Deliverables & Quickstart</h2>
              <p className="text-xs text-slate-400">
                Created in the project root: <code className="text-indigo-400 font-bold">app.py</code>, <code className="text-indigo-400 font-bold">requirements.txt</code>, and <code className="text-indigo-400 font-bold">README.md</code>.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload('app.py', appPyContent)}
              className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-500 transition-all shadow-md"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download app.py</span>
            </button>
            <button
              onClick={() => handleDownload('requirements.txt', requirementsContent)}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>requirements.txt</span>
            </button>
          </div>
        </div>
      </div>

      {/* Terminal Command Quickstart */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/70 p-5 shadow-xl backdrop-blur-md space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
          <Terminal className="h-4 w-4" />
          <span>Local Python Execution Steps</span>
        </div>
        <div className="rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 border border-slate-800 space-y-1">
          <p className="text-slate-500"># 1. Install Streamlit, DuckDB, Gemini SDK, pdfplumber</p>
          <p className="text-indigo-300 font-semibold">pip install -r requirements.txt</p>
          <p className="text-slate-500 pt-2"># 2. Set your Google Gemini API key</p>
          <p className="text-indigo-300 font-semibold">export GEMINI_API_KEY="your-gemini-key"</p>
          <p className="text-slate-500 pt-2"># 3. Launch Streamlit Executive MIS Application</p>
          <p className="text-emerald-400 font-bold">streamlit run app.py</p>
        </div>
      </div>

      {/* File Viewer */}
      <div className="rounded-2xl border border-white/5 bg-slate-900/80 p-5 shadow-xl backdrop-blur-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            {(['app.py', 'requirements.txt', 'README.md'] as const).map((fname) => (
              <button
                key={fname}
                onClick={() => setActiveFile(fname)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                  activeFile === fname
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                }`}
              >
                {fname}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:text-white transition-all"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Code'}</span>
            </button>
            <button
              onClick={() => handleDownload(activeFile, getFileContent())}
              className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:text-white transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download</span>
            </button>
          </div>
        </div>

        <pre className="max-h-96 overflow-auto rounded-xl bg-slate-950 p-4 font-mono text-xs text-slate-300 border border-slate-800 leading-relaxed">
          {getFileContent()}
        </pre>
      </div>
    </div>
  );
};
