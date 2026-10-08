"""
AutoExtract MIS & Executive Control Tower
Automated Supplier Invoice Reconciliation & MIS Audit Engine
Tech Stack: Streamlit, DuckDB, Google Gemini Flash API, pdfplumber, Pandas, Plotly Express
Features: High-Contrast Light Theme by default with Circular Sun/Moon Toggle, 4 DuckDB Audit Checks
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

# Load environment variables
load_dotenv()

# Streamlit Page Configuration
st.set_page_config(
    page_title="AutoExtract MIS & Executive Control Tower",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Initialize Session State for Theme (Default: 'light')
if "theme_mode" not in st.session_state:
    st.session_state["theme_mode"] = "light"

# Theme Toggle Helper
def toggle_theme():
    if st.session_state["theme_mode"] == "light":
        st.session_state["theme_mode"] = "dark"
    else:
        st.session_state["theme_mode"] = "light"

is_dark = st.session_state["theme_mode"] == "dark"

# Dynamic CSS Styling: Light Theme by default vs Dark Theme
if not is_dark:
    # SLEEK HIGH-CONTRAST LIGHT THEME
    THEME_CSS = """
    <style>
        .stApp {
            background-color: #F8FAFC;
            color: #0F172A;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        /* Header Container */
        .header-container {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 1.25rem 1.75rem;
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 16px;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 12px -2px rgba(15, 23, 42, 0.05);
        }
        
        .header-title {
            color: #0F172A;
            font-weight: 800;
            font-size: 1.6rem;
            margin: 0;
            letter-spacing: -0.02em;
        }
        .header-subtitle {
            color: #64748B;
            font-size: 0.85rem;
            margin-top: 4px;
        }

        /* KPI Cards */
        .kpi-card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 14px;
            padding: 1.35rem 1.5rem;
            box-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.04);
            transition: all 0.2s ease;
        }
        .kpi-card:hover {
            border-color: #CBD5E1;
            box-shadow: 0 8px 16px -4px rgba(15, 23, 42, 0.08);
            transform: translateY(-2px);
        }
        .kpi-label {
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #64748B;
            font-weight: 700;
        }
        .kpi-value {
            font-size: 2.1rem;
            font-weight: 800;
            color: #0F172A;
            line-height: 1.2;
            margin-top: 0.4rem;
        }
        .kpi-sub {
            font-size: 0.78rem;
            color: #059669;
            margin-top: 0.4rem;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 4px;
        }

        /* Status Badges */
        .badge-duckdb {
            background: #FEF3C7;
            color: #B45309;
            border: 1px solid #FDE68A;
            padding: 5px 12px;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .badge-gemini {
            background: #EEF2FF;
            color: #4F46E5;
            border: 1px solid #C7D2FE;
            padding: 5px 12px;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 600;
        }

        /* Containers & Sections */
        .panel-box {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            border-radius: 14px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px -2px rgba(15, 23, 42, 0.04);
            margin-bottom: 1.25rem;
        }

        /* Tabs */
        .stTabs [data-baseweb="tab-list"] {
            gap: 8px;
            background-color: #F1F5F9;
            padding: 6px;
            border-radius: 12px;
            border: 1px solid #E2E8F0;
        }
        .stTabs [data-baseweb="tab"] {
            border-radius: 8px;
            color: #64748B;
            font-weight: 600;
            padding: 8px 16px;
            background: transparent;
        }
        .stTabs [aria-selected="true"] {
            background-color: #FFFFFF !important;
            color: #4F46E5 !important;
            box-shadow: 0 2px 6px rgba(15, 23, 42, 0.08);
        }
    </style>
    """
    PLOTLY_TEMPLATE = "plotly_white"
else:
    # EXECUTIVE DARK THEME
    THEME_CSS = """
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
            background: #111827;
            border: 1px solid rgba(99, 102, 241, 0.2);
            border-radius: 16px;
            margin-bottom: 1.5rem;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
        }
        .header-title {
            color: #FFFFFF;
            font-weight: 800;
            font-size: 1.6rem;
            margin: 0;
            letter-spacing: -0.02em;
        }
        .header-subtitle {
            color: #94A3B8;
            font-size: 0.85rem;
            margin-top: 4px;
        }
        .kpi-card {
            background: #111827;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 1.35rem 1.5rem;
            box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.4);
            transition: all 0.2s ease;
        }
        .kpi-card:hover {
            border-color: rgba(99, 102, 241, 0.4);
            transform: translateY(-2px);
        }
        .kpi-label {
            font-size: 0.78rem;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #94A3B8;
            font-weight: 700;
        }
        .kpi-value {
            font-size: 2.1rem;
            font-weight: 800;
            color: #F8FAFC;
            line-height: 1.2;
            margin-top: 0.4rem;
        }
        .kpi-sub {
            font-size: 0.78rem;
            color: #34D399;
            margin-top: 0.4rem;
            font-weight: 600;
        }
        .badge-duckdb {
            background: rgba(245, 158, 11, 0.15);
            color: #FBBF24;
            border: 1px solid rgba(245, 158, 11, 0.3);
            padding: 5px 12px;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .badge-gemini {
            background: rgba(99, 102, 241, 0.15);
            color: #818CF8;
            border: 1px solid rgba(99, 102, 241, 0.35);
            padding: 5px 12px;
            border-radius: 9999px;
            font-size: 0.8rem;
            font-weight: 600;
        }
        .panel-box {
            background: #111827;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 14px;
            padding: 1.5rem;
            margin-bottom: 1.25rem;
        }
        .stTabs [data-baseweb="tab-list"] {
            gap: 8px;
            background-color: #0F172A;
            padding: 6px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .stTabs [data-baseweb="tab"] {
            border-radius: 8px;
            color: #94A3B8;
            font-weight: 600;
            padding: 8px 16px;
        }
        .stTabs [aria-selected="true"] {
            background-color: #6366F1 !important;
            color: #FFFFFF !important;
        }
    </style>
    """
    PLOTLY_TEMPLATE = "plotly_dark"

st.markdown(THEME_CSS, unsafe_allow_html=True)

# Strict Supplier Schema for Gemini Flash Extraction
SUPPLIER_SCHEMA_JSON = {
    "type": "OBJECT",
    "properties": {
        "invoice_number": {"type": "STRING"},
        "po_number": {"type": "STRING", "description": "Purchase order number or null if missing"},
        "vendor_name": {"type": "STRING"},
        "invoice_date": {"type": "STRING", "description": "YYYY-MM-DD"},
        "due_date": {"type": "STRING", "description": "YYYY-MM-DD"},
        "currency": {"type": "STRING"},
        "subtotal": {"type": "NUMBER"},
        "tax_rate": {"type": "NUMBER", "description": "Percentage tax rate e.g. 10.0"},
        "tax_amount": {"type": "NUMBER"},
        "total_amount_due": {"type": "NUMBER"},
        "line_items": {
            "type": "ARRAY",
            "items": {
                "type": "OBJECT",
                "properties": {
                    "item_description": {"type": "STRING"},
                    "quantity": {"type": "NUMBER"},
                    "unit_price": {"type": "NUMBER"},
                    "total_amount": {"type": "NUMBER"}
                },
                "required": ["item_description", "quantity", "unit_price", "total_amount"]
            }
        }
    },
    "required": ["invoice_number", "vendor_name", "invoice_date", "subtotal", "tax_amount", "total_amount_due", "line_items"]
}

# Pre-loaded Enterprise Supplier Test Invoices with Intentional Audit Discrepancies
DEFAULT_SUPPLIER_INVOICES = [
    {
        "invoice_number": "INV-2026-9081",
        "po_number": "PO-88102",
        "vendor_name": "Apex Cloud Systems",
        "invoice_date": "2026-03-12",
        "due_date": "2026-04-11",
        "currency": "USD",
        "subtotal": 3200.00,
        "tax_rate": 10.0,
        "tax_amount": 320.00,
        "total_amount_due": 3520.00,
        "line_items": [
            {"item_description": "Dedicated Kubernetes Tier-3 Cluster", "quantity": 1.0, "unit_price": 2400.00, "total_amount": 2400.00},
            {"item_description": "Global Load Balancer & WAF", "quantity": 2.0, "unit_price": 400.00, "total_amount": 800.00}
        ]
    },
    {
        "invoice_number": "DISC-7714",
        "po_number": "PO-99120",
        "vendor_name": "Vortex Hardware & Cabling",
        "invoice_date": "2026-03-22",
        "due_date": "2026-04-05",
        "currency": "USD",
        "subtotal": 1750.00,
        "tax_rate": 10.0,
        "tax_amount": 175.00,
        "total_amount_due": 1925.00,
        "line_items": [
            # INTENTIONAL OVERCHARGE: 5 units * $250 should be $1250, but supplier billed $1750 (+$500 leakage!)
            {"item_description": "Cat6a Shielded Solid Bulk Patch Cable Spool 1000ft", "quantity": 5.0, "unit_price": 250.00, "total_amount": 1750.00}
        ]
    },
    {
        "invoice_number": "INV-2026-9081", # INTENTIONAL DUPLICATE BILLING
        "po_number": "PO-88102",
        "vendor_name": "Apex Cloud Systems",
        "invoice_date": "2026-03-12",
        "due_date": "2026-04-11",
        "currency": "USD",
        "subtotal": 3200.00,
        "tax_rate": 10.0,
        "tax_amount": 320.00,
        "total_amount_due": 3520.00,
        "line_items": [
            {"item_description": "Dedicated Kubernetes Tier-3 Cluster", "quantity": 1.0, "unit_price": 2400.00, "total_amount": 2400.00}
        ]
    },
    {
        "invoice_number": "TAX-ERR-304",
        "po_number": "PO-44109",
        "vendor_name": "Pacific Freight Logistics",
        "invoice_date": "2026-03-25",
        "due_date": "2026-04-15",
        "currency": "USD",
        "subtotal": 4000.00,
        "tax_rate": 5.0,
        "tax_amount": 600.00, # INTENTIONAL TAX ERROR: 5% of 4000 is 200, but billed 600 (+$400 leakage!)
        "total_amount_due": 4600.00,
        "line_items": [
            {"item_description": "Priority Airfreight Drayage Services", "quantity": 2.0, "unit_price": 2000.00, "total_amount": 4000.00}
        ]
    },
    {
        "invoice_number": "ROGUE-PO-909",
        "po_number": None, # INTENTIONAL MISSING PO NUMBER (UNAPPROVED PROCUREMENT)
        "vendor_name": "Quantum Office Supplies",
        "invoice_date": "2026-03-28",
        "due_date": "2026-04-10",
        "currency": "USD",
        "subtotal": 1200.00,
        "tax_rate": 8.0,
        "tax_amount": 96.00,
        "total_amount_due": 1296.00,
        "line_items": [
            {"item_description": "Executive Ergonomic Office Chairs", "quantity": 4.0, "unit_price": 300.00, "total_amount": 1200.00}
        ]
    },
    {
        "invoice_number": "CYBER-5501",
        "po_number": "PO-77291",
        "vendor_name": "CyberShield Defense Corp",
        "invoice_date": "2026-03-30",
        "due_date": "2026-04-29",
        "currency": "USD",
        "subtotal": 5400.00,
        "tax_rate": 0.0,
        "tax_amount": 0.00,
        "total_amount_due": 5400.00,
        "line_items": [
            {"item_description": "Zero Trust Enterprise Licenses Tier-1", "quantity": 60.0, "unit_price": 90.00, "total_amount": 5400.00}
        ]
    }
]

# Session state initialization
if "supplier_invoices" not in st.session_state:
    st.session_state["supplier_invoices"] = DEFAULT_SUPPLIER_INVOICES.copy()

if "duckdb_conn" not in st.session_state:
    st.session_state["duckdb_conn"] = duckdb.connect(database=":memory:")

# Helper: Extract PDF content using pdfplumber
def extract_pdf_with_pdfplumber(file_bytes):
    if not PDFPLUMBER_AVAILABLE:
        return "pdfplumber not installed. Please install requirements.txt", []
    extracted = []
    tables_list = []
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for idx, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                extracted.append(f"--- Page {idx + 1} ---\n{text}")
                t = page.extract_tables()
                if t:
                    tables_list.extend(t)
        return "\n\n".join(extracted), tables_list
    except Exception as e:
        return f"PDF layout extraction error: {e}", []

# Helper: Extract via Gemini Flash API
def extract_via_gemini_flash(raw_text: str, api_key: str):
    if not api_key:
        return None, "Gemini API key missing. Please provide GEMINI_API_KEY."
    if not GENAI_AVAILABLE:
        return None, "google-genai SDK not installed."

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
You are a Principal Financial Auditor. Parse the supplier invoice into this exact strict JSON structure:
- invoice_number (string)
- po_number (string or null)
- vendor_name (string)
- invoice_date (YYYY-MM-DD or null)
- due_date (YYYY-MM-DD or null)
- currency (e.g. USD)
- subtotal (float)
- tax_rate (float percentage)
- tax_amount (float)
- total_amount_due (float)
- line_items: array of objects with keys: item_description (str), quantity (float), unit_price (float), total_amount (float)

Raw Invoice Text:
{raw_text}
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json")
        )
        return json.loads(response.text), None
    except Exception as e:
        return None, str(e)

# Flatten invoices into DataFrame for DuckDB
def prepare_duckdb_tables(invoices_list):
    rows = []
    for inv in invoices_list:
        inv_no = inv.get("invoice_number", "UNKNOWN")
        po_no = inv.get("po_number")
        vendor = inv.get("vendor_name", "UNKNOWN")
        inv_date = inv.get("invoice_date")
        due_date = inv.get("due_date")
        currency = inv.get("currency", "USD")
        subtotal = float(inv.get("subtotal", 0.0) or 0.0)
        tax_rate = float(inv.get("tax_rate", 0.0) or 0.0)
        tax_amt = float(inv.get("tax_amount", 0.0) or 0.0)
        tot_due = float(inv.get("total_amount_due", 0.0) or 0.0)

        items = inv.get("line_items", [])
        if not items:
            rows.append({
                "invoice_number": inv_no,
                "po_number": po_no,
                "vendor_name": vendor,
                "invoice_date": inv_date,
                "due_date": due_date,
                "currency": currency,
                "subtotal": subtotal,
                "tax_rate": tax_rate,
                "tax_amount": tax_amt,
                "item_description": "General Item",
                "quantity": 1.0,
                "unit_price": tot_due,
                "line_item_total": tot_due,
                "total_amount_due": tot_due
            })
        else:
            for itm in items:
                q = float(itm.get("quantity", 1.0) or 1.0)
                p = float(itm.get("unit_price", 0.0) or 0.0)
                tot = float(itm.get("total_amount", q * p) or (q * p))
                rows.append({
                    "invoice_number": inv_no,
                    "po_number": po_no,
                    "vendor_name": vendor,
                    "invoice_date": inv_date,
                    "due_date": due_date,
                    "currency": currency,
                    "subtotal": subtotal,
                    "tax_rate": tax_rate,
                    "tax_amount": tax_amt,
                    "item_description": itm.get("item_description", "Item"),
                    "quantity": q,
                    "unit_price": p,
                    "line_item_total": tot,
                    "total_amount_due": tot_due
                })
    return pd.DataFrame(rows)

# Synchronize DuckDB In-Memory Views
def refresh_duckdb(conn, df):
    conn.execute("DROP VIEW IF EXISTS audited_mis_summary;")
    conn.execute("DROP TABLE IF EXISTS invoices;")
    conn.register("invoices_df", df)
    conn.execute("CREATE TABLE invoices AS SELECT * FROM invoices_df;")

    # Create Audited MIS Summary View
    conn.execute("""
        CREATE VIEW audited_mis_summary AS
        SELECT 
            invoice_number,
            vendor_name,
            COALESCE(po_number, 'MISSING') AS po_number,
            COALESCE(invoice_date, '1970-01-01') AS invoice_date,
            due_date,
            currency,
            COUNT(item_description) AS item_count,
            MAX(subtotal) AS subtotal,
            MAX(tax_amount) AS tax_amount,
            MAX(total_amount_due) AS total_amount_due,
            CASE 
                WHEN po_number IS NULL OR TRIM(po_number) = '' THEN 'MISSING PO'
                WHEN ABS(SUM(line_item_total) - MAX(subtotal)) > 0.05 THEN 'OVERCHARGED'
                ELSE 'VERIFIED'
            END AS audit_status
        FROM invoices
        GROUP BY invoice_number, vendor_name, po_number, invoice_date, due_date, currency;
    """)

# Execute 4 DuckDB Financial Audit Checks
def run_four_audit_checks(conn):
    # 1. Overcharge Check
    overcharges_df = conn.execute("""
        SELECT 
            invoice_number, 
            vendor_name, 
            item_description, 
            quantity, 
            unit_price, 
            line_item_total,
            ROUND(quantity * unit_price, 2) AS expected_line_total,
            ROUND(line_item_total - (quantity * unit_price), 2) AS overcharge_amount
        FROM invoices
        WHERE (line_item_total - (quantity * unit_price)) > 0.02;
    """).fetchdf()

    # 2. Duplicate Check
    duplicates_df = conn.execute("""
        SELECT 
            invoice_number, 
            vendor_name, 
            COUNT(*) AS duplicate_count,
            ROUND(MAX(total_amount_due), 2) AS potential_double_pay_amount
        FROM (
            SELECT DISTINCT invoice_number, vendor_name, total_amount_due, invoice_date 
            FROM invoices
        )
        GROUP BY invoice_number, vendor_name
        HAVING COUNT(*) > 1;
    """).fetchdf()

    # 3. Tax Calculation Validation Check
    tax_errors_df = conn.execute("""
        SELECT 
            invoice_number, 
            vendor_name, 
            subtotal, 
            tax_rate, 
            tax_amount,
            ROUND(subtotal * (tax_rate / 100.0), 2) AS expected_tax,
            ROUND(ABS(tax_amount - (subtotal * (tax_rate / 100.0))), 2) AS tax_variance
        FROM (
            SELECT DISTINCT invoice_number, vendor_name, subtotal, tax_rate, tax_amount
            FROM invoices
        )
        WHERE ABS(tax_amount - (subtotal * (tax_rate / 100.0))) > 0.50;
    """).fetchdf()

    # 4. Missing PO Number Flag
    missing_pos_df = conn.execute("""
        SELECT 
            invoice_number, 
            vendor_name, 
            invoice_date, 
            total_amount_due,
            'Missing Purchase Order (Unapproved Spend)' AS compliance_risk
        FROM (
            SELECT DISTINCT invoice_number, vendor_name, po_number, invoice_date, total_amount_due
            FROM invoices
        )
        WHERE po_number IS NULL OR TRIM(po_number) = '' OR LOWER(po_number) IN ('none', 'null', 'n/a');
    """).fetchdf()

    return overcharges_df, duplicates_df, tax_errors_df, missing_pos_df

# Sync and evaluate
df_invoices = prepare_duckdb_tables(st.session_state["supplier_invoices"])
refresh_duckdb(st.session_state["duckdb_conn"], df_invoices)
overcharge_res, dup_res, tax_res, missing_po_res = run_four_audit_checks(st.session_state["duckdb_conn"])

# Calculate Financial Leakage KPIs
total_billed = df_invoices[["invoice_number", "total_amount_due"]].drop_duplicates()["total_amount_due"].sum() if not df_invoices.empty else 0.0

overcharge_leakage = overcharge_res["overcharge_amount"].sum() if not overcharge_res.empty else 0.0
tax_leakage = tax_res["tax_variance"].sum() if not tax_res.empty else 0.0
duplicate_leakage = dup_res["potential_double_pay_amount"].sum() if not dup_res.empty else 0.0
total_leakage = overcharge_leakage + tax_leakage + duplicate_leakage

unique_inv_count = len(st.session_state["supplier_invoices"])
discrepancy_invs = len(overcharge_res) + len(dup_res) + len(tax_res) + len(missing_po_res)
audit_pass_rate = max(0, min(100, int(((unique_inv_count - min(discrepancy_invs, unique_inv_count)) / max(unique_inv_count, 1)) * 100)))

# Top Overcharging Vendor
top_overcharger = "None"
if not overcharge_res.empty:
    top_overcharger = overcharge_res.groupby("vendor_name")["overcharge_amount"].sum().idxmax()

# ==========================================
# HEADER BAR WITH CIRCULAR SUN/MOON TOGGLE
# ==========================================
col_hdr_left, col_hdr_right = st.columns([0.82, 0.18])

with col_hdr_left:
    st.markdown(f"""
    <div class="header-container" style="margin-bottom: 0.75rem;">
        <div>
            <h1 class="header-title">⚡ AutoExtract MIS & Executive Control Tower</h1>
            <p class="header-subtitle">
                Automated Supplier Invoice Reconciliation, DuckDB Financial Leakage Engine & MIS Audit Tower
            </p>
        </div>
        <div style="display: flex; gap: 8px; align-items: center;">
            <span class="badge-duckdb">🗃️ DuckDB In-Memory</span>
            <span class="badge-gemini">✨ Gemini 2.5 Flash</span>
        </div>
    </div>
    """, unsafe_allow_html=True)

with col_hdr_right:
    # Circular Icon-Only Sun/Moon Toggle Button (No Text Label!)
    toggle_icon = "☀️" if is_dark else "🌙"
    toggle_help = "Switch to Light Mode" if is_dark else "Switch to Dark Mode"
    
    st.markdown("<div style='height: 10px;'></div>", unsafe_allow_html=True)
    if st.button(toggle_icon, key="theme_circle_toggle", help=toggle_help, use_container_width=True):
        toggle_theme()
        st.rerun()

# ==========================================
# FINANCIAL SUMMARY KPIS BAR
# ==========================================
kpi1, kpi2, kpi3, kpi4 = st.columns(4)

with kpi1:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-label">Total Billed Spend</div>
        <div class="kpi-value">${total_billed:,.2f}</div>
        <div class="kpi-sub">Across {unique_inv_count} Supplier Invoices</div>
    </div>
    """, unsafe_allow_html=True)

with kpi2:
    leak_color = "#DC2626" if total_leakage > 0 else "#059669"
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-label">Financial Leakage Identified</div>
        <div class="kpi-value" style="color: {leak_color};">${total_leakage:,.2f}</div>
        <div class="kpi-sub" style="color: {leak_color};">Overcharges + Tax + Duplicates</div>
    </div>
    """, unsafe_allow_html=True)

with kpi3:
    pass_color = "#059669" if audit_pass_rate >= 80 else "#D97706" if audit_pass_rate >= 50 else "#DC2626"
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-label">Audit Pass Rate</div>
        <div class="kpi-value" style="color: {pass_color};">{audit_pass_rate}%</div>
        <div class="kpi-sub" style="color: {pass_color};">{discrepancy_invs} Discrepancy Flags</div>
    </div>
    """, unsafe_allow_html=True)

