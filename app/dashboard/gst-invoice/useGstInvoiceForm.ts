"use client"

import { useEffect, useMemo, useState } from "react"

import useProfile from "@/app/dashboard/profile/useProfile"
import { notify as toast } from "@/app/lib/notifications"
import { syncSupabaseToDexie } from "@/app/lib/supabaseDownload.service"
import { type TransactionOptionFlags } from "@/app/lib/transactionDocument"
import { en } from "@/app/messages/en"

import { buildGstInvoiceDocument } from "./Preview/InvoicePreview"

import {
  buildSellerFromProfile,
  buildBankDetailsFromProfile,
  buildInvoiceNumber,
  loadInvoicesFromDb,
  saveInvoiceToDb,
  saveInvoiceToSupabase,
} from "./invoice.service"

import { buildBuyerSuggestions, matchBuyerSuggestion } from "./buyerSuggestions"

import {
  createEmptyInvoice,
  createEmptyInvoiceItem,
  buildInvoiceTotals,
  type GSTInvoice,
  type GSTInvoiceRecord,
} from "./types/gst.types"

import { getStateFromGSTIN } from "./lib/getStateFromGSTIN"
import { warmHsnSacLookup } from "./lib/hsnSacLookup"
import { isInterStateSupply, sanitizeInvoiceForSave, validateInvoice } from "./lib/invoiceValidation"
import { consumeSaleInvoiceDraft } from "./invoiceDraft.service"
import { buildInvoiceFromSaleDraft, calculateInvoiceItem } from "./gstInvoiceForm.helpers"
import {
  createTransactionOptions,
  runTransactionDocumentActions,
  validateTransactionOptions,
} from "@/app/lib/transactionActions"

const today = new Date().toISOString().slice(0, 10)

