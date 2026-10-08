import { InvoiceRecord } from './types';

export const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: 'inv-001',
    invoice_number: 'INV-2026-9081',
    vendor_name: 'Apex Cloud Systems',
    invoice_date: '2026-03-12',
    due_date: '2026-04-11',
    currency: 'USD',
    tax_amount: 320.0,
    total_amount_due: 3520.0,
    source_type: 'pdf',
    source_file: 'apex_cloud_invoice_march2026.pdf',
    line_items: [
      {
        item_description: 'Dedicated Kubernetes Cluster Hosting Tier-3',
        quantity: 1.0,
        unit_price: 2400.0,
        total_amount: 2400.0,
      },
      {
        item_description: 'Global Anycast Load Balancer & WAF',
        quantity: 2.0,
        unit_price: 400.0,
        total_amount: 800.0,
      },
    ],
  },
  {
    id: 'inv-002',
    invoice_number: 'FLT-88219',
    vendor_name: 'Pacific Freight Logistics',
    invoice_date: '2026-03-15',
    due_date: '2026-03-30',
    currency: 'USD',
    tax_amount: 150.0,
    total_amount_due: 4150.0,
    source_type: 'pdf',
    source_file: 'pacific_freight_manifest_88219.pdf',
    line_items: [
      {
        item_description: 'Trans-Pacific Priority Air Freight (240kg Cargo)',
        quantity: 1.0,
        unit_price: 2800.0,
        total_amount: 2800.0,
      },
      {
        item_description: 'Customs Expedited Brokerage Clearance',
        quantity: 1.0,
        unit_price: 1200.0,
        total_amount: 1200.0,
      },
    ],
  },
  {
    id: 'inv-003',
    invoice_number: 'CYBER-4022',
    vendor_name: 'CyberShield Defense Corp',
    invoice_date: '2026-03-20',
    due_date: '2026-04-19',
    currency: 'USD',
    tax_amount: 0.0,
    total_amount_due: 5400.0,
    source_type: 'pdf',
    source_file: 'cybershield_endpoint_q1.pdf',
    line_items: [
      {
        item_description: 'Endpoint Zero Trust Enterprise User Licenses',
        quantity: 60.0,
        unit_price: 90.0,
        total_amount: 5400.0,
      },
    ],
  },
  {
    id: 'inv-004',
    invoice_number: 'DISC-7714',
    vendor_name: 'Vortex Hardware & Supplies',
    invoice_date: '2026-03-22',
    due_date: '2026-04-05',
    currency: 'USD',
    tax_amount: 75.0,
    total_amount_due: 1825.0,
    source_type: 'pdf',
    source_file: 'vortex_cables_po_7714.pdf',
    line_items: [
      // INTENTIONAL MATH MISMATCH FOR DUCKDB HYGIENE CHECK
      // 5 * 250 = 1,250, but stated line total is 1,750!
      {
        item_description: 'Cat6a Shielded Solid Bulk Patch Cable Spool 1000ft',
        quantity: 5.0,
        unit_price: 250.0,
        total_amount: 1750.0,
      },
    ],
  },
  {
    id: 'inv-005',
    invoice_number: 'INV-2026-9081', // INTENTIONAL DUPLICATE RECORD FOR DUCKDB DUPLICATE CHECK
    vendor_name: 'Apex Cloud Systems',
    invoice_date: '2026-03-12',
    due_date: '2026-04-11',
    currency: 'USD',
    tax_amount: 320.0,
    total_amount_due: 3520.0,
    source_type: 'pdf',
    source_file: 'apex_cloud_invoice_march2026_copy.pdf',
    line_items: [
      {
        item_description: 'Dedicated Kubernetes Cluster Hosting Tier-3',
        quantity: 1.0,
        unit_price: 2400.0,
        total_amount: 2400.0,
      },
    ],
  },
  {
    id: 'inv-006',
    invoice_number: 'NULL-DATE-01', // INTENTIONAL MISSING INVOICE DATE FOR DUCKDB NULL CHECK
    vendor_name: 'QuickPrint Media & Marketing',
    invoice_date: null,
    due_date: '2026-04-01',
    currency: 'USD',
    tax_amount: 40.0,
    total_amount_due: 840.0,
    source_type: 'csv',
    source_file: 'marketing_vendor_batch.csv',
    line_items: [
      {
        item_description: 'Executive Boardroom Annual Report Hardcover Booklets',
        quantity: 40.0,
        unit_price: 20.0,
        total_amount: 800.0,
      },
    ],
  },
  {
    id: 'inv-007',
    invoice_number: 'BIO-29014',
    vendor_name: 'Quantum Bio Analytics',
    invoice_date: '2026-03-27',
    due_date: '2026-04-26',
    currency: 'USD',
    tax_amount: 450.0,
    total_amount_due: 6450.0,
    source_type: 'pdf',
    source_file: 'quantum_genomic_sequencing_29014.pdf',
    line_items: [
      {
        item_description: 'High-Throughput Genomic Pipeline Processing Hours',
        quantity: 40.0,
        unit_price: 150.0,
        total_amount: 6000.0,
      },
    ],
  },
];