with kpi4:
    st.markdown(f"""
    <div class="kpi-card">
        <div class="kpi-label">Top Overcharging Vendor</div>
        <div class="kpi-value" style="font-size: 1.4rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{top_overcharger}</div>
        <div class="kpi-sub" style="color: #6366F1;">Highest Math Variance</div>
    </div>
    """, unsafe_allow_html=True)

st.markdown("<div style='height: 1rem;'></div>", unsafe_allow_html=True)

# Main Tab Navigation
tab1, tab2, tab3, tab4 = st.tabs([
    "📄 Document Ingestion & Extraction Lab",
    "🗃️ DuckDB 4-Way Financial Audit Engine",
    "📊 MIS Analytics & Reconciliation Tower",
    "📥 Multi-Format Audit Exporter"
])

# ==========================================
# TAB 1: DUAL INGESTION & EXTRACTION LAB
# ==========================================
with tab1:
    st.markdown("### 📥 Ingest Supplier Invoices (PDF & Messy CSV)")
    col_in1, col_in2 = st.columns(2)

    with col_in1:
        st.markdown("#### 📄 Supplier PDF Document Parser")
        pdf_file = st.file_uploader("Upload Supplier Invoice PDF", type=["pdf"], key="st_pdf_upload")
        api_key = os.environ.get("GEMINI_API_KEY", "")

        if pdf_file:
            st.info(f"Loaded: `{pdf_file.name}` ({len(pdf_file.getvalue())} bytes)")
            if st.button("Parse Layout with pdfplumber & Extract via Gemini Flash", key="btn_run_pdf"):
                with st.spinner("Extracting bounding boxes and parsing schema with Gemini Flash..."):
                    raw_text, tables = extract_pdf_with_pdfplumber(pdf_file.getvalue())
                    st.text_area("Extracted Layout Text", raw_text[:1000] + ("..." if len(raw_text) > 1000 else ""), height=150)
                    
                    parsed_json, err = extract_via_gemini_flash(raw_text, api_key)
                    if err:
                        st.warning(f"Gemini API Notice: {err}. (Ensure GEMINI_API_KEY is configured)")
                    elif parsed_json:
                        st.success("Extracted Structured Schema!")
                        st.json(parsed_json)
                        st.session_state["supplier_invoices"].append(parsed_json)
                        st.rerun()

    with col_in2:
        st.markdown("#### 📊 Messy Vendor CSV Normalizer")
        csv_file = st.file_uploader("Upload Vendor CSV Log", type=["csv"], key="st_csv_upload")
        
        if csv_file:
            try:
                raw_df = pd.read_csv(csv_file)
                raw_df.columns = [c.strip().lower().replace(" ", "_") for c in raw_df.columns]
                st.dataframe(raw_df.head(3), use_container_width=True)
                if st.button("Ingest and Normalize CSV into DuckDB Invoices"):
                    for _, r in raw_df.iterrows():
                        sub = float(r.get("subtotal", r.get("amount", 500.0)))
                        tax = float(r.get("tax_amount", 0.0))
                        st.session_state["supplier_invoices"].append({
                            "invoice_number": str(r.get("invoice_number", f"CSV-{int(datetime.now().timestamp())}")),
                            "po_number": str(r.get("po_number", "PO-STANDARD")),
                            "vendor_name": str(r.get("vendor_name", r.get("vendor", "CSV Supplier"))),
                            "invoice_date": str(r.get("invoice_date", date.today().isoformat())),
                            "due_date": str(r.get("due_date", date.today().isoformat())),
                            "currency": "USD",
                            "subtotal": sub,
                            "tax_rate": 10.0,
                            "tax_amount": tax,
                            "total_amount_due": sub + tax,
                            "line_items": [
                                {"item_description": str(r.get("item_description", "Item")), "quantity": 1.0, "unit_price": sub, "total_amount": sub}
                            ]
                        })
                    st.success("Normalized and Ingested CSV records!")
                    st.rerun()
            except Exception as e:
                st.error(f"Error parsing CSV: {e}")

    st.markdown("---")
    st.markdown("#### 📋 Staged Supplier Invoices in Memory")
    st.dataframe(df_invoices, use_container_width=True)

