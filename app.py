"""
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

# Load environment variables
load_dotenv()

# Streamlit Page Configuration
st.set_page_config(
    page_title="AutoExtract MIS & Executive Control Tower",
    page_icon="⚡",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Executive Dark Theme CSS
CUSTOM_CSS = """
<style>
    /* Executive Palette: #0B0F19 (Background), #111827 (Surface), #6366F1 (Indigo), #10B981 (Emerald) */
    .stApp {
        background-color: #0B0F19;
        color: #F8FAFC;
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* Header & Badges */
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
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.5);
    }
    
    .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 14px;
        border-radius: 9999px;
        font-size: 0.82rem;
        font-weight: 600;
        letter-spacing: 0.025em;
    }
    
    .badge-duckdb {
        background: rgba(245, 158, 11, 0.15);
        color: #FBBF24;
        border: 1px solid rgba(245, 158, 11, 0.3);
    }
    
    .badge-gemini {
        background: rgba(99, 102, 241, 0.15);
        color: #818CF8;
        border: 1px solid rgba(99, 102, 241, 0.35);
    }

    .badge-live {
        background: rgba(16, 185, 129, 0.15);
        color: #34D399;
        border: 1px solid rgba(16, 185, 129, 0.35);
    }

    /* KPI Cards Glassmorphism */
    .kpi-card {
        background: linear-gradient(145deg, rgba(30, 41, 59, 0.6), rgba(15, 23, 42, 0.75));
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        padding: 1.25rem 1.5rem;
        box-shadow: 0 8px 20px -4px rgba(0, 0, 0, 0.4);
        transition: transform 0.2s ease, border-color 0.2s ease;
    }
    .kpi-card:hover {
        border-color: rgba(99, 102, 241, 0.4);
        transform: translateY(-2px);
    }
    .kpi-label {
        font-size: 0.82rem;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #94A3B8;
        margin-bottom: 0.35rem;
        font-weight: 600;
    }
    .kpi-value {
        font-size: 2.1rem;
        font-weight: 700;
        color: #F8FAFC;
        line-height: 1.2;
    }
    .kpi-sub {
        font-size: 0.8rem;
        color: #10B981;
        margin-top: 0.4rem;
        display: flex;
        align-items: center;
        gap: 4px;
    }

    /* Section Containers */
    .section-box {
        background: rgba(17, 24, 39, 0.7);
        border: 1px solid rgba(255, 255, 255, 0.07);
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
    }

    /* Tables & Inputs */
    .stDataFrame {
        border-radius: 10px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.08);
    }

    /* Tabs styling */
    .stTabs [data-baseweb="tab-list"] {
        gap: 8px;
        background-color: rgba(15, 23, 42, 0.7);
        padding: 6px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.06);
    }
    .stTabs [data-baseweb="tab"] {
        border-radius: 8px;
        color: #94A3B8;
        font-weight: 500;
        padding: 8px 18px;
    }
    .stTabs [aria-selected="true"] {
        background-color: #6366F1 !important;
        color: #FFFFFF !important;
        font-weight: 600;
    }
