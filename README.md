# 🚀 AutoExtract MIS & Executive Control Tower
## Automated Supplier Invoice Reconciliation & Financial Leakage Audit Engine

> **Production-grade automated supplier invoice audit engine powered by Python, Streamlit, pdfplumber, DuckDB, Pandas, Plotly, and Google Gemini Flash API.**

---

## 🎯 Problem Statement & Mission
Finance and procurement teams manually audit thousands of supplier PDF invoices and vendor CSV logs. Overcharges, duplicate billing, quantity mismatches, missing purchase orders (PO), and incorrect tax calculations cause massive financial leakage.

**AutoExtract MIS & Executive Control Tower** delivers an automated data reconciliation pipeline:
1. **Unstructured Ingestion**: Ingests PDF supplier invoices and messy vendor CSV files.
2. **Local Layout Extraction (`pdfplumber`)**: Parses tabular bounding boxes and text layers.
3. **Structured Schema Normalization (`Gemini Flash API`)**: Normalizes raw unstructured data into a validated financial schema (PO #, vendor, line items, taxes, totals).
4. **DuckDB Automated Audit Engine**: Runs 4 high-speed in-memory SQL audit checks to identify financial leakage.
5. **Reconciliation Control Tower**: Executive KPIs (Total Billed, Total Leakage, Audit Pass Rate %, Top Overcharging Vendor) and Plotly visualizations.
6. **Multi-Format Export**: One-click export to CSV, multi-sheet formatted Excel (`.xlsx`), and ERP JSON schemas.

---

## 🏗️ Architecture & Pipeline Flow

```
   [ Supplier PDF Invoices / Messy CSVs ]
                     │
                     ▼
      ┌─────────────────────────────┐
      │  Local Layout & Table Parse │  --> pdfplumber
      └──────────────┬──────────────┘
                     │ Raw text & bounding box coordinates
                     ▼
      ┌─────────────────────────────┐
      │   Gemini Flash Extractor    │  --> @google/genai / google-genai
      └──────────────┬──────────────┘
                     │ Strict JSON (invoice_no, po_no, line_items, tax, totals)
                     ▼
      ┌─────────────────────────────┐
      │   In-Memory DuckDB Engine   │  --> In-memory table: `invoices`
      └──────────────┬──────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
┌───────────────────┐    ┌───────────────────────────────────┐
│  4 SQL Audit Rules│    │    audited_mis_summary (View)     │
│ 1. Overcharge     │    └─────────────────┬─────────────────┘
│ 2. Duplicate Bill │                      │
│ 3. Tax Calculation│                      ▼
│ 4. Missing PO     │    ┌───────────────────────────────────┐
└───────────────────┘    │  MIS Executive Control Tower      │
                         │  - Sleek Light Theme (Sun/Moon)   │
                         │  - Leakage & Discrepancy KPIs     │
                         │  - Risk Priority Charts           │
                         │  - Multi-Sheet Excel / CSV / JSON │
                         └───────────────────────────────────┘
```

---

## 🗃️ DuckDB SQL Audit & Financial Hygiene Rules

The engine flattens invoices into an in-memory DuckDB table `invoices` and executes four automated audit queries:

### 1. Overcharge Check (`calc_total_mismatch`)
Detects line-item overbilling where `(quantity * unit_price) != line_total` beyond floating-point tolerance ($0.02):
```sql
SELECT 
    invoice_number, 
    vendor_name, 
    item_description, 
    quantity, 
    unit_price, 
    line_item_total,
    ROUND(quantity * unit_price, 2) AS expected_line_total,
    ROUND(line_item_total - (quantity * unit_price), 2) AS overcharge_leakage
FROM invoices
WHERE (line_item_total - (quantity * unit_price)) > 0.02;
```

### 2. Duplicate Invoice Flag (`duplicate_check`)
Flags identical `vendor_name` + `invoice_number` submissions to prevent double disbursement:
```sql
SELECT 
    invoice_number, 
    vendor_name, 
    COUNT(*) AS occurrence_count,
    ROUND(SUM(total_amount_due), 2) AS potential_double_payment
FROM (
    SELECT DISTINCT invoice_number, vendor_name, total_amount_due, invoice_date 
    FROM invoices
)
GROUP BY invoice_number, vendor_name
HAVING COUNT(*) > 1;
```

### 3. Tax Calculation Validation (`tax_validation_check`)
Validates that applied tax matches expected tax based on subtotal and rate:
```sql
SELECT 
    invoice_number, 
    vendor_name, 
    subtotal, 
    tax_rate, 
    tax_amount,
    ROUND(subtotal * (tax_rate / 100.0), 2) AS expected_tax,
    ROUND(ABS(tax_amount - (subtotal * (tax_rate / 100.0))), 2) AS tax_discrepancy
FROM (
    SELECT DISTINCT invoice_number, vendor_name, subtotal, tax_rate, tax_amount
    FROM invoices
)
WHERE ABS(tax_amount - (subtotal * (tax_rate / 100.0))) > 0.50;
```

### 4. Missing PO Number Flag (`missing_po_check`)
Identifies rogue or unapproved procurement without a valid Purchase Order (PO):
```sql
SELECT 
    invoice_number, 
    vendor_name, 
    invoice_date, 
    total_amount_due,
    'Missing Purchase Order (PO Number)' AS audit_risk
FROM invoices
WHERE po_number IS NULL 
   OR TRIM(po_number) = '' 
   OR LOWER(po_number) IN ('none', 'n/a', 'null', 'pending');
```

---

## ⚡ Local Setup & Execution Guide

### 1. Requirements
- Python 3.10+
- Google Gemini API Key

### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the project root:
```bash
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Run the Streamlit Application
```bash
streamlit run app.py
```
Open `http://localhost:8501` to access the Light-themed Executive Control Tower with the circular Sun/Moon theme switcher!