# ==========================================
# TAB 2: DUCKDB 4-WAY AUDIT ENGINE
# ==========================================
with tab2:
    st.markdown("### 🗃️ DuckDB 4 Automated Financial Audit Checks")
    st.caption("DuckDB executes fast in-memory SQL transformations to isolate billing leakage across 4 critical risk vectors:")

    a_col1, a_col2 = st.columns(2)
    with a_col1:
        st.markdown("#### 1️⃣ Overcharge Check (`quantity * unit_price != line_total`)")
        if len(overcharge_res) > 0:
            st.error(f"🚨 {len(overcharge_res)} Overcharges Flagged! Total Leakage: ${overcharge_leakage:,.2f}")
            st.dataframe(overcharge_res, use_container_width=True)
        else:
            st.success("✅ Zero Overcharge Variances Detected.")

    with a_col2:
        st.markdown("#### 2️⃣ Duplicate Invoice Flag (Identical Vendor + Invoice #)")
        if len(dup_res) > 0:
            st.warning(f"⚠️ {len(dup_res)} Duplicate Invoices Identified! Potential Double-Pay: ${duplicate_leakage:,.2f}")
            st.dataframe(dup_res, use_container_width=True)
        else:
            st.success("✅ Zero Duplicate Invoices Found.")

    st.markdown("<div style='height: 0.5rem;'></div>", unsafe_allow_html=True)
    a_col3, a_col4 = st.columns(2)
    with a_col3:
        st.markdown("#### 3️⃣ Tax Calculation Validation (`subtotal * tax_rate != tax_amount`)")
        if len(tax_res) > 0:
            st.error(f"⚠️ {len(tax_res)} Incorrect Tax Charges! Variance: ${tax_leakage:,.2f}")
            st.dataframe(tax_res, use_container_width=True)
        else:
            st.success("✅ All Tax Calculations Match Expected Rates.")

    with a_col4:
        st.markdown("#### 4️⃣ Missing PO Number Flag (Unapproved Procurement)")
        if len(missing_po_res) > 0:
            st.warning(f"⚠️ {len(missing_po_res)} Invoices Missing Purchase Order (PO) Number!")
            st.dataframe(missing_po_res, use_container_width=True)
        else:
            st.success("✅ All Invoices Linked to Authorized POs.")

    st.markdown("---")
    st.markdown("#### ⚡ DuckDB Interactive SQL Sandbox")
    custom_q = st.text_area("Execute Custom DuckDB SQL Query", value="SELECT vendor_name, COUNT(*) as invoice_count, ROUND(SUM(total_amount_due), 2) as total_spend FROM audited_mis_summary GROUP BY vendor_name ORDER BY total_spend DESC;", height=75)
    if st.button("Execute SQL", key="btn_run_sandbox"):
        try:
            q_out = st.session_state["duckdb_conn"].execute(custom_q).fetchdf()
            st.dataframe(q_out, use_container_width=True)
        except Exception as e:
            st.error(f"SQL Error: {e}")