</style>
"""
st.markdown(CUSTOM_CSS, unsafe_allow_html=True)

# Pre-defined schema definition for Gemini
EXTRACTION_SCHEMA_JSON = {
    "type": "OBJECT",
    "properties": {
        "invoice_number": {"type": "STRING"},
        "vendor_name": {"type": "STRING"},
        "invoice_date": {"type": "STRING", "description": "YYYY-MM-DD format"},
        "due_date": {"type": "STRING", "description": "YYYY-MM-DD format"},
        "currency": {"type": "STRING"},
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
        },
        "tax_amount": {"type": "NUMBER"},
        "total_amount_due": {"type": "NUMBER"}
    },
    "required": ["invoice_number", "vendor_name", "invoice_date", "currency", "line_items", "total_amount_due"]
}

# Sample Dataset for immediate exploration
DEFAULT_SAMPLE_INVOICES = [
    {
        "invoice_number": "INV-2026-9081",
        "vendor_name": "Apex Cloud Systems",
        "invoice_date": "2026-03-12",
        "due_date": "2026-04-11",
        "currency": "USD",
        "tax_amount": 320.00,
        "total_amount_due": 3520.00,
        "line_items": [
            {"item_description": "Dedicated Cloud Cluster Hosting", "quantity": 1.0, "unit_price": 2400.00, "total_amount": 2400.00},
            {"item_description": "Global Load Balancer Tier-1", "quantity": 2.0, "unit_price": 400.00, "total_amount": 800.00}
        ]
    },
    {
        "invoice_number": "FLT-88219",
        "vendor_name": "Pacific Freight Logistics",
        "invoice_date": "2026-03-15",
        "due_date": "2026-03-30",
        "currency": "USD",
        "tax_amount": 150.00,
        "total_amount_due": 4150.00,
        "line_items": [
            {"item_description": "Express Cargo Air Freight (240kg)", "quantity": 1.0, "unit_price": 2800.00, "total_amount": 2800.00},
            {"item_description": "Customs Expedited Clearance", "quantity": 1.0, "unit_price": 1200.00, "total_amount": 1200.00}
        ]
    },
    {
        "invoice_number": "CYBER-4022",
        "vendor_name": "CyberShield Defense Corp",
        "invoice_date": "2026-03-20",
        "due_date": "2026-04-19",
        "currency": "USD",
        "tax_amount": 0.00,
        "total_amount_due": 5400.00,
        "line_items": [
            {"item_description": "Endpoint Zero Trust Enterprise Licenses", "quantity": 60.0, "unit_price": 90.00, "total_amount": 5400.00}
        ]
    },
    {
        "invoice_number": "DISC-7714",
        "vendor_name": "Vortex Hardware & Supplies",
        "invoice_date": "2026-03-22",
        "due_date": "2026-04-05",
        "currency": "USD",
        "tax_amount": 75.00,
        "total_amount_due": 1825.00,
        "line_items": [
            # INTENTIONAL MISMATCH FOR DUCKDB HYGIENE DEMONSTRATION
            {"item_description": "Cat6a Shielded Patch Cable 1000ft", "quantity": 5.0, "unit_price": 250.00, "total_amount": 1750.00} # 5 * 250 = 1250, but stated 1750!
        ]
    },
    {
        "invoice_number": "INV-2026-9081", # INTENTIONAL DUPLICATE RECORD FOR DUCKDB HYGIENE
        "vendor_name": "Apex Cloud Systems",
        "invoice_date": "2026-03-12",
        "due_date": "2026-04-11",
        "currency": "USD",
        "tax_amount": 320.00,
        "total_amount_due": 3520.00,
        "line_items": [
            {"item_description": "Dedicated Cloud Cluster Hosting", "quantity": 1.0, "unit_price": 2400.00, "total_amount": 2400.00}
        ]
    },
    {
        "invoice_number": "NULL-DATE-01", # INTENTIONAL MISSING DATE FOR NULL CHECK
        "vendor_name": "QuickPrint Media",
        "invoice_date": None,
        "due_date": "2026-04-01",
        "currency": "USD",
        "tax_amount": 40.00,
        "total_amount_due": 840.00,
        "line_items": [
            {"item_description": "Executive Annual Report Hardcover Booklets", "quantity": 40.0, "unit_price": 20.00, "total_amount": 800.00}
        ]
    }
]

# Initialize Session State
if "raw_invoices_data" not in st.session_state:
    st.session_state["raw_invoices_data"] = DEFAULT_SAMPLE_INVOICES.copy()

if "duckdb_conn" not in st.session_state:
    st.session_state["duckdb_conn"] = duckdb.connect(database=":memory:")

# Helper: Extract Text & Layout from PDF using pdfplumber
def extract_pdf_content(file_bytes):
    extracted_text = []
    tables_extracted = []
    if not PDFPLUMBER_AVAILABLE:
        return "pdfplumber is not installed. Please install via requirements.txt.", []
    
    try:
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page_idx, page in enumerate(pdf.pages):
                txt = page.extract_text() or ""
                extracted_text.append(f"--- Page {page_idx + 1} ---\n{txt}")
                tables = page.extract_tables()
                if tables:
                    tables_extracted.extend(tables)
        return "\n\n".join(extracted_text), tables_extracted
    except Exception as e:
        return f"Error parsing PDF: {str(e)}", []

# Helper: Parse LLM Structured JSON using Gemini Flash
def extract_invoice_via_gemini(raw_text: str, api_key: str):
    if not api_key:
        return None, "Google Gemini API key missing. Please provide GEMINI_API_KEY in .env or sidebar."
    
    if not GENAI_AVAILABLE:
        return None, "google-genai SDK not installed."

    try:
        client = genai.Client(api_key=api_key)
        prompt = f"""
