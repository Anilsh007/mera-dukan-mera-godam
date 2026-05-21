import type { GSTInvoiceRecord } from "@/app/dashboard/gst-invoice/types/gst.types"
import type { ProductLog, PurchaseRecord, ReturnDocumentRecord, SaleRecord } from "@/app/lib/db"
import { isValidGstin, roundCurrency } from "@/app/lib/gst.utils"
import type { AccountingExportRow } from "@/app/lib/accounting/accounting.export"
import { en } from "@/app/messages/en"

export type GstReportRange = {
  from: string
  to: string
}

export type GstRegisterSource = "invoice" | "sale" | "purchase"

export type GstRegisterLine = {
  id: string
  source: GstRegisterSource
  documentNo: string
  date: string
  partyName: string
  gstin?: string
  itemName: string
  hsnCode?: string
  quantity: number
  unit: string
  taxableAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  gstAmount: number
  totalAmount: number
}

export type HsnSummaryRow = {
  hsnCode: string
  quantity: number
  outwardTaxable: number
  outwardGst: number
  inwardTaxable: number
  inwardGst: number
  netTaxable: number
  netGst: number
}

export type PartyGstSummaryRow = {
  partyName: string
  gstin?: string
  documentCount: number
  taxableAmount: number
  gstAmount: number
  totalAmount: number
}

export type GstSummaryLine = {
  label: string
  taxableAmount: number
  cgstAmount: number
  sgstAmount: number
  igstAmount: number
  gstAmount: number
  totalAmount: number
}

export type GstReportsSummary = {
  salesRegister: GstRegisterLine[]
  purchaseRegister: GstRegisterLine[]
  hsnSummary: HsnSummaryRow[]
  b2bSummary: PartyGstSummaryRow[]
  b2cSummary: PartyGstSummaryRow[]
  gstr1Summary: GstSummaryLine[]
  gstr3bSummary: GstSummaryLine[]
  collectedPaidSummary: GstSummaryLine[]
  creditNoteSummary: GstSummaryLine
  debitNoteSummary: GstSummaryLine
  totals: {
    salesTaxable: number
    salesGst: number
    salesTotal: number
    purchaseTaxable: number
    purchaseGst: number
    purchaseTotal: number
    gstCollected: number
    gstPaid: number
    netGstPayable: number
  }
}

export type GstReportsInput = {
  invoices: GSTInvoiceRecord[]
  sales: SaleRecord[]
  purchases: PurchaseRecord[]
  productLogs: ProductLog[]
  returnDocuments: ReturnDocumentRecord[]
  range: GstReportRange
}

export function buildGstReportsSummary(input: GstReportsInput): GstReportsSummary {
  const salesRegister = buildGstSalesRegister(input.invoices, input.sales, input.range)
  const purchaseRegister = buildGstPurchaseRegister(input.purchases, input.productLogs, input.range)
  const creditNoteSummary = buildReturnDocumentSummary(input.returnDocuments, input.range, "credit-note", en.gstReports.creditNote)
  const debitNoteSummary = buildReturnDocumentSummary(input.returnDocuments, input.range, "debit-note", en.gstReports.debitNote)
  const hsnSummary = buildHsnSummary(salesRegister, purchaseRegister)
  const b2bSummary = buildPartySummary(salesRegister.filter((line) => Boolean(line.gstin?.trim()) && isValidGstin(line.gstin)))
  const b2cSummary = buildPartySummary(salesRegister.filter((line) => !line.gstin?.trim() || !isValidGstin(line.gstin)))
  const salesTotals = sumRegister(salesRegister)
  const purchaseTotals = sumRegister(purchaseRegister)
  const gstCollected = roundCurrency(salesTotals.gstAmount + debitNoteSummary.gstAmount - creditNoteSummary.gstAmount)
  const gstPaid = purchaseTotals.gstAmount
  const netGstPayable = roundCurrency(Math.max(gstCollected - gstPaid, 0))

  return {
    salesRegister,
    purchaseRegister,
    hsnSummary,
    b2bSummary,
    b2cSummary,
    creditNoteSummary,
    debitNoteSummary,
    gstr1Summary: buildGstr1Summary(salesRegister, creditNoteSummary, debitNoteSummary),
    gstr3bSummary: buildGstr3bSummary(salesRegister, purchaseRegister, creditNoteSummary, debitNoteSummary),
    collectedPaidSummary: [
      buildSummaryLine(en.gstReports.gstCollected, 0, 0, 0, 0, gstCollected, gstCollected),
      buildSummaryLine(en.gstReports.gstPaid, 0, 0, 0, 0, gstPaid, gstPaid),
      buildSummaryLine(en.gstReports.netGstPayable, 0, 0, 0, 0, netGstPayable, netGstPayable),
    ],
    totals: {
      salesTaxable: salesTotals.taxableAmount,
      salesGst: salesTotals.gstAmount,
      salesTotal: salesTotals.totalAmount,
      purchaseTaxable: purchaseTotals.taxableAmount,
      purchaseGst: purchaseTotals.gstAmount,
      purchaseTotal: purchaseTotals.totalAmount,
      gstCollected,
      gstPaid,
      netGstPayable,
    },
  }
}