export interface UnstructuredPreset {
  title: string;
  vendor: string;
  category: string;
  rawText: string;
}

export const UNSTRUCTURED_PRESETS: UnstructuredPreset[] = [
  {
    title: 'AWS Enterprise Cloud Bill (Messy PDF Text)',
    vendor: 'Amazon Web Services, Inc.',
    category: 'Cloud Infrastructure',
    rawText: `=======================================================
AMAZON WEB SERVICES, INC. - OFFICIAL TAX INVOICE
INVOICE NUMBER: AWS-2026-781920
Invoice Date: March 24, 2026
Payment Due Date: April 23, 2026
Customer: Acquired Enterprise Global LLC
Currency: USD

LINE ITEMS / USAGE CHARGES:
-------------------------------------------------------
1. Amazon EC2 Compute (c6g.4xlarge instances - us-east-1)
   Quantity: 120.00 Hrs  |  Unit Price: 18.50  |  Total: 2,220.00
2. Amazon S3 Glacier Flexible Archive Multi-TB
   Quantity: 1.00 Batch  |  Unit Price: 450.00  |  Total: 450.00
3. Elastic Network Data Transfer Out
   Quantity: 10.00 TB    |  Unit Price: 80.00   |  Total: 800.00

Subtotal: $3,470.00
State & City Tax (8.5%): $294.95
TOTAL AMOUNT DUE: $3,764.95
Wire Instructions: J.P. Morgan Chase / Routing: 021000021
=======================================================`,
  },
  {
    title: 'Apex Global Freight Manifest (Unstructured Layout)',
    vendor: 'Apex Ocean & Air Shipping',
    category: 'Logistics',
    rawText: `APEX FREIGHT & SUPPLY CHAIN LOGISTICS
Commercial Biller: Apex Ocean & Air Shipping Ltd
Document Reference: SHP-99104
Date of Billing: 2026-03-28
Terms: NET 15 (Due: 2026-04-12)
Currency: USD

Itemized Breakdown:
- Full Container Load (FCL) Drayage & Port Handling:
  Qty: 2.0  x  Unit Rate: $1,650.00  =  $3,300.00
- Ocean Carrier Bunker Fuel Surcharge:
  Qty: 1.0  x  Unit Rate: $540.00  =  $540.00
- Port Security & Documentation Fee:
  Qty: 1.0  x  Unit Rate: $180.00  =  $180.00

Sales Tax Exempt (Overseas Freight): $0.00
Grand Balance Due: $4,020.00`,
  },
  {
    title: 'CyberShield Sentinel Security (Receipt)',
    vendor: 'Sentinel Shield Networks',
    category: 'Cybersecurity SaaS',
    rawText: `SENTINEL SHIELD NETWORKS - INVOICE
Receipt Number: SSN-2026-114
Billed on: 2026-03-31
Due Date: 2026-04-30
Currency: USD
Client: FinOps Analytics Core

Description of Services:
SIEM Continuous Threat Detection Engine
Quantity: 1.0 | Unit: $2,900.00 | Total: 2,900.00
24/7 Managed SOC Tier-1 Escalation
Quantity: 1.0 | Unit: $1,500.00 | Total: 1,500.00

Tax Rate: 0%
Total Payable: $4,400.00`,
  },
];