export function useGstInvoiceForm() {
  const [invoice, setInvoice] = useState<GSTInvoice>(createEmptyInvoice())
  const [invoices, setInvoices] = useState<GSTInvoiceRecord[]>([])
  const [saving, setSaving] = useState(false)
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"new" | "saved">("new")
  const [previewMode, setPreviewMode] = useState<"preview" | "print" | null>(null)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [hsnLookupVersion, setHsnLookupVersion] = useState(0)

  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>(createTransactionOptions())

  const { profile } = useProfile()

  const sellerState = invoice.seller.state?.trim().toLowerCase() || ""
  const buyerState = invoice.buyer.state?.trim().toLowerCase() || ""
  const isInterState = isInterStateSupply(invoice)

  const buyerSuggestions = useMemo(() => buildBuyerSuggestions(invoices), [invoices])

  useEffect(() => {
    let cancelled = false

    warmHsnSacLookup()
      .then(() => {
        if (!cancelled) setHsnLookupVersion((version) => version + 1)
      })
      .catch((error) => {
        console.error("HSN/SAC data load failed", error)
        if (!cancelled) toast.warning(en.gstInvoice.hsnLookupUnavailable, { id: "gst-hsn-lookup-warning" })
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    async function init() {
      const data = await loadInvoicesFromDb()
      setInvoices(data)
      setActiveInvoiceId(null)

      const baseInvoice: GSTInvoice = {
        ...createEmptyInvoice(),
        invoiceNo: buildInvoiceNumber(profile, data),
        invoiceDate: today,
        dueDate: today,
        seller: buildSellerFromProfile(profile),
        bankDetails: buildBankDetailsFromProfile(profile),
        shippingSameAsBilling: true,
      }

      const draft = consumeSaleInvoiceDraft()
      const nextInvoice = draft ? buildInvoiceFromSaleDraft(baseInvoice, draft) : baseInvoice

      setInvoice(nextInvoice)
      if (draft) toast.success(en.gstInvoice.saleDraftLoaded)
    }

    if (profile) init()
  }, [profile])

  useEffect(() => {
    setInvoice((prev) => {
      const updatedItems = prev.items.map((item) => calculateInvoiceItem(item, isInterState))
      return { ...prev, items: updatedItems, totals: buildInvoiceTotals(updatedItems) }
    })
  }, [buyerState, sellerState, isInterState, hsnLookupVersion])

  useEffect(() => {
    async function syncData() {
      try {
        await syncSupabaseToDexie()
      } catch {
        toast.error(en.gstInvoice.localSavedCloudPending)
      }
    }

    syncData()
  }, [])

  const handleBuyerChange = (field: string, value: string) => {
    const matchedSuggestion =
      field === "name" || field === "gstin" || field === "phone" || field === "email"
        ? matchBuyerSuggestion(buyerSuggestions, field, value)
        : null

    const updatedBuyer = matchedSuggestion
      ? {
          ...invoice.buyer,
          ...matchedSuggestion.buyer,
          [field]: value,
        }
      : { ...invoice.buyer, [field]: value }

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

  const updateInvoiceItem = (index: number, patch: Partial<GSTInvoice["items"][number]>) => {
    setInvoice((prev) => {
      const updatedItems = [...prev.items]
      const current = updatedItems[index]
      if (!current) return prev

      updatedItems[index] = calculateInvoiceItem({ ...current, ...patch }, isInterState)

      return {
        ...prev,
        items: updatedItems,
        totals: buildInvoiceTotals(updatedItems),
      }
    })
  }

  const handleItemChange = (index: number, field: string, value: string | number) => {
    updateInvoiceItem(index, { [field]: value })
  }

  const handleItemPatch = (index: number, patch: Partial<GSTInvoice["items"][number]>) => {
    updateInvoiceItem(index, patch)
  }

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
      const nextItems = items.length ? items : [createEmptyInvoiceItem()]
      return {
        ...prev,
        items: nextItems,
        totals: buildInvoiceTotals(nextItems),
      }
    })
  }

  const resetInvoice = () => {
    setResetConfirmOpen(true)
  }

  const completeInvoiceReset = () => {
    const nextInvoiceNo = buildInvoiceNumber(profile, invoices)

    setActiveInvoiceId(null)
    setInvoice({
      ...createEmptyInvoice(),
      invoiceNo: nextInvoiceNo,
      invoiceDate: today,
      dueDate: today,
      seller: buildSellerFromProfile(profile),
      bankDetails: buildBankDetailsFromProfile(profile),
      shippingSameAsBilling: true,
    })

    setResetConfirmOpen(false)
    toast.success(en.gstInvoice.resetDone)
  }

  const saveInvoice = async () => {
    const cleanedInvoice = sanitizeInvoiceForSave(invoice)
    const validation = validateInvoice(cleanedInvoice)

    if (!validation.valid) {
      toast.error(validation.errors[0])
      return
    }

    const optionValidation = validateTransactionOptions(transactionOptions)
    if (!optionValidation.valid) {
      toast.warning(optionValidation.message)
      return
    }

    setSaving(true)

    try {
      const invoiceToSave = activeInvoiceId
        ? ({ ...cleanedInvoice, id: activeInvoiceId } as GSTInvoice & { id: string })
        : cleanedInvoice

      const saved = await saveInvoiceToDb(invoiceToSave, undefined, "pending")
      let finalSaved = saved

      try {
        await saveInvoiceToSupabase(saved)
        finalSaved = await saveInvoiceToDb(saved, undefined, "synced")
      } catch {
        toast.warning(en.gstInvoice.localSavedCloudPending)
      }

      setInvoices((prev) => {
        const withoutCurrent = prev.filter((entry) => entry.id !== finalSaved.id)
        return [finalSaved, ...withoutCurrent]
      })

      await runTransactionDocumentActions(buildGstInvoiceDocument(invoiceToSave), transactionOptions)

      toast.success(en.gstInvoice.saved)
      completeInvoiceReset()
    } catch (err) {
      console.error("GST invoice save failed", err)
      toast.error(en.gstInvoice.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const loadInvoiceFromHistory = (inv: GSTInvoiceRecord) => {
    setActiveInvoiceId(inv.id)
    setActiveTab("new")
    toast.success(en.gstInvoice.loadedFromHistory)

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

  return {
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
  }
}