function buildGstSalesRegister(invoices: GSTInvoiceRecord[], sales: SaleRecord[], range: GstReportRange): GstRegisterLine[] {
  const invoiceLines = invoices
    .filter((invoice) => isDateInRange(invoice.invoiceDate || invoice.createdAt, range))
    .flatMap((invoice) =>
      invoice.items.map((item, index) => ({
        id: `${invoice.id}:invoice:${index}`,
        source: "invoice" as const,
        documentNo: invoice.invoiceNo || invoice.id,
        date: invoice.invoiceDate || invoice.createdAt,
        partyName: invoice.buyer?.name || invoice.buyerName || en.gstReports.walkInCustomer,
        gstin: invoice.buyer?.gstin || undefined,
        itemName: item.name || en.reports.product,
        hsnCode: item.hsnCode || undefined,
        quantity: toNumber(item.quantity),
        unit: item.unit || "pcs",
        taxableAmount: roundCurrency(Number(item.taxableValue || 0)),
        cgstAmount: roundCurrency(Number(item.cgstAmount || 0)),
        sgstAmount: roundCurrency(Number(item.sgstAmount || 0)),
        igstAmount: roundCurrency(Number(item.igstAmount || 0)),
        gstAmount: roundCurrency(Number(item.cgstAmount || 0) + Number(item.sgstAmount || 0) + Number(item.igstAmount || 0)),
        totalAmount: roundCurrency(Number(item.total || 0)),
      })),
    )

  const saleLines = sales
    .filter((sale) => sale.status !== "cancelled")
    .filter((sale) => isDateInRange(sale.saleDate || sale.createdAt, range))
    .flatMap((sale) =>
      sale.items.map((item, index) => ({
        id: `${sale.id}:sale:${index}`,
        source: "sale" as const,
        documentNo: sale.receiptNo || sale.id,
        date: sale.saleDate || sale.createdAt,
        partyName: sale.customer?.name || en.gstReports.walkInCustomer,
        gstin: sale.customer?.gstin || undefined,
        itemName: item.name || en.reports.product,
        hsnCode: item.hsnCode || undefined,
        quantity: Number(item.quantity || 0),
        unit: item.quantityUnit || "pcs",
        taxableAmount: roundCurrency(Number(item.taxableAmount || 0)),
        cgstAmount: roundCurrency(Number(item.cgstAmount || 0)),
        sgstAmount: roundCurrency(Number(item.sgstAmount || 0)),
        igstAmount: roundCurrency(Number(item.igstAmount || 0)),
        gstAmount: roundCurrency(Number(item.gstAmount || 0)),
        totalAmount: roundCurrency(Number(item.lineTotal || 0)),
      })),
    )

  return [...invoiceLines, ...saleLines].sort((left, right) => right.date.localeCompare(left.date))
}

