import { SupplierInvoiceRecord } from './types';

export const INITIAL_SUPPLIER_INVOICES: SupplierInvoiceRecord[] = [
  {
    id: 'inv-001',
    invoice_number: 'INV-2026-9081',
    po_number: 'PO-88102',
    vendor_name: 'Apex Cloud Systems',
    invoice_date: '2026-03-12',
    due_date: '2026-04-11',
    currency: 'USD',
    subtotal: 3200.0,
    tax_rate: 10.0,
    tax_amount: 320.0,
    total_amount_due: 3520.0,
    source_type: 'pdf',
    source_file: 'apex_cloud_bill_mar2026.pdf',
    line_items: [
      {
        item_description: 'Dedicated Kubernetes Tier-3 Cluster Hosting',
        quantity: 1.0,
        unit_price: 2400.0,
        total_amount: 2400.0,
      },
      {
        item_description: 'Global Load Balancer & Edge WAF Protection',
        quantity: 2.0,
        unit_price: 400.0,
        total_amount: 800.0,
      },
    ],
  },
  {
    id: 'inv-002',
    invoice_number: 'DISC-7714',
    po_number: 'PO-99120',
    vendor_name: 'Vortex Hardware & Cabling',
    invoice_date: '2026-03-22',
    due_date: '2026-04-05',
    currency: 'USD',
    subtotal: 1750.0,
    tax_rate: 10.0,
    tax_amount: 175.0,
    total_amount_due: 1925.0,
    source_type: 'pdf',
    source_file: 'vortex_bulk_cables_po_99120.pdf',
    line_items: [
      // INTENTIONAL OVERCHARGE: 5 units * $250 = $1,250, but billed $1,750 (+$500 financial leakage!)
      {
        item_description: 'Cat6a Shielded Solid Bulk Patch Cable Spool 1000ft',
        quantity: 5.0,
        unit_price: 250.0,
        total_amount: 1750.0,
      },
    ],
  },
  {
    id: 'inv-003',
    invoice_number: 'INV-2026-9081', // INTENTIONAL DUPLICATE BILLING
    po_number: 'PO-88102',
    vendor_name: 'Apex Cloud Systems',
    invoice_date: '2026-03-12',
    due_date: '2026-04-11',
    currency: 'USD',
    subtotal: 3200.0,
    tax_rate: 10.0,
    tax_amount: 320.0,
    total_amount_due: 3520.0,
    source_type: 'pdf',
    source_file: 'apex_cloud_bill_mar2026_copy.pdf',
    line_items: [
      {
        item_description: 'Dedicated Kubernetes Tier-3 Cluster Hosting',
        quantity: 1.0,
        unit_price: 2400.0,
        total_amount: 2400.0,
      },
      {
        item_description: 'Global Load Balancer & Edge WAF Protection',
        quantity: 2.0,
        unit_price: 400.0,
        total_amount: 800.0,
      },
    ],
  },
  {
    id: 'inv-004',
    invoice_number: 'TAX-ERR-304',
    po_number: 'PO-44109',
    vendor_name: 'Pacific Freight Logistics',
    invoice_date: '2026-03-25',
    due_date: '2026-04-15',
    currency: 'USD',
    subtotal: 4000.0,
    tax_rate: 5.0,
    tax_amount: 600.0, // INTENTIONAL TAX CALCULATION ERROR: 5% of 4000 is $200, but billed $600 (+$400 leakage!)
    total_amount_due: 4600.0,
    source_type: 'pdf',
    source_file: 'pacific_freight_manifest_304.pdf',
    line_items: [
      {
        item_description: 'Trans-Pacific Priority Air Cargo Shipping (240kg)',
        quantity: 2.0,
        unit_price: 2000.0,
        total_amount: 4000.0,
      },
    ],
  },
  {
    id: 'inv-005',
    invoice_number: 'ROGUE-PO-909',
    po_number: null, // INTENTIONAL MISSING PO (UNAPPROVED PROCUREMENT HAZARD)
    vendor_name: 'Quantum Office Supplies',
    invoice_date: '2026-03-28',
    due_date: '2026-04-10',
    currency: 'USD',
    subtotal: 1200.0,
    tax_rate: 8.0,
    tax_amount: 96.0,
    total_amount_due: 1296.0,
    source_type: 'csv',
    source_file: 'march_procurement_batch.csv',
    line_items: [
      {
        item_description: 'Executive Ergonomic Mesh Office Chairs',
        quantity: 4.0,
        unit_price: 300.0,
        total_amount: 1200.0,
      },
    ],
  },
  {
    id: 'inv-006',
    invoice_number: 'CYBER-5501',
    po_number: 'PO-77291',
    vendor_name: 'CyberShield Defense Corp',
    invoice_date: '2026-03-30',
    due_date: '2026-04-29',
    currency: 'USD',
    subtotal: 5400.0,
    tax_rate: 0.0,
    tax_amount: 0.0,
    total_amount_due: 5400.0,
    source_type: 'pdf',
    source_file: 'cybershield_endpoint_license.pdf',
    line_items: [
      {
        item_description: 'Endpoint Zero Trust Enterprise User Licenses Tier-1',
        quantity: 60.0,
        unit_price: 90.0,
        total_amount: 5400.0,
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
    title: 'AWS Enterprise Supplier Invoice (PDF Layout)',
    vendor: 'Amazon Web Services, Inc.',
    category: 'Cloud Infrastructure',
    rawText: `=======================================================
AMAZON WEB SERVICES, INC. - OFFICIAL TAX INVOICE
INVOICE NUMBER: AWS-2026-781920
PURCHASE ORDER: PO-10928
Invoice Date: 2026-03-24
Payment Due Date: 2026-04-23
Customer: Acquired Enterprise Global LLC
Currency: USD

LINE ITEMS / USAGE CHARGES:
-------------------------------------------------------
1. Amazon EC2 Compute (c6g.4xlarge instances)
   Quantity: 120.00 Hrs  |  Unit Price: 18.50  |  Total: 2,220.00
2. Amazon S3 Glacier Flexible Multi-TB Storage
   Quantity: 1.00 Batch  |  Unit Price: 450.00  |  Total: 450.00
3. Elastic Network Data Transfer Out
   Quantity: 10.00 TB    |  Unit Price: 80.00   |  Total: 800.00

Subtotal: $3,470.00
Tax Rate: 8.5%
Tax Amount: $294.95
TOTAL AMOUNT DUE: $3,764.95
Wire Details: J.P. Morgan Chase / ABA: 021000021
=======================================================`,
  },
  {
    title: 'Apex Freight Manifest (Unstructured Supplier Bill)',
    vendor: 'Apex Ocean & Air Shipping',
    category: 'Logistics',
    rawText: `APEX FREIGHT & SUPPLY CHAIN LOGISTICS LTD
Commercial Biller: Apex Ocean & Air Shipping Ltd
Document Reference: SHP-99104
Purchase Order Ref: PO-44910
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

Subtotal: $4,020.00
Tax Rate: 0.0%
Tax Amount: $0.00
Grand Balance Due: $4,020.00`,
  },
  {
    title: 'Vortex Cabling & Hardware (Overcharge Risk)',
    vendor: 'Vortex Hardware Supplies',
    category: 'Hardware PO Audit',
    rawText: `VORTEX HARDWARE SUPPLIES - INVOICE
Invoice No: DISC-8819
PO Number: PO-33211
Date: 2026-03-29
Due Date: 2026-04-14
Currency: USD

Items:
Cat6 Bulk Spool 1000ft
Qty: 4.0 | Unit: $200.00 | Billed Total: $1,100.00 (Math Mismatch: 4 * 200 = 800)

Subtotal: $1,100.00
Tax Rate: 10%
Tax: $110.00
Total Due: $1,210.00`,
  },
];
