"use client"

import InvoiceHeader from "./components/InvoiceHeader"
import SellerSection from "./components/SellerSection"
import BuyerSection from "./components/BuyerSection"
import ItemsSection from "./components/ItemsSection"
import BankNotesSection from "./components/BankNotesSection"
import InvoiceHistory from "./components/InvoiceHistory"
import InvoicePreview, { buildGstInvoiceDocument } from "./Preview/InvoicePreview"

import Modal from "@/app/components/ui/Modal"
import TransactionOptions from "@/app/components/ui/TransactionOptions"
import { notify as toast } from "@/app/lib/notifications"
import { printTransactionDocument } from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"

import { useGstInvoiceForm } from "./useGstInvoiceForm"
import Button from "@/app/components/ui/Button"

export default function GstForm() {
  const {
    invoice,
    invoices,
    saving,
    activeTab,
    previewMode,
    resetConfirmOpen,
    transactionOptions,
    isInterState,
    buyerSuggestions,

    setInvoice,
    setActiveTab,
    setPreviewMode,
    setResetConfirmOpen,
    setTransactionOptions,

    handleBuyerChange,
    handleShippingAddressChange,
    handleShippingSameChange,
    handleItemChange,
    handleItemPatch,
    addItem,
    removeItem,
    resetInvoice,
    completeInvoiceReset,
    saveInvoice,
    loadInvoiceFromHistory,
  } = useGstInvoiceForm()

  return (
    <div className="dashboard-page space-y-6 pb-8">
        <div className="flex items-center gap-4">
          <Button title={en.gstInvoice.newGstBill} onClick={() => setActiveTab("new")} disabled={saving} />
          <Button title={en.gstInvoice.savedGstBills} onClick={() => setActiveTab("saved")} disabled={saving} />
        </div>

      {activeTab === "new" ? (
        <div className="">
          <div className="min-w-0 space-y-6">
            <InvoiceHeader invoice={invoice} onChange={(field, value) => setInvoice({ ...invoice, [field]: value })} onSave={saveInvoice} onReset={resetInvoice} onPreview={() => setPreviewMode("preview")} onPrintPreview={() => setPreviewMode("print")} saving={saving} />

            <TransactionOptions value={transactionOptions} onChange={setTransactionOptions} allowPrint allowDownloadShare disabled={saving} />

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <SellerSection seller={invoice.seller} />
              <BankNotesSection invoice={invoice} onChange={(field, value) => setInvoice({ ...invoice, [field]: value })} />
            </div>

            <div className="premium-surface min-w-0 rounded-2xl p-3 sm:p-6">
              <BuyerSection buyer={invoice.buyer} shippingAddress={invoice.shippingAddress} shippingSameAsBilling={invoice.shippingSameAsBilling} onBuyerChange={handleBuyerChange} onShippingAddressChange={handleShippingAddressChange} onShippingSameChange={handleShippingSameChange} suggestions={buyerSuggestions} />

              <ItemsSection items={invoice.items} onChange={handleItemChange} onPatch={handleItemPatch} addItem={addItem} removeItem={removeItem} isInterState={isInterState} />
            </div>
          </div>

          {/* <div className="min-w-0 space-y-6 2xl:sticky 2xl:top-4 2xl:self-start">
            <InvoicePreview invoice={invoice} />
          </div> */}
        </div>
      ) : (
        <InvoiceHistory invoices={invoices} onSelect={loadInvoiceFromHistory} />
      )}

      {resetConfirmOpen && (
        <Modal title={en.gstInvoice.resetTitle} description={en.gstInvoice.resetConfirm} onClose={() => setResetConfirmOpen(false)} primaryLabel={en.common.confirm} primaryVariant="warning" onPrimary={completeInvoiceReset} cancelLabel={en.common.cancel} />
      )}

      {previewMode && (
        <Modal title={previewMode === "print" ? en.gstInvoice.printPreview : en.gstInvoice.preview}
          description={
            previewMode === "print"
              ? en.gstInvoice.printPreviewDescription
              : en.gstInvoice.previewDescription
          }
          onClose={() => setPreviewMode(null)}
          size="full"
          primaryLabel={previewMode === "print" ? en.gstInvoice.printInvoice : undefined}
          primaryVariant="secondary"
          onPrimary={() => {
            if (printTransactionDocument(buildGstInvoiceDocument(invoice))) {
              toast.success(en.gstInvoice.printReady)
            } else {
              toast.error(en.common.printFailed)
            }
          }}
          cancelLabel={en.common.close}
        >
          <InvoicePreview invoice={invoice} />
        </Modal>
      )}
    </div>
  )
}