function buildGstPurchaseRegister(purchases: PurchaseRecord[], productLogs: ProductLog[], range: GstReportRange): GstRegisterLine[] {
  const logsByTransaction = productLogs.reduce((map, log) => {
    if (!log.transactionId) return map
    const current = map.get(log.transactionId) || []
    current.push(log)
    map.set(log.transactionId, current)
    return map
  }, new Map<string, ProductLog[]>())

  return purchases
    .filter((purchase) => isDateInRange(purchase.purchaseDate || purchase.createdAt, range))
    .flatMap((purchase) => {
      const logs = logsByTransaction.get(purchase.id) || []
      return purchase.items.map((item, index) => {
        const matchedLog = logs.find((log) => log.productId === item.productId || log.productName === item.name)
        const taxableAmount = roundCurrency(Number(matchedLog?.taxableAmount ?? item.lineTotal))
        const cgstAmount = roundCurrency(Number(matchedLog?.cgstAmount || 0))
        const sgstAmount = roundCurrency(Number(matchedLog?.sgstAmount || 0))
        const igstAmount = roundCurrency(Number(matchedLog?.igstAmount || 0))
        const gstAmount = roundCurrency(Number(matchedLog?.gstAmount || cgstAmount + sgstAmount + igstAmount))
        return {
          id: `${purchase.id}:purchase:${index}`,
          source: "purchase" as const,
          documentNo: purchase.billNo || purchase.id,
          date: purchase.purchaseDate || purchase.createdAt,
          partyName: purchase.supplierName || en.gstReports.supplier,
          itemName: item.name || en.reports.product,
          hsnCode: item.hsnCode || undefined,
          quantity: Number(item.quantity || 0),
          unit: item.quantityUnit || "pcs",
          taxableAmount,
          cgstAmount,
          sgstAmount,
          igstAmount,
          gstAmount,
          totalAmount: roundCurrency(taxableAmount + gstAmount),
        }
      })
    })
    .sort((left, right) => right.date.localeCompare(left.date))
}

function buildHsnSummary(salesRegister: GstRegisterLine[], purchaseRegister: GstRegisterLine[]): HsnSummaryRow[] {
  const map = new Map<string, HsnSummaryRow>()
  const ensure = (hsnCode?: string) => {
    const key = hsnCode?.trim() || en.gstReports.unclassifiedHsn
    const existing = map.get(key)
    if (existing) return existing
    const created: HsnSummaryRow = {
      hsnCode: key,
      quantity: 0,
      outwardTaxable: 0,
      outwardGst: 0,
      inwardTaxable: 0,
      inwardGst: 0,
      netTaxable: 0,
      netGst: 0,
    }
    map.set(key, created)
    return created
  }

  for (const line of salesRegister) {
    const row = ensure(line.hsnCode)
    row.quantity += Number(line.quantity || 0)
    row.outwardTaxable += line.taxableAmount
    row.outwardGst += line.gstAmount
  }

  for (const line of purchaseRegister) {
    const row = ensure(line.hsnCode)
    row.quantity += Number(line.quantity || 0)
    row.inwardTaxable += line.taxableAmount
    row.inwardGst += line.gstAmount
  }

  return Array.from(map.values())
    .map((row) => ({
      ...row,
      quantity: roundCurrency(row.quantity),
      outwardTaxable: roundCurrency(row.outwardTaxable),
      outwardGst: roundCurrency(row.outwardGst),
      inwardTaxable: roundCurrency(row.inwardTaxable),
      inwardGst: roundCurrency(row.inwardGst),
      netTaxable: roundCurrency(row.outwardTaxable - row.inwardTaxable),
      netGst: roundCurrency(row.outwardGst - row.inwardGst),
    }))
    .sort((left, right) => right.outwardTaxable + right.inwardTaxable - (left.outwardTaxable + left.inwardTaxable))
}