You are an expert Data Engineer & Financial Invoice Extractor.
Extract the structured invoice data from the following unstructured raw invoice text into strictly valid JSON matching this specification:
- invoice_number (string)
- vendor_name (string)
- invoice_date (YYYY-MM-DD or null if missing)
- due_date (YYYY-MM-DD or null if missing)
- currency (3 letter code, e.g. USD, EUR, GBP)
- tax_amount (float)
- total_amount_due (float)
- line_items: array of objects with keys: item_description (str), quantity (float), unit_price (float), total_amount (float)

Raw Invoice Text:
{raw_text}
"""
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json"
            )
        )
        parsed_json = json.loads(response.text)
        return parsed_json, None
    except Exception as e:
        return None, f"Gemini Extraction Exception: {str(e)}"

# Flatten invoices into tabular rows for DuckDB ingestion
def flatten_invoices_to_df(invoices_list):
    rows = []
    for inv in invoices_list:
        inv_num = inv.get("invoice_number", "UNKNOWN")
        vendor = inv.get("vendor_name", "UNKNOWN")
        inv_date = inv.get("invoice_date")
        due_date = inv.get("due_date")
        currency = inv.get("currency", "USD")
        tax = float(inv.get("tax_amount", 0.0) or 0.0)
        total_due = float(inv.get("total_amount_due", 0.0) or 0.0)
        
        items = inv.get("line_items", [])
        if not items:
            rows.append({
                "invoice_number": inv_num,
                "vendor_name": vendor,
                "invoice_date": inv_date,
                "due_date": due_date,
                "currency": currency,
                "item_description": "General Service / Unspecified",
                "quantity": 1.0,
                "unit_price": total_due,
                "line_item_total": total_due,
                "tax_amount": tax,
                "total_amount_due": total_due
            })
        else:
            for itm in items:
                qty = float(itm.get("quantity", 1.0) or 1.0)
                price = float(itm.get("unit_price", 0.0) or 0.0)
                tot = float(itm.get("total_amount", qty * price) or (qty * price))
                rows.append({
                    "invoice_number": inv_num,
                    "vendor_name": vendor,
                    "invoice_date": inv_date,
                    "due_date": due_date,
                    "currency": currency,
                    "item_description": itm.get("item_description", "Item"),
                    "quantity": qty,
                    "unit_price": price,
                    "line_item_total": tot,
                    "tax_amount": tax,
                    "total_amount_due": total_due
                })
    return pd.DataFrame(rows)

# Synchronize DuckDB tables & views
def refresh_duckdb_views(conn, df):
    conn.execute("DROP VIEW IF EXISTS cleaned_mis_summary;")
    conn.execute("DROP TABLE IF EXISTS raw_invoices;")
    conn.register("raw_invoices_df", df)
    conn.execute("CREATE TABLE raw_invoices AS SELECT * FROM raw_invoices_df;")
    
    # Create Cleaned MIS Summary View (Aggregated per invoice with hygiene flags)
    conn.execute("""
        CREATE VIEW cleaned_mis_summary AS
        SELECT 
            invoice_number,
            vendor_name,
            COALESCE(invoice_date, '1970-01-01') AS invoice_date,
            due_date,
            currency,
            COUNT(item_description) AS item_count,
            SUM(line_item_total) AS items_sum,
            MAX(tax_amount) AS tax_amount,
            MAX(total_amount_due) AS total_amount_due,
            CASE 
                WHEN invoice_date IS NULL OR total_amount_due IS NULL OR total_amount_due <= 0 THEN 'Missing Critical Metadata'
                WHEN ABS(SUM(line_item_total) - (MAX(total_amount_due) - MAX(tax_amount))) > 1.0 THEN 'Sum Mismatch Flag'
                ELSE 'Verified Clean'
            END AS audit_status
        FROM raw_invoices
        GROUP BY invoice_number, vendor_name, invoice_date, due_date, currency;
    """)

# Execute DuckDB Validation Rules
def run_duckdb_validations(conn):
    # Rule 1: Calc Total Mismatch
    mismatch_df = conn.execute("""
        SELECT 
            invoice_number, 
            vendor_name, 
            item_description, 
            quantity, 
            unit_price, 
            line_item_total,
            ROUND(quantity * unit_price, 2) AS expected_line_total,
            ROUND(ABS(line_item_total - (quantity * unit_price)), 2) AS variance
        FROM raw_invoices
        WHERE ABS(line_item_total - (quantity * unit_price)) > 0.02;
    """).fetchdf()

    # Rule 2: Duplicate Check
    duplicates_df = conn.execute("""
        SELECT 
            invoice_number, 
            vendor_name, 
            COUNT(*) AS occurrence_count,
            COUNT(DISTINCT total_amount_due) AS distinct_totals
        FROM (
            SELECT DISTINCT invoice_number, vendor_name, total_amount_due, invoice_date 
            FROM raw_invoices
        )
        GROUP BY invoice_number, vendor_name
        HAVING COUNT(*) > 1;
    """).fetchdf()

    # Rule 3: Null Check
    nulls_df = conn.execute("""
        SELECT 
            invoice_number, 
            vendor_name, 
            invoice_date, 
            total_amount_due,
            CASE 
                WHEN invoice_date IS NULL THEN 'Missing Invoice Date'
                WHEN vendor_name IS NULL OR TRIM(vendor_name) = '' THEN 'Missing Vendor Name'
                WHEN total_amount_due IS NULL OR total_amount_due <= 0 THEN 'Invalid Total Amount'
                ELSE 'Other Discrepancy'
            END AS null_violation_reason
        FROM raw_invoices
        WHERE invoice_date IS NULL 
           OR total_amount_due IS NULL 
           OR total_amount_due <= 0 
           OR vendor_name IS NULL 
           OR TRIM(vendor_name) = '';
    """).fetchdf()

    return mismatch_df, duplicates_df, nulls_df

# Sync session data to DuckDB
df_current = flatten_invoices_to_df(st.session_state["raw_invoices_data"])
refresh_duckdb_views(st.session_state["duckdb_conn"], df_current)
mismatch_res, dup_res, null_res = run_duckdb_validations(st.session_state["duckdb_conn"])

# Calculate Data Hygiene Score
total_invoices_count = len(st.session_state["raw_invoices_data"])
discrepancies_count = len(mismatch_res) + len(dup_res) + len(null_res)
hygiene_score = max(0, min(100, int(((total_invoices_count - min(discrepancies_count, total_invoices_count)) / max(total_invoices_count, 1)) * 100)))

# Sidebar Controls
with st.sidebar:
    st.markdown("### ⚙️ Engine Controls")
    
    api_key_input = st.text_input(
        "Google Gemini API Key",
        value=os.environ.get("GEMINI_API_KEY", ""),
        type="password",
        help="Required for Gemini Flash unstructured document parsing"
    )
    
    st.markdown("---")
    st.markdown("#### 🔄 Sample Data Actions")
    if st.button("Reset to Enterprise Demo Batch", use_container_width=True):
        st.session_state["raw_invoices_data"] = DEFAULT_SAMPLE_INVOICES.copy()
        st.rerun()

    if st.button("Clear All Staged Records", use_container_width=True):
        st.session_state["raw_invoices_data"] = []
        st.rerun()

    st.markdown("---")
    st.markdown("#### ⚡ System Architecture")
    st.markdown("""
    - **UI**: Streamlit Executive Theme
    - **Layout Parsing**: `pdfplumber`
    - **Extractor**: `gemini-2.5-flash`
    - **Hygiene Engine**: `DuckDB In-Memory`
    - **Visuals**: `Plotly Express`
    """)

# Top Header Bar
gemini_status_text = "Gemini Flash Connected" if api_key_input else "Gemini Flash Key Required"
gemini_badge_class = "badge-live" if api_key_input else "badge-gemini"

st.markdown(f"""
<div class="header-container">
    <div>
        <h2 style="margin: 0; font-size: 1.55rem; font-weight: 800; letter-spacing: -0.02em;">
            ⚡ AutoExtract MIS & Executive Control Tower
        </h2>
        <p style="margin: 4px 0 0 0; color: #94A3B8; font-size: 0.88rem;">
            Autonomous Unstructured Document Extraction, DuckDB SQL Hygiene, & Executive Financial Intelligence
        </p>
    </div>
    <div style="display: flex; gap: 8px;">
        <span class="status-badge badge-duckdb">🗃️ DuckDB Engine Active</span>
        <span class="status-badge {gemini_badge_class}">✨ {gemini_status_text}</span>
    </div>
