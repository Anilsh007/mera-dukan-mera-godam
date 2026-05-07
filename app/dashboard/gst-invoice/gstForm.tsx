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
import { toast } from "sonner"

import {
  buildSellerFromProfile,
  buildBankDetailsFromProfile,
  buildInvoiceNumber,
  loadInvoicesFromDb,
  saveInvoiceToDb,
  saveInvoiceToSupabase,
} from "./invoice.service"

import { buildBuyerSuggestions } from "./buyerSuggestions"

import {
  calculateGST,
  createEmptyInvoice,
  createEmptyInvoiceItem,
  buildInvoiceTotals,
  type GSTInvoice,
  type GSTInvoiceRecord,
} from "./types/gst.types"

import { getStateFromGSTIN } from "./lib/getStateFromGSTIN"
import { syncSupabaseToDexie } from "@/app/lib/supabaseDownload.service"
import { findHsnSacTaxInfo } from "./lib/hsnSacLookup"

const today = new Date().toISOString().slice(0, 10)

export default function GstForm() {
  const [invoice, setInvoice] = useState<GSTInvoice>(createEmptyInvoice())
  const [invoices, setInvoices] = useState<GSTInvoiceRecord[]>([])
  const [saving, setSaving] = useState(false)

  const { profile } = useProfile()
  // 🔥 INTER / INTRA STATE
  const isInterState =
    invoice.seller.state?.trim().toLowerCase() !==
    invoice.buyer.state?.trim().toLowerCase()

  // -----------------------------
  // BUYER SUGGESTIONS
  // -----------------------------
  const buyerSuggestions = useMemo(
    () => buildBuyerSuggestions(invoices),
    [invoices]
  )

  // -----------------------------
  // INITIAL LOAD
  // -----------------------------
  useEffect(() => {
    async function init() {
      const data = await loadInvoicesFromDb()
      setInvoices(data)

      setInvoice((prev) => ({
        ...prev,
        invoiceNo: buildInvoiceNumber(profile, data),
        invoiceDate: today,
        dueDate: today,
        seller: buildSellerFromProfile(profile),
        bankDetails: buildBankDetailsFromProfile(profile),
        shippingSameAsBilling: true,
        shippingAddress: {
          address: prev.buyer.address || "",
          city: prev.buyer.city || "",
          state: prev.buyer.state || "",
          pincode: prev.buyer.pincode || "",
        },
      }))
    }

    if (profile) init()
  }, [profile])

  // -----------------------------
  // BUYER CHANGE
  // -----------------------------
  const handleBuyerChange = (field: string, value: string) => {
    const updatedBuyer = { ...invoice.buyer, [field]: value }

    if (field === "gstin") {
      const state = getStateFromGSTIN(value)
      if (state) updatedBuyer.state = state
    }

    setInvoice((prev) => ({
      ...prev,
      buyer: updatedBuyer,
      shippingAddress: prev.shippingSameAsBilling
        ? {
            address: updatedBuyer.address || "",
            city: updatedBuyer.city || "",
            state: updatedBuyer.state || "",
            pincode: updatedBuyer.pincode || "",
          }
        : prev.shippingAddress,
    }))
  }

  const handleShippingAddressChange = (field: string, value: string) => {
    setInvoice((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [field]: value,
      },
    }))
  }

  const handleShippingSameChange = (checked: boolean) => {
    setInvoice((prev) => ({
      ...prev,
      shippingSameAsBilling: checked,
      shippingAddress: checked
        ? {
            address: prev.buyer.address || "",
            city: prev.buyer.city || "",
            state: prev.buyer.state || "",
            pincode: prev.buyer.pincode || "",
          }
        : prev.shippingAddress,
    }))
  }

  // -----------------------------
  // ITEM CHANGE (🔥 MAIN FIX)
  // -----------------------------

  const handleItemChange = (index: number, field: string, value: string | number) => {
    setInvoice(prev => {
      const updatedItems = [...prev.items]

      const item = {
        ...updatedItems[index],
        [field]:
          field === "rate" || field === "quantity" || field === "discount"
            ? Number(value)
            : value,
      }

      const taxInfo = findHsnSacTaxInfo(item.hsnCode)
      const cgstRate = taxInfo?.cgstRate ?? item.cgstRate ?? 9
      const sgstRate = taxInfo?.sgstRate ?? item.sgstRate ?? 9
      const igstRate = taxInfo?.igstRate ?? item.igstRate ?? 18
      const gstRate = isInterState ? igstRate : cgstRate + sgstRate

      const gst = calculateGST(
        gstRate,
        item.quantity,
        item.rate,
        item.discount,
        isInterState,
        { cgstRate, sgstRate, igstRate }
      )

      updatedItems[index] = {
        ...item,
        description: item.name,
        hsnSacType: taxInfo?.type,
        hsnSacDescription: taxInfo?.description || "",
        gstCondition: taxInfo?.condition || "",
        gstRate,
        cgstRate,
        sgstRate,
        igstRate,
        taxableValue: gst.taxableValue,
        cgstAmount: gst.cgst,
        sgstAmount: gst.sgst,
        igstAmount: gst.igst,
        total: gst.total,
      }

      return {
        ...prev,
        items: updatedItems,
        totals: buildInvoiceTotals(updatedItems),
      }
    })
  }

  // -----------------------------
  // 🔥 STATE CHANGE RE-CALCULATION
  // -----------------------------
  useEffect(() => {
    setInvoice((prev) => {
      const updatedItems = prev.items.map((item) => {
        const taxInfo = findHsnSacTaxInfo(item.hsnCode)
        const cgstRate = taxInfo?.cgstRate ?? item.cgstRate ?? 9
        const sgstRate = taxInfo?.sgstRate ?? item.sgstRate ?? 9
        const igstRate = taxInfo?.igstRate ?? item.igstRate ?? 18
        const gstRate = isInterState ? igstRate : cgstRate + sgstRate
        const result = calculateGST(
          gstRate,
          item.quantity,
          item.rate,
          item.discount,
          isInterState,
          { cgstRate, sgstRate, igstRate }
        )

        return {
          ...item,
          description: item.name,
          hsnSacType: taxInfo?.type,
          hsnSacDescription: taxInfo?.description || item.hsnSacDescription || "",
          gstCondition: taxInfo?.condition || item.gstCondition || "",
          gstRate,
          cgstRate,
          sgstRate,
          igstRate,
          taxableValue: result.taxableValue,
          cgstAmount: result.cgst,
          sgstAmount: result.sgst,
          igstAmount: result.igst,
          total: result.total,
        }
      })

      return { ...prev, items: updatedItems, totals: buildInvoiceTotals(updatedItems) }
    })
  }, [invoice.buyer.state, invoice.seller.state, isInterState])

  // -----------------------------
  // ADD / REMOVE
  // -----------------------------
  const addItem = () => {
    setInvoice((prev) => {
      const items = [...prev.items, createEmptyInvoiceItem()]
      return {
        ...prev,
        items,
        totals: buildInvoiceTotals(items),
      }
    })
  }

  const removeItem = (index: number) => {
    setInvoice((prev) => {
      const items = prev.items.filter((_, i) => i !== index)
      return {
        ...prev,
        items: items.length ? items : [createEmptyInvoiceItem()],
        totals: buildInvoiceTotals(items.length ? items : [createEmptyInvoiceItem()]),
      }
    })
  }

  // -----------------------------
  // RESET
  // -----------------------------
  const resetInvoice = () => {
    setInvoice({
      ...createEmptyInvoice(),
      invoiceNo: buildInvoiceNumber(profile, invoices),
      invoiceDate: today,
      dueDate: today,
      seller: buildSellerFromProfile(profile),
      bankDetails: buildBankDetailsFromProfile(profile),
      shippingSameAsBilling: true,
    })
  }

  // -----------------------------
  // SAVE
  // -----------------------------
  const saveInvoice = async () => {
    const missing = [
      !invoice.seller.name && "seller name",
      !invoice.seller.gstin && "GSTIN",
      !invoice.seller.state && "state",
    ].filter(Boolean)

    if (missing.length) {
      toast.error(`Complete seller profile: ${missing.join(", ")}`)
      return
    }

    setSaving(true)
    try {
      const saved = await saveInvoiceToDb(invoice)
      try {
        await saveInvoiceToSupabase(saved)
      } catch (cloudError) {
        console.error("Invoice cloud sync failed:", cloudError)
        toast.error("Invoice local me save ho gaya, cloud sync pending hai")
      }
      setInvoices((prev) => [saved, ...prev])
      toast.success("Invoice save ho gaya")
      resetInvoice()
    } catch (err) {
      console.error(err)
      toast.error("Invoice save nahi ho paya")
    } finally {
      setSaving(false)
    }
  }

  // -----------------------------
  // LOAD HISTORY
  // -----------------------------
  const loadInvoiceFromHistory = (inv: GSTInvoiceRecord) => {
    setInvoice({
      ...inv,
      shippingSameAsBilling: inv.shippingSameAsBilling !== false,
      shippingAddress: inv.shippingAddress || {
        address: inv.buyer.address || "",
        city: inv.buyer.city || "",
        state: inv.buyer.state || "",
        pincode: inv.buyer.pincode || "",
      },
    })
  }

  useEffect(() => {
    async function syncData() {
      try {
        await syncSupabaseToDexie()
      } catch (err) {
        console.error("Manual sync failed:", err)
      }
    }

    syncData()
  }, [])

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div>
      <div className="space-y-6">
        <InvoiceHeader invoice={invoice} onChange={(f, v) => setInvoice({ ...invoice, [f]: v })} onSave={saveInvoice} onReset={resetInvoice} saving={saving} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <SellerSection seller={invoice.seller} />
          <BankNotesSection invoice={invoice} onChange={(f, v) => setInvoice({ ...invoice, [f]: v })} />
        </div>

        <div className="p-6 bg-[var(--bg-card-strong)] rounded-2xl">
          <BuyerSection
            buyer={invoice.buyer}
            shippingAddress={invoice.shippingAddress}
            shippingSameAsBilling={invoice.shippingSameAsBilling}
            onBuyerChange={handleBuyerChange}
            onShippingAddressChange={handleShippingAddressChange}
            onShippingSameChange={handleShippingSameChange}
            suggestions={buyerSuggestions}
          />

          <ItemsSection items={invoice.items} onChange={handleItemChange} addItem={addItem} removeItem={removeItem} isInterState={isInterState} />
        </div>
      </div>

      <div className="space-y-6 sticky top-4">
        <InvoicePreview invoice={invoice} />
        <InvoiceHistory invoices={invoices} onSelect={loadInvoiceFromHistory} />
      </div>
    </div>
  )
}