function buildPartySummary(lines: GstRegisterLine[]): PartyGstSummaryRow[] {
  const map = new Map<string, PartyGstSummaryRow>()
  const documentsByKey = new Map<string, Set<string>>()

  for (const line of lines) {
    const key = `${line.gstin || "b2c"}:${line.partyName || en.gstReports.walkInCustomer}`
    const row = map.get(key) || {
      partyName: line.partyName || en.gstReports.walkInCustomer,
      gstin: line.gstin,
      documentCount: 0,
      taxableAmount: 0,
      gstAmount: 0,
      totalAmount: 0,
    }
    row.taxableAmount += line.taxableAmount
    row.gstAmount += line.gstAmount
    row.totalAmount += line.totalAmount
    map.set(key, row)

    const docs = documentsByKey.get(key) || new Set<string>()
    docs.add(line.documentNo)
    documentsByKey.set(key, docs)
  }

  return Array.from(map.entries())
    .map(([key, row]) => ({
      ...row,
      documentCount: documentsByKey.get(key)?.size || 0,
      taxableAmount: roundCurrency(row.taxableAmount),
      gstAmount: roundCurrency(row.gstAmount),
      totalAmount: roundCurrency(row.totalAmount),
    }))
    .sort((left, right) => right.totalAmount - left.totalAmount)
}

function buildGstr1Summary(salesRegister: GstRegisterLine[], creditNoteSummary: GstSummaryLine, debitNoteSummary: GstSummaryLine): GstSummaryLine[] {
  const b2b = sumRegister(salesRegister.filter((line) => Boolean(line.gstin?.trim()) && isValidGstin(line.gstin)))
  const b2c = sumRegister(salesRegister.filter((line) => !line.gstin?.trim() || !isValidGstin(line.gstin)))
  const exportsOrNil = buildSummaryLine(en.gstReports.nilRatedPlaceholder, 0, 0, 0, 0, 0, 0)
  const net = combineSummaryLines(en.gstReports.gstr1NetOutward, [
    registerTotalsToLine(en.gstReports.outwardSupply, sumRegister(salesRegister)),
    debitNoteSummary,
  ], [creditNoteSummary])

  return [
    registerTotalsToLine(en.gstReports.b2bSummary, b2b),
    registerTotalsToLine(en.gstReports.b2cSummary, b2c),
    creditNoteSummary,
    debitNoteSummary,
    exportsOrNil,
    net,
  ]
}

function buildGstr3bSummary(
  salesRegister: GstRegisterLine[],
  purchaseRegister: GstRegisterLine[],
  creditNoteSummary: GstSummaryLine,
  debitNoteSummary: GstSummaryLine,
): GstSummaryLine[] {
  const outward = combineSummaryLines(en.gstReports.outwardTaxableSupply, [
    registerTotalsToLine(en.gstReports.outwardSupply, sumRegister(salesRegister)),
    debitNoteSummary,
  ], [creditNoteSummary])
  const inward = registerTotalsToLine(en.gstReports.eligibleItc, sumRegister(purchaseRegister))
  const netPayable = buildSummaryLine(
    en.gstReports.netGstPayable,
    0,
    Math.max(outward.cgstAmount - inward.cgstAmount, 0),
    Math.max(outward.sgstAmount - inward.sgstAmount, 0),
    Math.max(outward.igstAmount - inward.igstAmount, 0),
    Math.max(outward.gstAmount - inward.gstAmount, 0),
    Math.max(outward.gstAmount - inward.gstAmount, 0),
  )

  return [outward, inward, netPayable]
}