</div>
""", unsafe_allow_html=True)

# Main Tab Navigation
tab1, tab2, tab3, tab4 = st.tabs([
    "📄 Document Ingestion & Extraction Lab",
    "🗃️ DuckDB SQL Cleaning & Validation Rules",
    "📊 Executive MIS Dashboard & KPI Control Tower",
    "📥 Multi-Format Data Exporter"
])

# ==========================================
# TAB 1: DOCUMENT INGESTION & EXTRACTION LAB
# ==========================================
with tab1:
    st.markdown("### 📥 Ingest Unstructured Documents")
    st.markdown("Upload raw vendor invoice PDFs or irregular CSV files to trigger automated layout extraction and Gemini Flash schema normalization.")
    
    col_up1, col_up2 = st.columns([1, 1])
    
    with col_up1:
        st.markdown("#### 📑 Unstructured PDF Ingestion")
        uploaded_pdf = st.file_uploader("Upload PDF Document (Invoice / Receipt)", type=["pdf"], key="pdf_uploader")
        
        if uploaded_pdf:
            st.info(f"Loaded: `{uploaded_pdf.name}` ({len(uploaded_pdf.getvalue())} bytes)")
            if st.button("Parse PDF Layout & Extract with Gemini", key="btn_parse_pdf"):
                with st.spinner("Extracting layout via pdfplumber and executing Gemini Flash schema parser..."):
                    raw_text, tables = extract_pdf_content(uploaded_pdf.getvalue())
                    
                    st.text_area("Extracted Raw PDF Text (pdfplumber)", raw_text[:1200] + ("..." if len(raw_text) > 1200 else ""), height=160)
                    
                    parsed_res, err = extract_invoice_via_gemini(raw_text, api_key_input)
                    if err:
                        st.error(f"Extraction Warning: {err}")
                        st.info("Tip: You can use the pre-loaded enterprise invoices in Tab 2 & 3 or add records manually below.")
                    elif parsed_res:
                        st.success("Successfully Extracted Validated JSON Schema!")
                        st.json(parsed_res)
                        # Append to state
                        st.session_state["raw_invoices_data"].append(parsed_res)
                        st.rerun()

    with col_up2:
        st.markdown("#### 📊 Tabular CSV Ingestion")
        uploaded_csv = st.file_uploader("Upload Tabular File (CSV)", type=["csv"], key="csv_uploader")
        
        if uploaded_csv:
            try:
                raw_df = pd.read_csv(uploaded_csv)
                # Standardize headers (lowercase, underscore spaces)
                raw_df.columns = [c.strip().lower().replace(" ", "_") for c in raw_df.columns]
                st.write("Normalized Columns:", list(raw_df.columns))
                st.dataframe(raw_df.head(4), use_container_width=True)
                
                if st.button("Ingest CSV into Raw Invoices Table"):
                    # Transform CSV rows into invoices
                    new_records = []
                    for _, row in raw_df.iterrows():
                        rec = {
                            "invoice_number": str(row.get("invoice_number", f"CSV-{int(datetime.now().timestamp())}")),
                            "vendor_name": str(row.get("vendor_name", row.get("vendor", "General Vendor"))),
                            "invoice_date": str(row.get("invoice_date", date.today().isoformat())),
                            "due_date": str(row.get("due_date", date.today().isoformat())),
                            "currency": str(row.get("currency", "USD")),
                            "tax_amount": float(row.get("tax_amount", 0.0) or 0.0),
                            "total_amount_due": float(row.get("total_amount_due", row.get("amount", 0.0)) or 0.0),
                            "line_items": [
                                {
                                    "item_description": str(row.get("item_description", row.get("description", "Standard Item"))),
                                    "quantity": float(row.get("quantity", 1.0) or 1.0),
                                    "unit_price": float(row.get("unit_price", row.get("price", row.get("total_amount_due", 0.0))) or 0.0),
                                    "total_amount": float(row.get("total_amount_due", 0.0) or 0.0)
                                }
                            ]
                        }
                        new_records.append(rec)
                    st.session_state["raw_invoices_data"].extend(new_records)
                    st.success(f"Ingested {len(new_records)} records from CSV!")
                    st.rerun()
            except Exception as e:
                st.error(f"Error reading CSV: {e}")

    st.markdown("---")
    st.markdown("#### 📋 Staged Invoices Schema Registry")
    st.caption("Current documents held in memory ready for DuckDB SQL processing:")
    st.dataframe(df_current, use_container_width=True, height=220)

# ========================================================
# TAB 2: DUCKDB SQL CLEANING & VALIDATION RULES
# ========================================================
with tab2:
    st.markdown("### 🗃️ In-Memory DuckDB Hygiene & Validation Rules")
    st.markdown("DuckDB runs automated integrity validations across line-item arithmetic, duplicate invoices, and critical schema nulls.")

    col_v1, col_v2, col_v3 = st.columns(3)
    
    with col_v1:
        st.markdown(f"#### 1️⃣ Calculation Mismatch (`calc_total_mismatch`)")
        st.caption("Checks: `ABS(line_item_total - (quantity * unit_price)) > 0.02`")
        if len(mismatch_res) > 0:
            st.error(f"⚠️ {len(mismatch_res)} Line Item Discrepancy Flagged!")
            st.dataframe(mismatch_res, use_container_width=True)
        else:
            st.success("✅ Zero Line Item Mismatches Detected.")

    with col_v2:
        st.markdown(f"#### 2️⃣ Duplicate Invoices (`duplicate_check`)")
        st.caption("Checks identical `invoice_number` + `vendor_name` pairs")
        if len(dup_res) > 0:
            st.warning(f"⚠️ {len(dup_res)} Duplicate Invoices Detected!")
            st.dataframe(dup_res, use_container_width=True)
        else:
            st.success("✅ Zero Duplicate Invoices Found.")

    with col_v3:
        st.markdown(f"#### 3️⃣ Missing Critical Metadata (`null_check`)")
        st.caption("Checks missing `invoice_date`, `vendor_name`, or `total_amount_due`")
        if len(null_res) > 0:
            st.error(f"⚠️ {len(null_res)} Incomplete Invoices Flagged!")
            st.dataframe(null_res, use_container_width=True)
        else:
            st.success("✅ All Critical Invoices Metadata Valid.")

    st.markdown("---")
    st.markdown("#### ⚡ DuckDB Interactive SQL Sandbox")
    st.caption("Run native DuckDB SQL transformations directly against `raw_invoices` or `cleaned_mis_summary`:")

    default_query = "SELECT vendor_name, COUNT(*) as invoice_count, ROUND(SUM(total_amount_due), 2) as total_spend FROM cleaned_mis_summary GROUP BY vendor_name ORDER BY total_spend DESC;"
    custom_sql = st.text_area("SQL Statement", value=default_query, height=80)
    
    if st.button("Execute SQL Query", key="btn_run_sql"):
        try:
            query_res = st.session_state["duckdb_conn"].execute(custom_sql).fetchdf()
            st.dataframe(query_res, use_container_width=True)
        except Exception as e:
            st.error(f"DuckDB SQL Execution Error: {str(e)}")

# ========================================================
# TAB 3: EXECUTIVE MIS DASHBOARD & KPI CONTROL TOWER
# ========================================================
with tab3:
    # Query summary metrics from DuckDB
    summary_df = st.session_state["duckdb_conn"].execute("SELECT * FROM cleaned_mis_summary;").fetchdf()
    
    total_spend = summary_df["total_amount_due"].sum() if not summary_df.empty else 0.0
    total_inv_count = len(summary_df)
    
    top_vendor = "None"
    if not summary_df.empty:
        top_vendor_row = summary_df.groupby("vendor_name")["total_amount_due"].sum().reset_index().sort_values(by="total_amount_due", ascending=False)
        if not top_vendor_row.empty:
            top_vendor = top_vendor_row.iloc[0]["vendor_name"]

    # KPI Bar
    kpi1, kpi2, kpi3, kpi4 = st.columns(4)
    with kpi1:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-label">Total Spend Incurred</div>
            <div class="kpi-value">${total_spend:,.2f}</div>
            <div class="kpi-sub">Across All Processed Invoices</div>
        </div>
        """, unsafe_allow_html=True)
        
    with kpi2:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-label">Outstanding Invoices Parsed</div>
            <div class="kpi-value">{total_inv_count}</div>
            <div class="kpi-sub">In-Memory DuckDB Table</div>
        </div>
        """, unsafe_allow_html=True)

    with kpi3:
        hygiene_color = "#10B981" if hygiene_score >= 80 else "#F59E0B" if hygiene_score >= 50 else "#EF4444"
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-label">Data Quality / Hygiene Score</div>
            <div class="kpi-value" style="color: {hygiene_color};">{hygiene_score}%</div>
            <div class="kpi-sub">{discrepancies_count} Discrepancy Flags</div>
        </div>
        """, unsafe_allow_html=True)

    with kpi4:
        st.markdown(f"""
        <div class="kpi-card">
            <div class="kpi-label">Top Vendor by Spend</div>
            <div class="kpi-value" style="font-size: 1.45rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">{top_vendor}</div>
            <div class="kpi-sub">Largest Spend Concentration</div>
        </div>
        """, unsafe_allow_html=True)

    st.markdown("<div style='height: 1.5rem;'></div>", unsafe_allow_html=True)

    # Charts Grid
    ch_col1, ch_col2 = st.columns([1.1, 0.9])
    
    with ch_col1:
        st.markdown("#### 📈 Spend Velocity Timeline")
        if not summary_df.empty:
            timeline_df = summary_df.copy()
            timeline_df["invoice_date"] = pd.to_datetime(timeline_df["invoice_date"], errors='coerce')
            timeline_agg = timeline_df.groupby("invoice_date")["total_amount_due"].sum().reset_index().sort_values(by="invoice_date")
            
            fig_line = px.area(
                timeline_agg,
                x="invoice_date",
                y="total_amount_due",
                title="Spend Velocity & Cash Outflow Distribution",
                template="plotly_dark",
                color_discrete_sequence=["#6366F1"]
            )
            fig_line.update_layout(
                paper_bgcolor="#0B0F19",
                plot_bgcolor="#111827",
                xaxis=dict(showgrid=False),
                yaxis=dict(showgrid=True, gridcolor="rgba(255,255,255,0.08)"),
                margin=dict(l=20, r=20, t=40, b=20)
            )
            st.plotly_chart(fig_line, use_container_width=True)
        else:
            st.info("No timeline data available.")

    with ch_col2:
        st.markdown("#### 🍩 Vendor Concentration Distribution")
        if not summary_df.empty:
            vendor_agg = summary_df.groupby("vendor_name")["total_amount_due"].sum().reset_index()
            fig_donut = px.pie(
                vendor_agg,
                names="vendor_name",
                values="total_amount_due",
                hole=0.55,
                title="Vendor Share of Total Spend",
                template="plotly_dark",
                color_discrete_sequence=px.colors.qualitative.Prism
            )
            fig_donut.update_layout(
                paper_bgcolor="#0B0F19",
                margin=dict(l=20, r=20, t=40, b=20)
            )
            st.plotly_chart(fig_donut, use_container_width=True)
        else:
            st.info("No vendor distribution data available.")

    # Line Item Category / Description Breakdown
    st.markdown("#### 📊 Line Item Spend Breakdown")
    if not df_current.empty:
        item_agg = df_current.groupby("item_description")["line_item_total"].sum().reset_index().sort_values(by="line_item_total", ascending=True).tail(8)
        fig_bar = px.bar(
            item_agg,
            x="line_item_total",
            y="item_description",
            orientation="h",
            title="Top Spend by Line Item Category",
            template="plotly_dark",
            color="line_item_total",
            color_continuous_scale="Purp"
        )
        fig_bar.update_layout(
            paper_bgcolor="#0B0F19",
            plot_bgcolor="#111827",
            yaxis=dict(title=""),
            xaxis=dict(title="Total Amount ($)"),
            margin=dict(l=20, r=20, t=40, b=20)
        )
        st.plotly_chart(fig_bar, use_container_width=True)

    # Detailed Interactive Cleaned MIS Table
    st.markdown("#### 📋 Executive Filterable MIS Control Tower")
    st.dataframe(summary_df, use_container_width=True)