# ==========================================
# TAB 3: MIS ANALYTICS & RECONCILIATION TOWER
# ==========================================
with tab3:
    st.markdown("### 📊 Executive MIS Dashboard & Reconciliation Tower")
    
    summary_df = st.session_state["duckdb_conn"].execute("SELECT * FROM audited_mis_summary;").fetchdf()

    ch1, ch2 = st.columns(2)
    with ch1:
        st.markdown("#### 📈 Vendor Spend vs. Discrepancy Breakdown")
        if not summary_df.empty:
            vendor_summary = summary_df.groupby("vendor_name")[["total_amount_due", "subtotal"]].sum().reset_index()
            fig1 = px.bar(
                vendor_summary,
                x="vendor_name",
                y="total_amount_due",
                color="vendor_name",
                title="Total Supplier Billed Spend",
                template=PLOTLY_TEMPLATE
            )
            fig1.update_layout(showlegend=False, margin=dict(l=20, r=20, t=35, b=20))
            st.plotly_chart(fig1, use_container_width=True)

    with ch2:
        st.markdown("#### 🚨 Audit Risk Priority Distribution")
        risk_counts = {
            "OVERCHARGED": len(overcharge_res),
            "DUPLICATE": len(dup_res),
            "TAX ERROR": len(tax_res),
            "MISSING PO": len(missing_po_res),
            "VERIFIED": max(0, unique_inv_count - discrepancy_invs)
        }
        risk_df = pd.DataFrame(list(risk_counts.items()), columns=["Audit Risk Category", "Count"])
        fig2 = px.pie(
            risk_df,
            names="Audit Risk Category",
            values="Count",
            hole=0.45,
            title="Audit Status Breakdown",
            template=PLOTLY_TEMPLATE,
            color_discrete_sequence=["#EF4444", "#F59E0B", "#8B5CF6", "#EC4899", "#10B981"]
        )
        fig2.update_layout(margin=dict(l=20, r=20, t=35, b=20))
        st.plotly_chart(fig2, use_container_width=True)

    st.markdown("#### 📋 Audited MIS Summary Control Tower Table")
    st.dataframe(summary_df, use_container_width=True)