function buildReturnDocumentSummary(
  documents: ReturnDocumentRecord[],
  range: GstReportRange,
  kind: ReturnDocumentRecord["kind"],
  label: string,
): GstSummaryLine {
  const matching = documents.filter((document) => document.kind === kind && isDateInRange(document.documentDate || document.createdAt, range))
  return matching.reduce(
    (acc, document) => ({
      ...acc,
      taxableAmount: roundCurrency(acc.taxableAmount + Number(document.taxableAmount || 0)),
      cgstAmount: roundCurrency(acc.cgstAmount + document.items.reduce((sum, item) => sum + Number(item.cgstAmount || 0), 0)),
      sgstAmount: roundCurrency(acc.sgstAmount + document.items.reduce((sum, item) => sum + Number(item.sgstAmount || 0), 0)),
      igstAmount: roundCurrency(acc.igstAmount + document.items.reduce((sum, item) => sum + Number(item.igstAmount || 0), 0)),
      gstAmount: roundCurrency(acc.gstAmount + Number(document.gstAmount || 0)),
      totalAmount: roundCurrency(acc.totalAmount + Number(document.totalAmount || 0)),
    }),
    buildSummaryLine(label, 0, 0, 0, 0, 0, 0),
  )
}

function sumRegister(lines: GstRegisterLine[]) {
  return lines.reduce(
    (acc, line) => ({
      taxableAmount: roundCurrency(acc.taxableAmount + line.taxableAmount),
      cgstAmount: roundCurrency(acc.cgstAmount + line.cgstAmount),
      sgstAmount: roundCurrency(acc.sgstAmount + line.sgstAmount),
      igstAmount: roundCurrency(acc.igstAmount + line.igstAmount),
      gstAmount: roundCurrency(acc.gstAmount + line.gstAmount),
      totalAmount: roundCurrency(acc.totalAmount + line.totalAmount),
    }),
    { taxableAmount: 0, cgstAmount: 0, sgstAmount: 0, igstAmount: 0, gstAmount: 0, totalAmount: 0 },
  )
}

function registerTotalsToLine(label: string, totals: ReturnType<typeof sumRegister>): GstSummaryLine {
  return buildSummaryLine(label, totals.taxableAmount, totals.cgstAmount, totals.sgstAmount, totals.igstAmount, totals.gstAmount, totals.totalAmount)
}

function combineSummaryLines(label: string, additions: GstSummaryLine[], subtractions: GstSummaryLine[] = []): GstSummaryLine {
  const add = additions.reduce((acc, line) => addSummaryLine(acc, line, 1), buildSummaryLine(label, 0, 0, 0, 0, 0, 0))
  return subtractions.reduce((acc, line) => addSummaryLine(acc, line, -1), add)
}

function addSummaryLine(base: GstSummaryLine, line: GstSummaryLine, direction: 1 | -1): GstSummaryLine {
  return {
    ...base,
    taxableAmount: roundCurrency(base.taxableAmount + direction * line.taxableAmount),
    cgstAmount: roundCurrency(base.cgstAmount + direction * line.cgstAmount),
    sgstAmount: roundCurrency(base.sgstAmount + direction * line.sgstAmount),
    igstAmount: roundCurrency(base.igstAmount + direction * line.igstAmount),
    gstAmount: roundCurrency(base.gstAmount + direction * line.gstAmount),
    totalAmount: roundCurrency(base.totalAmount + direction * line.totalAmount),
  }
}

function buildSummaryLine(
  label: string,
  taxableAmount: number,
  cgstAmount: number,
  sgstAmount: number,
  igstAmount: number,
  gstAmount: number,
  totalAmount: number,
): GstSummaryLine {
  return {
    label,
    taxableAmount: roundCurrency(taxableAmount),
    cgstAmount: roundCurrency(cgstAmount),
    sgstAmount: roundCurrency(sgstAmount),
    igstAmount: roundCurrency(igstAmount),
    gstAmount: roundCurrency(gstAmount),
    totalAmount: roundCurrency(totalAmount),
  }
}

