"use client"

import { useEffect, useMemo, useState } from "react"

import InvoiceHeader from "./components/InvoiceHeader"
import SellerSection from "./components/SellerSection"
import BuyerSection from "./components/BuyerSection"
import ItemsSection from "./components/ItemsSection"
import BankNotesSection from "./components/BankNotesSection"
import InvoiceHistory from "./components/InvoiceHistory"
import InvoicePreview from "./Preview/InvoicePreview"

import useProfile from "@/app/dashboard/profile/useProfile"
import useProducts from "@/app/dashboard/all-stock/useProducts"

import { buildSellerFromProfile, buildBankDetailsFromProfile, buildInvoiceNumber, loadInvoicesFromDb, saveInvoiceToDb, } from "./invoice.service"
import { buildBuyerSuggestions, matchBuyerSuggestion } from "./buyerSuggestions";
import { createEmptyInvoice, createEmptyInvoiceItem, type GSTInvoice, type GSTInvoiceItem, type GSTInvoiceRecord, } from "./types/gst.types";
//import { matchBuyerSuggestion } from "./components/BuyerSection"


const today = new Date().toISOString().slice(0, 10)

export default function GstForm() {

  // ✅ STATE (THIS WAS MISSING ❗)
  const [invoice, setInvoice] = useState<GSTInvoice>(createEmptyInvoice())
  const [invoices, setInvoices] = useState<GSTInvoiceRecord[]>([])
  const [saving, setSaving] = useState(false)

  const { profile } = useProfile()
  const { products } = useProducts()

  // ✅ PRODUCT SUGGESTIONS
  const productSuggestions = useMemo(
    () =>
      products.map((p) => ({
        name: p.name,
        displayName: p.name,
        rate: p.price,
        hsnCode: p.sku || "",
      })),
    [products]
  )

  // ✅ BUYER SUGGESTIONS
  const buyerSuggestions = useMemo(
    () => buildBuyerSuggestions(invoices),
    [invoices]
  )

  // ✅ INITIAL LOAD
  useEffect(() => {
    async function init() {
      const data = await loadInvoicesFromDb()
      setInvoices(data)

      setInvoice((prev: any) => ({
        ...prev,
        invoiceNo: buildInvoiceNumber(profile, data),
        invoiceDate: today,
        dueDate: today,
        seller: buildSellerFromProfile(profile),
        bankDetails: buildBankDetailsFromProfile(profile),
      }))
    }

    if (profile) init()
  }, [profile])

  // -----------------------------
  // ✅ HANDLERS
  // -----------------------------

  const handleMetaChange = (field: string, value: string) => {
    setInvoice((prev: any) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleBuyerChange = (field: string, value: string) => {
    const matched = matchBuyerSuggestion(
      buyerSuggestions,
      field as any,
      value
    )

    setInvoice((prev) => ({
      ...prev,
      buyer: matched
        ? { ...prev.buyer, ...matched.buyer, [field]: value }
        : { ...prev.buyer, [field]: value },
    }))
  }

  const handleItemChange = (
    index: number,
    field: keyof GSTInvoiceItem,
    value: string
  ) => {
    const items = [...invoice.items]

    if (field === "quantity" || field === "rate" || field === "gstRate") {
      items[index][field] = Number(value) as never
    } else {
      items[index][field] = value as never
    }

    setInvoice((prev) => ({
      ...prev,
      items,
    }))
  }

  const addItem = () => {
    setInvoice((prev) => ({
      ...prev,
      items: [...prev.items, createEmptyInvoiceItem()],
    }))
  }

  const removeItem = (index: number) => {
    setInvoice((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
  }

  const resetInvoice = () => {
    setInvoice({
      ...createEmptyInvoice(),
      invoiceNo: buildInvoiceNumber(profile, invoices),
      invoiceDate: today,
      dueDate: today,
      seller: buildSellerFromProfile(profile),
      bankDetails: buildBankDetailsFromProfile(profile),
    })
  }

  const saveInvoice = async () => {
    setSaving(true)
    try {
      const saved = await saveInvoiceToDb(invoice)
      setInvoices((prev) => [saved, ...prev])
      resetInvoice()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  const loadInvoiceFromHistory = (inv: GSTInvoiceRecord) => {
    setInvoice(inv)
  }

  // -----------------------------
  // ✅ UI
  // -----------------------------

  return (
    <div className="">

      {/* LEFT */}
      <div className="space-y-6">

        <InvoiceHeader invoice={invoice} onChange={handleMetaChange} onSave={saveInvoice} onReset={resetInvoice} saving={saving} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SellerSection seller={invoice.seller} />
          <BankNotesSection invoice={invoice} onChange={handleMetaChange} />
        </div>

        <div className="p-4 mb-4 sm:p-6 bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-2xl shadow-[var(--shadow-card)]">
          <BuyerSection buyer={invoice.buyer} onChange={handleBuyerChange} suggestions={buyerSuggestions} />

          <ItemsSection items={invoice.items} onChange={handleItemChange} addItem={addItem} removeItem={removeItem} productSuggestions={productSuggestions} />
        </div>

      </div>

      {/* RIGHT */}
      <div className="space-y-6 sticky top-4">

        <InvoicePreview invoice={invoice} />

        <InvoiceHistory invoices={invoices} onSelect={loadInvoiceFromHistory}
        />

      </div>

    </div>
  )
}