# ==========================================
# TAB 4: MULTI-FORMAT AUDIT EXPORTER
# ==========================================
with tab4:
    st.markdown("### 📥 Multi-Format Enterprise Audit Exporter")
    
    exp1, exp2, exp3 = st.columns(3)
    sum_exp = st.session_state["duckdb_conn"].execute("SELECT * FROM audited_mis_summary;").fetchdf()

    with exp1:
        st.markdown("#### 📄 Cleaned MIS CSV")
        st.download_button(
            label="⬇️ Download Audited CSV",
            data=sum_exp.to_csv(index=False).encode('utf-8'),
            file_name=f"Audited_MIS_Report_{date.today().isoformat()}.csv",
            mime="text/csv",
            use_container_width=True
        )

    with exp2:
        st.markdown("#### 📗 Multi-Sheet Excel (.xlsx)")
        excel_buf = io.BytesIO()
        with pd.ExcelWriter(excel_buf, engine='openpyxl') as wr:
            sum_exp.to_excel(wr, sheet_name="Audited_MIS_Summary", index=False)
            if not overcharge_res.empty:
                overcharge_res.to_excel(wr, sheet_name="Overcharges_Audit", index=False)
            if not tax_res.empty:
                tax_res.to_excel(wr, sheet_name="Tax_Discrepancies", index=False)
            df_invoices.to_excel(wr, sheet_name="Raw_Invoices_Table", index=False)
        st.download_button(
            label="⬇️ Download Excel (.xlsx)",
            data=excel_buf.getvalue(),
            file_name=f"Executive_Supplier_Audit_{date.today().isoformat()}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True
        )

    with exp3:
        st.markdown("#### 🗄️ ERP-Ready JSON")
        st.download_button(
            label="⬇️ Download ERP JSON",
            data=json.dumps(st.session_state["supplier_invoices"], indent=2),
            file_name=f"ERP_Audited_Invoices_{date.today().isoformat()}.json",
            mime="application/json",
            use_container_width=True
        )
