export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type BaseRow = {
  id: string
  user_id: string
  payload: Json
  created_at: string
  updated_at: string
}

type BaseInsert = Partial<Omit<BaseRow, "user_id">> & { user_id: string }
type BaseUpdate = Partial<BaseRow>

type ProfileRow = BaseRow & {
  display_name: string | null
  email: string | null
  phone: string | null
  photo_url: string | null
}

type BusinessProfileRow = BaseRow & {
  profile_id: string | null
  business_name: string | null
  owner_name: string | null
  gstin: string | null
  business_type: string | null
  phone: string | null
  email: string | null
  logo_url: string | null
  address: string | null
  city: string | null
  district: string | null
  state: string | null
  pincode: string | null
  upi_id: string | null
  bank_name: string | null
  account_holder_name: string | null
  account_number: string | null
  ifsc_code: string | null
  invoice_prefix: string | null
  terms: string | null
}

type ProductCategoryRow = Omit<BaseRow, "payload"> & {
  name: string
  description: string | null
}

type ProductRow = BaseRow & {
  category_id: string | null
  name: string
  category: string | null
  sku: string | null
  barcode: string | null
  hsn_code: string | null
  gst_rate: number | null
  quantity: number
  quantity_unit: string | null
  price: number
  purchase_price: number | null
  sale_price: number | null
  low_stock_threshold: number | null
  critical_stock_threshold: number | null
  supplier: string | null
  expiry: string | null
  note: string | null
}

type PartyRow = BaseRow & {
  type: string
  name: string
  mobile: string | null
  phone: string | null
  email: string | null
  gstin: string | null
  address: string | null
  city: string | null
  district: string | null
  state: string | null
  pincode: string | null
  receivable: number
  payable: number
  notes: string | null
}

type CustomerSupplierRow = BaseRow & {
  party_id: string | null
  name: string
  mobile: string | null
  phone: string | null
  email: string | null
  gstin: string | null
  address: string | null
  city: string | null
  state: string | null
  pincode: string | null
  balance_due: number
}

type InventoryTransactionRow = BaseRow & {
  product_id: string | null
  party_id: string | null
  type: string
  quantity_change: number
  quantity_after: number | null
  quantity_unit: string | null
  price: number | null
  expiry: string | null
  reason: string | null
  note: string | null
  source_type: string | null
  source_id: string | null
  transaction_at: string
}

type SaleRow = BaseRow & {
  customer_id: string | null
  party_id: string | null
  receipt_no: string | null
  sale_date: string | null
  sale_date_time: string
  payment_status: string | null
  payment_mode: string | null
  taxable_amount: number | null
  cgst_total: number | null
  sgst_total: number | null
  igst_total: number | null
  gst_amount: number | null
  discount_amount: number | null
  total_amount: number | null
  amount_paid: number | null
  due_amount: number | null
  note: string | null
  status: string | null
}

type SaleItemRow = BaseRow & {
  sale_id: string
  product_id: string | null
  name: string
  hsn_code: string | null
  quantity: number
  quantity_unit: string | null
  rate: number | null
  sale_price: number | null
  discount: number | null
  gst_rate: number | null
  taxable_amount: number | null
  cgst_amount: number | null
  sgst_amount: number | null
  igst_amount: number | null
  total_amount: number | null
}

type PurchaseRow = BaseRow & {
  supplier_id: string | null
  party_id: string | null
  bill_no: string | null
  purchase_date: string | null
  purchase_date_time: string
  payment_status: string | null
  payment_mode: string | null
  entry_mode: string | null
  details_status: string | null
  taxable_amount: number | null
  cgst_total: number | null
  sgst_total: number | null
  igst_total: number | null
  gst_amount: number | null
  total_amount: number | null
  amount_paid: number | null
  due_amount: number | null
  note: string | null
}

type PurchaseItemRow = BaseRow & {
  purchase_id: string
  product_id: string | null
  name: string
  hsn_code: string | null
  quantity: number
  quantity_unit: string | null
  rate: number | null
  purchase_price: number | null
  gst_rate: number | null
  taxable_amount: number | null
  cgst_amount: number | null
  sgst_amount: number | null
  igst_amount: number | null
  total_amount: number | null
}

type GstInvoiceRow = BaseRow & {
  sale_id: string | null
  customer_id: string | null
  party_id: string | null
  business_profile_id: string | null
  invoice_no: string | null
  invoice_date: string | null
  due_date: string | null
  copy_mode: string | null
  status: string | null
  place_of_supply: string | null
  seller_state: string | null
  buyer_state: string | null
  is_interstate: boolean | null
  taxable_amount: number | null
  cgst_total: number | null
  sgst_total: number | null
  igst_total: number | null
  total_gst: number | null
  grand_total: number | null
  amount_paid: number | null
  due_amount: number | null
  notes: string | null
  terms: string | null
}

