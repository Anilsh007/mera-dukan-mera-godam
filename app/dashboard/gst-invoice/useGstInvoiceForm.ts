"use client"

import { useEffect, useMemo, useRef, useState } from "react"

import useProfile from "@/app/dashboard/profile/useProfile"
import useAuthLiveQuery from "@/app/hooks/useAuthLiveQuery"
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
  saveInvoiceWithSync,
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
import { buildGstInvoiceCopyDocuments, type GstInvoiceCopyMode } from "./lib/invoiceCopy"
import {
  createTransactionOptions,
  runTransactionDocumentActions,
  ensureValidTransactionOptions,
} from "@/app/lib/transactionActions"

const today = new Date().toISOString().slice(0, 10)

export function useGstInvoiceForm() {
  const [draftInvoice, setDraftInvoice] = useState<GSTInvoice>(createEmptyInvoice())
  const [saving, setSaving] = useState(false)
  const [activeInvoiceId, setActiveInvoiceId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<"new" | "saved">("new")
  const [previewMode, setPreviewMode] = useState<"preview" | "print" | null>(null)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const hasInitializedDraftRef = useRef(false)

  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>(createTransactionOptions())
  const [invoiceCopyMode, setInvoiceCopyMode] = useState<GstInvoiceCopyMode>("customer")

  const { profile } = useProfile()
  const { data: invoiceHistory } = useAuthLiveQuery<GSTInvoiceRecord[]>(
    [],
    async (userId) => loadInvoicesFromDb(userId),
    (error) => {
      console.error("GST invoice history load failed", error)
      toast.error(en.common.loadFailed)
    },
  )

  const invoices = invoiceHistory

  const isInterState = isInterStateSupply({
    seller: draftInvoice.seller,
    buyer: draftInvoice.buyer,
  } as GSTInvoice)
  const invoice = useMemo(() => {
    const updatedItems = draftInvoice.items.map((item) => calculateInvoiceItem(item, isInterState))
    return {
      ...draftInvoice,
      items: updatedItems,
      totals: buildInvoiceTotals(updatedItems),
    }
  }, [draftInvoice, isInterState])

  const buyerSuggestions = useMemo(() => buildBuyerSuggestions(invoices), [invoices])

  useEffect(() => {
    warmHsnSacLookup().catch((error) => {
      console.error("HSN/SAC data load failed", error)
      toast.warning(en.gstInvoice.hsnLookupUnavailable, { id: "gst-hsn-lookup-warning" })
    })
  }, [])

  useEffect(() => {
    if (!profile || hasInitializedDraftRef.current) return

    const baseInvoice: GSTInvoice = {
      ...createEmptyInvoice(),
      invoiceNo: buildInvoiceNumber(profile, invoiceHistory),
      invoiceDate: today,
      dueDate: today,
      seller: buildSellerFromProfile(profile),
      bankDetails: buildBankDetailsFromProfile(profile),
      shippingSameAsBilling: true,
    }

    const draft = consumeSaleInvoiceDraft()
    const nextInvoice = draft ? buildInvoiceFromSaleDraft(baseInvoice, draft) : baseInvoice

    setDraftInvoice(nextInvoice)
    setActiveInvoiceId(null)
    hasInitializedDraftRef.current = true

    if (draft) toast.success(en.gstInvoice.saleDraftLoaded)
  }, [profile, invoiceHistory])

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

    setDraftInvoice((prev) => ({
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
    setDraftInvoice((prev) => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        [field]: value,
      },
    }))
  }

  const handleShippingSameChange = (checked: boolean) => {
    setDraftInvoice((prev) => ({
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
    setDraftInvoice((prev) => {
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
    setDraftInvoice((prev) => {
      const items = [...prev.items, createEmptyInvoiceItem()]
      return {
        ...prev,
        items,
        totals: buildInvoiceTotals(items),
      }
    })
  }

  const removeItem = (index: number) => {
    setDraftInvoice((prev) => {
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
    setDraftInvoice({
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

    if (!ensureValidTransactionOptions(transactionOptions)) return

    setSaving(true)

    try {
      const invoiceToSave = activeInvoiceId
        ? ({ ...cleanedInvoice, id: activeInvoiceId } as GSTInvoice & { id: string })
        : cleanedInvoice

      const finalSaved = await saveInvoiceWithSync(invoiceToSave)
      if (finalSaved.syncStatus !== "synced") toast.warning(en.gstInvoice.localSavedCloudPending)

      const invoiceDocuments = buildGstInvoiceCopyDocuments(buildGstInvoiceDocument(invoiceToSave), invoiceCopyMode)
      for (const invoiceDocument of invoiceDocuments) {
        await runTransactionDocumentActions(invoiceDocument, transactionOptions)
      }

      toast.success(en.gstInvoice.saved)
      completeInvoiceReset()
    } catch (err) {
      console.error("GST invoice save failed", err)
      toast.error(err instanceof Error ? err.message : en.gstInvoice.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  const loadInvoiceFromHistory = (inv: GSTInvoiceRecord) => {
    setActiveInvoiceId(inv.id)
    setActiveTab("new")
    toast.success(en.gstInvoice.loadedFromHistory)

    setDraftInvoice({
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
    invoiceCopyMode,
    isInterState,
    buyerSuggestions,

    setInvoice: setDraftInvoice,
    setActiveTab,
    setPreviewMode,
    setResetConfirmOpen,
    setTransactionOptions,
    setInvoiceCopyMode,

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

