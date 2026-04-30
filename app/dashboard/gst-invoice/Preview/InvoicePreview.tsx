// src/app/dashboard/InvoicePreview.tsx
import type { GSTInvoice } from "../types/gst.types";

import TableComponent, { TableItem } from "../../../components/utility/CommonTable";
import { PartyCard, SummaryRow } from "./InvoiceHelpers";

/* NEW – reusable component that shows the seller’s name,
   address, GSTIN and the “Tax Invoice” heading. */
import SellerHeader from "../components/SellerHeader";

/* -----------------------------------------------------------------
   InvoicePreview
   ----------------------------------------------------------------- */
export default function InvoicePreview({ invoice }: { invoice: GSTInvoice }) {
  /* -------------------------------------------------------------
     Determine whether the supply is interstate (IGST) or intra‑state
     (CGST + SGST).  The check is case‑insensitive and ignores
     extra whitespace.
     ------------------------------------------------------------- */
  const isInterState =
    invoice.seller.state.trim() &&
    invoice.buyer.state.trim() &&
    invoice.seller.state.trim().toLowerCase() !==
      invoice.buyer.state.trim().toLowerCase();

  /* -------------------------------------------------------------
     Convert the invoice items to the shape expected by
     `CommonTable`.  We keep the data very small – only the bits
     we actually display.
     ------------------------------------------------------------- */
  const tableData: TableItem[] = invoice.items.map((item, index) => ({
    id: index,
    name: item.description,
    category: "—", // you could map GST type here if you wish
    supplier: item.hsnCode,
    expiry: undefined,
    price: item.rate,
    quantity: item.quantity,
    createdAt: undefined,
    note: `CGST: ${item.cgstAmount.toFixed(
      2
    )}, SGST: ${item.sgstAmount.toFixed(
      2
    )}, IGST: ${item.igstAmount.toFixed(
      2
    )}, Total: Rs ${item.total.toFixed(2)}`,
  }));

  return (
    <div className="overflow-hidden rounded-xl bg-white p-4 text-black shadow print:shadow-none sm:p-6">
      {/* -----------------------------------------------------------------
          SELLER INFO + INVOICE METADATA (header)
          ----------------------------------------------------------------- */}
      <div className="border-b border-slate-200 pb-4">
        {/* ① SellerHeader – single source of truth for seller details */}
        <SellerHeader seller={invoice.seller} />

        {/* ② Small box that holds invoice number / dates / tax‑type */}
        <div className="w-full md:w-auto md:min-w-[220px] rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm mt-4">
          <div className="flex justify-between gap-4">
            <span className="text-slate-500">Invoice No</span>
            <span className="font-semibold">{invoice.invoiceNo || "-"}</span>
          </div>

          <div className="mt-2 flex justify-between gap-4">
            <span className="text-slate-500">Invoice Date</span>
            <span className="font-semibold">{invoice.invoiceDate || "-"}</span>
          </div>

          <div className="mt-2 flex justify-between gap-4">
            <span className="text-slate-500">Due Date</span>
            <span className="font-semibold">{invoice.dueDate || "-"}</span>
          </div>

          <div className="mt-2 flex justify-between gap-4">
            <span className="text-slate-500">Place of Supply</span>
            <span className="font-semibold">
              {invoice.buyer.state || invoice.seller.state || "-"}
            </span>
          </div>

          <div className="mt-2 flex justify-between gap-4">
            <span className="text-slate-500">Tax Type</span>
            <span className="font-semibold">
              {isInterState ? "IGST" : "CGST + SGST"}
            </span>
          </div>
        </div>
      </div>

      {/* -----------------------------------------------------------------
          BILL‑TO + BANK DETAILS
          ----------------------------------------------------------------- */}
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <PartyCard
          title="Bill To"
          party={invoice.buyer}
          fallback="Buyer details add karo"
        />

        <PartyCard
          title="Bank Details"
          party={{
            name: invoice.bankDetails?.accountName || "",
            gstin: invoice.bankDetails?.bankName || "",
            address: invoice.bankDetails?.accountNo || "",
            city: invoice.bankDetails?.ifsc || "",
            state: "",
            pincode: "",
          }}
          fallback="Bank details profile se auto-fill honge"
          customLabels={{
            gstin: "Bank",
            address: "Account No",
            city: "IFSC",
          }}
        />
      </div>

      {/* -----------------------------------------------------------------
          INVOICE ITEMS TABLE
          ----------------------------------------------------------------- */}
      <div className="mt-6">
        <TableComponent data={tableData} onEdit={() => {}} showSelection={false} />
      </div>

      {/* -----------------------------------------------------------------
          NOTES, TERMS & SUMMARY
          ----------------------------------------------------------------- */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* LEFT side – free‑text notes & terms */}
        <div className="rounded-xl border border-slate-200 p-4">
          <p className="text-sm font-semibold">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
            {invoice.notes || "No additional notes."}
          </p>

          <p className="mt-4 text-sm font-semibold">Terms</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">
            {invoice.terms || "No terms added."}
          </p>
        </div>

        {/* RIGHT side – monetary summary */}
        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-600">
            {isInterState
              ? "Inter‑state taxable supply"
              : "Intra‑state taxable supply"}
          </div>

          <SummaryRow label="Taxable Value" value={invoice.totals.taxableValue} />
          <SummaryRow label="CGST" value={invoice.totals.cgstTotal} />
          <SummaryRow label="SGST" value={invoice.totals.sgstTotal} />
          <SummaryRow label="IGST" value={invoice.totals.igstTotal} />

          <div className="mt-3 border-t border-dashed border-slate-200 pt-3">
            <SummaryRow label="Grand Total" value={invoice.totals.grandTotal} strong />
          </div>

          <p className="mt-3 text-sm italic text-slate-600">
            {invoice.totals.amountInWords}
          </p>
        </div>
      </div>
    </div>
  );
}