export function buildGstRegisterExportRows(lines: GstRegisterLine[], title: string): AccountingExportRow[] {
  void title
  return [
    [
      en.gstReports.documentNo,
      en.gstReports.date,
      en.gstReports.source,
      en.gstReports.party,
      en.gstInvoice.gstin,
      en.gstInvoice.hsnSac,
      en.gstReports.item,
      en.gstReports.qty,
      en.gstInvoice.taxableValue,
      en.gstInvoice.cgst,
      en.gstInvoice.sgstUtgst,
      en.gstInvoice.igst,
      en.transaction.totalGst,
      en.reports.total,
    ],
    ...lines.map((line) => [
      line.documentNo,
      formatDate(line.date),
      getSourceLabel(line.source),
      line.partyName,
      line.gstin || "-",
      line.hsnCode || en.gstReports.unclassifiedHsn,
      line.itemName,
      line.quantity,
      line.taxableAmount,
      line.cgstAmount,
      line.sgstAmount,
      line.igstAmount,
      line.gstAmount,
      line.totalAmount,
    ]),
  ]
}

export function buildHsnExportRows(rows: HsnSummaryRow[]): AccountingExportRow[] {
  return [
    [
      en.gstInvoice.hsnSac,
      en.gstReports.qty,
      en.gstReports.outwardTaxable,
      en.gstReports.outwardGst,
      en.gstReports.inwardTaxable,
      en.gstReports.inwardGst,
      en.gstReports.netTaxable,
      en.gstReports.netGst,
    ],
    ...rows.map((row) => [row.hsnCode, row.quantity, row.outwardTaxable, row.outwardGst, row.inwardTaxable, row.inwardGst, row.netTaxable, row.netGst]),
  ]
}

export function buildPartySummaryExportRows(rows: PartyGstSummaryRow[], title: string): AccountingExportRow[] {
  void title
  return [
    [en.gstReports.party, en.gstInvoice.gstin, en.gstReports.documentCount, en.gstInvoice.taxableValue, en.transaction.totalGst, en.reports.total],
    ...rows.map((row) => [row.partyName, row.gstin || "-", row.documentCount, row.taxableAmount, row.gstAmount, row.totalAmount]),
  ]
}

export function buildGstSummaryExportRows(rows: GstSummaryLine[], title: string): AccountingExportRow[] {
  void title
  return [
    [en.gstReports.particulars, en.gstInvoice.taxableValue, en.gstInvoice.cgst, en.gstInvoice.sgstUtgst, en.gstInvoice.igst, en.transaction.totalGst, en.reports.total],
    ...rows.map((row) => [row.label, row.taxableAmount, row.cgstAmount, row.sgstAmount, row.igstAmount, row.gstAmount, row.totalAmount]),
  ]
}

export function buildCaExportRows(summary: GstReportsSummary): AccountingExportRow[] {
  return [
    [en.gstReports.caExportTitle],
    [],
    ...buildGstSummaryExportRows(summary.gstr1Summary, en.gstReports.gstr1Summary),
    [],
    ...buildGstSummaryExportRows(summary.gstr3bSummary, en.gstReports.gstr3bSummary),
    [],
    ...buildHsnExportRows(summary.hsnSummary),
    [],
    ...buildPartySummaryExportRows(summary.b2bSummary, en.gstReports.b2bSummary),
    [],
    ...buildPartySummaryExportRows(summary.b2cSummary, en.gstReports.b2cSummary),
    [],
    [en.gstReports.disclaimerTitle, en.gstReports.officialIntegrationDisclaimer],
  ]
}

export function formatGstMoney(value: number) {
  return `${en.common.rupeeSymbol} ${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

export function formatDate(value?: string) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
}

export function getSourceLabel(source: GstRegisterSource) {
  if (source === "invoice") return en.gstReports.sourceInvoice
  if (source === "sale") return en.gstReports.sourceSale
  return en.gstReports.sourcePurchase
}

function isDateInRange(value: string | undefined, range: GstReportRange) {
  const dateKey = normalizeDateKey(value)
  if (!dateKey) return false
  return dateKey >= range.from && dateKey <= range.to
}

function normalizeDateKey(value?: string) {
  if (!value) return ""
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10)
}

function toNumber(value: number | string | undefined) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}