type GstInvoiceItemRow = BaseRow & {
  gst_invoice_id: string
  product_id: string | null
  name: string
  description: string | null
  hsn_code: string | null
  quantity: number
  unit: string | null
  rate: number | null
  discount: number | null
  gst_rate: number | null
  taxable_amount: number | null
  cgst_amount: number | null
  sgst_amount: number | null
  igst_amount: number | null
  total_amount: number | null
}

type PaymentRow = BaseRow & {
  party_id: string | null
  customer_id: string | null
  supplier_id: string | null
  sale_id: string | null
  purchase_id: string | null
  gst_invoice_id: string | null
  direction: string
  amount: number
  payment_mode: string | null
  payment_status: string | null
  reference: string | null
  note: string | null
  paid_at: string
}

type ExpenseRow = BaseRow & {
  expense_no: string | null
  category: string | null
  amount: number
  expense_date: string | null
  expense_date_time: string
  payment_mode: string | null
  reference: string | null
  note: string | null
}

type CashbookEntryRow = BaseRow & {
  entry_no: string | null
  type: string
  account: string | null
  amount: number
  entry_date: string | null
  entry_date_time: string
  source_type: string | null
  source_id: string | null
  reference: string | null
  note: string | null
}

type PartyLedgerRow = BaseRow & {
  party_id: string | null
  direction: string
  amount: number
  due_amount: number | null
  reference: string | null
  source_type: string | null
  source_id: string | null
  note: string | null
  entry_at: string
}

type SyncMetadataRow = BaseRow & {
  collection_name: string
  last_pulled_at: string | null
  last_pushed_at: string | null
  last_error: string | null
  device_id: string | null
}

type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: Array<{
    foreignKeyName: string
    columns: string[]
    referencedRelation: string
    referencedColumns: string[]
  }>
}

export type Database = {
  public: {
    Tables: {
      profiles: TableDef<ProfileRow, BaseInsert & Partial<ProfileRow>, BaseUpdate & Partial<ProfileRow>>
      business_profiles: TableDef<BusinessProfileRow, BaseInsert & Partial<BusinessProfileRow>, BaseUpdate & Partial<BusinessProfileRow>>
      product_categories: TableDef<ProductCategoryRow, { user_id: string; name: string } & Partial<ProductCategoryRow>, Partial<ProductCategoryRow>>
      products: TableDef<ProductRow, { user_id: string; name: string } & Partial<ProductRow>, Partial<ProductRow>>
      inventory_transactions: TableDef<InventoryTransactionRow, { user_id: string; type: string } & Partial<InventoryTransactionRow>, Partial<InventoryTransactionRow>>
      parties: TableDef<PartyRow, { user_id: string; name: string } & Partial<PartyRow>, Partial<PartyRow>>
      customers: TableDef<CustomerSupplierRow, { user_id: string; name: string } & Partial<CustomerSupplierRow>, Partial<CustomerSupplierRow>>
      suppliers: TableDef<CustomerSupplierRow, { user_id: string; name: string } & Partial<CustomerSupplierRow>, Partial<CustomerSupplierRow>>
      party_ledger: TableDef<PartyLedgerRow, { user_id: string; direction: string; amount: number } & Partial<PartyLedgerRow>, Partial<PartyLedgerRow>>
      sales: TableDef<SaleRow, { user_id: string } & Partial<SaleRow>, Partial<SaleRow>>
      sale_items: TableDef<SaleItemRow, { user_id: string; sale_id: string; name: string } & Partial<SaleItemRow>, Partial<SaleItemRow>>
      purchases: TableDef<PurchaseRow, { user_id: string } & Partial<PurchaseRow>, Partial<PurchaseRow>>
      purchase_items: TableDef<PurchaseItemRow, { user_id: string; purchase_id: string; name: string } & Partial<PurchaseItemRow>, Partial<PurchaseItemRow>>
      gst_invoices: TableDef<GstInvoiceRow, { user_id: string } & Partial<GstInvoiceRow>, Partial<GstInvoiceRow>>
      gst_invoice_items: TableDef<GstInvoiceItemRow, { user_id: string; gst_invoice_id: string; name: string } & Partial<GstInvoiceItemRow>, Partial<GstInvoiceItemRow>>
      payments: TableDef<PaymentRow, { user_id: string; direction: string; amount: number } & Partial<PaymentRow>, Partial<PaymentRow>>
      expenses: TableDef<ExpenseRow, { user_id: string; amount: number } & Partial<ExpenseRow>, Partial<ExpenseRow>>
      cashbook_entries: TableDef<CashbookEntryRow, { user_id: string; type: string; amount: number } & Partial<CashbookEntryRow>, Partial<CashbookEntryRow>>
      sync_metadata: TableDef<SyncMetadataRow, { user_id: string; collection_name: string } & Partial<SyncMetadataRow>, Partial<SyncMetadataRow>>
    }
    Views: {
      stock_history: { Row: InventoryTransactionRow; Relationships: [] }
      invoices: { Row: GstInvoiceRow; Relationships: [] }
    }
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type PublicTableName = keyof Database["public"]["Tables"]
export type PublicTableRow<TableName extends PublicTableName> = Database["public"]["Tables"][TableName]["Row"]
