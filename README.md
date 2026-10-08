# 🚀 AutoExtract MIS & Executive Control Tower

> **Production-grade automated unstructured document extraction, DuckDB SQL data hygiene validation, and Executive MIS analytics dashboard.**

---

## 🎯 Executive Overview & Mission
Manual extraction of unstructured vendor invoices, freight receipts, and inconsistent CSVs costs enterprise operations and finance teams thousands of manual hours and creates critical compliance risks.

**AutoExtract MIS & Executive Control Tower** provides an automated data pipeline:
1. **Unstructured Ingestion**: Ingests messy PDF invoices, vendor receipts, and CSV/Excel tables.
2. **Local Layout Parsing (`pdfplumber`)**: Parses tabular bounding boxes and text structures locally.
3. **LLM Schema Extraction (`Google Gemini Flash API`)**: Normalizes raw unformatted text into strictly validated JSON schemas.
4. **DuckDB Analytics & Hygiene Engine**: Executes high-throughput in-memory SQL transformations to detect line-item math mismatches, duplicate vendor bills, and null schema fields.
5. **Executive MIS Control Tower**: Interactive KPI metrics, spend velocity charts, vendor concentration treemaps, and line-item categorization.
6. **Multi-Format Export**: One-click export to cleaned CSV, formatted Excel (`.xlsx`), and ERP-ready JSON schemas.

---

## 🏗️ Architecture & Tech Stack

```
   [ Unstructured PDFs / Invoices / CSVs ]
                    │
                    ▼
     ┌──────────────────────────────┐
     │   Local Layout Extraction    │  --> pdfplumber
     └──────────────┬───────────────┘
                    │ Raw unstructured text & tabular layouts
                    ▼
     ┌──────────────────────────────┐
     │  Gemini Flash API Extractor  │  --> @google/genai / google-genai
     └──────────────┬───────────────┘
                    │ Validated JSON Schema ({ invoice_number, vendor, line_items, ... })
                    ▼
     ┌──────────────────────────────┐
     │   DuckDB In-Memory Engine    │  --> In-memory SQL Hygiene & Transformations
     └──────────────┬───────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│  SQL Validations │  │ cleaned_mis_view │
│  - Math mismatch │  └────────┬─────────┘
│  - Duplicates    │           │
│  - Null values   │           ▼
└──────────────────┘  ┌──────────────────────────────────────────────┐
                      │    Executive MIS Dashboard & Control Tower   │
                      │  - Spend Velocity (Plotly)                   │
                      │  - Vendor Concentration Donut / Treemap      │
                      │  - Category Breakdown                        │
                      │  - Multi-Format Exporter (CSV, Excel, JSON)  │
                      └──────────────────────────────────────────────┘
```

---

## ⚡ Quickstart Guide (Streamlit Execution)

### 1. Prerequisites
- Python 3.10+
- Google Gemini API Key

### 2. Installation
```bash
git clone <repo-url>
cd autoextract-mis

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
GEMINI_API_KEY="your-gemini-api-key-here"
```

### 4. Run Application
```bash
streamlit run app.py
```
Access the application at `http://localhost:8501`.

---

## 🗃️ DuckDB SQL Hygiene Rules

The in-memory DuckDB engine registers raw extracted records into `raw_invoices` and runs three automated audit checks:

### 1. Line Item Calculation Mismatch (`calc_total_mismatch`)
Flags any line item where `(quantity * unit_price)` does not equal `total_amount` within a floating point margin of $0.02:
```sql
SELECT 
    invoice_number, 
    vendor_name, 
    item_description, 
    quantity, 
    unit_price, 
    total_amount,
    ROUND(quantity * unit_price, 2) AS calculated_amount,
    ROUND(ABS(total_amount - (quantity * unit_price)), 2) AS variance
FROM raw_invoices
WHERE ABS(total_amount - (quantity * unit_price)) > 0.02;
```

### 2. Duplicate Check (`duplicate_check`)
Detects identical `invoice_number` + `vendor_name` pairs to avoid double-payment hazards:
```sql
SELECT 
    invoice_number, 
    vendor_name, 
    COUNT(*) as duplicate_occurrences
FROM (
    SELECT DISTINCT invoice_number, vendor_name, invoice_date, total_amount_due 
    FROM raw_invoices
)
GROUP BY invoice_number, vendor_name
HAVING COUNT(*) > 1;
```

### 3. Missing Critical Attributes (`null_check`)
Flags missing critical fields (`invoice_date`, `total_amount_due`, or `vendor_name`):
```sql
SELECT 
    invoice_number, 
    vendor_name, 
    invoice_date, 
    total_amount_due
FROM raw_invoices
WHERE invoice_date IS NULL 
   OR total_amount_due IS NULL 
   OR total_amount_due <= 0 
   OR vendor_name IS NULL 
   OR TRIM(vendor_name) = '';
```

---

## 📊 Dashboard Capabilities
- **KPI Metrics**: Total Spend Incurred, Total Invoices Parsed, Data Quality / Hygiene Score (%), Top Vendor Concentration.
- **Visuals**: Plotly Spend Velocity timeline, Vendor Concentration Donut, Line-Item category bars.
- **Audit Table**: Interactive filterable data grid with discrepancy badges (`Verified`, `Discrepancy Flagged`, `Missing Date`).
- **Exporting**: Cleaned MIS CSV, Excel workbook with stylized headers, and ERP-compatible structured JSON.