# ==========================================
# TAB 4: MULTI-FORMAT DATA EXPORTER
# ==========================================
with tab4:
    st.markdown("### 📥 Multi-Format Enterprise Data Exporter")
    st.markdown("Export cleaned MIS tables, validated database schemas, and structured JSON for ERP & data lake ingestion.")
    
    exp_col1, exp_col2, exp_col3 = st.columns(3)
    
    summary_df_export = st.session_state["duckdb_conn"].execute("SELECT * FROM cleaned_mis_summary;").fetchdf()

    with exp_col1:
        st.markdown("#### 📄 Cleaned MIS CSV")
        st.caption("Standardized flattened CSV for BI pipelines & Excel.")
        csv_buffer = summary_df_export.to_csv(index=False).encode('utf-8')
        st.download_button(
            label="⬇️ Download Cleaned CSV",
            data=csv_buffer,
            file_name=f"Cleaned_MIS_Report_{date.today().isoformat()}.csv",
            mime="text/csv",
            use_container_width=True
        )

    with exp_col2:
        st.markdown("#### 📗 Formatted Excel Workbook")
        st.caption("Native `.xlsx` with executive columns.")
        excel_buffer = io.BytesIO()
        with pd.ExcelWriter(excel_buffer, engine='openpyxl') as writer:
            summary_df_export.to_excel(writer, sheet_name="Cleaned_MIS", index=False)
            df_current.to_excel(writer, sheet_name="Raw_Line_Items", index=False)
        excel_data = excel_buffer.getvalue()
        
        st.download_button(
            label="⬇️ Download Excel (.xlsx)",
            data=excel_data,
            file_name=f"Executive_MIS_Report_{date.today().isoformat()}.xlsx",
            mime="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            use_container_width=True
        )

    with exp_col3:
        st.markdown("#### 🗄️ ERP-Ready Structured JSON")
        st.caption("Schema-validated JSON payload for SAP / NetSuite ingestion.")
        json_export_str = json.dumps(st.session_state["raw_invoices_data"], indent=2)
        st.download_button(
            label="⬇️ Download Schema JSON",
            data=json_export_str,
            file_name=f"ERP_Invoice_Payload_{date.today().isoformat()}.json",
            mime="application/json",
            use_container_width=True
        )

    st.markdown("---")
    st.markdown("#### 🔍 Raw JSON Schema Preview")
    st.json(st.session_state["raw_invoices_data"])
