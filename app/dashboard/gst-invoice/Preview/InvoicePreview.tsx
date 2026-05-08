import type { ReactNode } from "react";
import type { GSTInvoice } from "../types/gst.types";
import { PartyCard, SummaryRow } from "./InvoiceHelpers";
import SellerHeader from "../components/SellerHeader";

export default function InvoicePreview({ invoice }: { invoice: GSTInvoice }) {
  const shippingSameAsBilling = invoice.shippingSameAsBilling !== false
  const shippingAddress = invoice.shippingAddress || {
    address: invoice.buyer.address || "",
    city: invoice.buyer.city || "",
    state: invoice.buyer.state || "",
    pincode: invoice.buyer.pincode || "",
  }

  const isInterState =
    invoice.seller.state.trim() &&
    invoice.buyer.state.trim() &&
    invoice.seller.state.trim().toLowerCase() !==
      invoice.buyer.state.trim().toLowerCase();

  return (
    <div className="min-w-0 overflow-hidden rounded-xl bg-white p-3 text-black shadow print:shadow-none sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <SellerHeader seller={invoice.seller} />

        <div className="min-w-[220px] space-y-2 text-sm">
          <MetaRow label="Invoice No" value={invoice.invoiceNo || "-"} />
          <MetaRow label="Invoice Date" value={invoice.invoiceDate || "-"} />
          <MetaRow label="Due Date" value={invoice.dueDate || "-"} />
          <MetaRow label="Place of Supply" value={invoice.buyer.state || invoice.seller.state || "-"} />
          <MetaRow label="Tax Type" value={isInterState ? "IGST" : "CGST + SGST / UTGST"} />
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <PartyCard title="Bill To" party={invoice.buyer} fallback="Please add buyer details" />

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

      {!shippingSameAsBilling && (
        <div className="mt-4">
          <PartyCard
            title="Ship To"
            party={shippingAddress}
            fallback="Please add shipping address"
          />
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-200">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-xs sm:min-w-[1080px] sm:text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <Th>#</Th>
                <Th>Description</Th>
                <Th>HSN/SAC</Th>
                <Th>Qty</Th>
                <Th>Rate</Th>
                <Th>Discount</Th>
                <Th>Taxable</Th>
                <Th>{isInterState ? "IGST" : "CGST"}</Th>
                <Th>{isInterState ? "-" : "SGST/UTGST"}</Th>
                <Th>Total</Th>
              </tr>
            </thead>

            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={`${item.hsnCode}-${index}`} className="border-t border-slate-200 align-top">
                  <Td>{index + 1}</Td>
                  <Td>
                    <div className="font-medium text-slate-900">{item.name || item.description || "-"}</div>
                    {item.hsnSacDescription && (
                      <div className="mt-1 text-xs leading-5 text-slate-500">{item.hsnSacDescription}</div>
                    )}
                  </Td>
                  <Td>
                    <div className="font-medium">{item.hsnCode || "-"}</div>
                    {item.hsnSacType && (
                      <div className="mt-1 text-xs text-slate-500">{item.hsnSacType}</div>
                    )}
                  </Td>
                  <Td>{item.quantity} {item.unit}</Td>
                  <Td>{formatMoney(item.rate)}</Td>
                  <Td>{formatMoney(item.discount)}</Td>
                  <Td>{formatMoney(item.taxableValue)}</Td>
                  <Td>
                    {isInterState
                      ? `${formatMoney(item.igstAmount)} (${item.igstRate.toFixed(2)}%)`
                      : `${formatMoney(item.cgstAmount)} (${item.cgstRate.toFixed(2)}%)`}
                  </Td>
                  <Td>
                    {isInterState
                      ? "-"
                      : `${formatMoney(item.sgstAmount)} (${item.sgstRate.toFixed(2)}%)`}
                  </Td>
                  <Td className="font-semibold text-slate-900">{formatMoney(item.total)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
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

        <div className="rounded-xl border border-slate-200 p-4">
          <div className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-600">
            {isInterState ? "Inter-state taxable supply" : "Intra-state taxable supply"}
          </div>

          <SummaryRow label="Taxable Value" value={invoice.totals.taxableValue} />
          <SummaryRow label="CGST" value={invoice.totals.cgstTotal} />
          <SummaryRow label="SGST / UTGST" value={invoice.totals.sgstTotal} />
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

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="text-slate-500">{label}</span>
      <span className="text-right font-semibold">{value}</span>
    </div>
  );
}

function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <td className={`px-3 py-3 text-sm text-slate-700 ${className}`}>{children}</td>;
}

function formatMoney(value: number) {
  return `Rs ${Number(value || 0).toFixed(2)}`;
}
