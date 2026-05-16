"use client"

import { useEffect, useMemo, useState } from "react"
import { notify as toast } from "@/app/lib/notifications"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import SummaryCard from "@/app/components/ui/SummaryCard"
import { Product } from "@/app/lib/db"
import { STOCK_THRESHOLDS } from "@/app/lib/inventory.utils"
import { formatQuantity, normalizeQuantityUnit, QUANTITY_UNITS } from "@/app/lib/quantityUnit"
import {
  adjustProductStock,
  deleteProductWithLogs,
  updateProductDetails,
} from "@/app/dashboard/quick-purchase/product.service"
import useProducts from "@/app/hooks/useProducts"
import { en } from "@/app/messages/en"

type Props = {
  open: boolean
  mode: "edit" | "delete"
  product: Product | null
  historyCount: number
  onClose: () => void
  onSaved: (message: string) => void
}

type FormState = {
  name: string
  categoryOption: string
  customCategory: string
  supplier: string
  expiry: string
  price: string
  quantityUnit: string
  sku: string
  hsnCode: string
  note: string
  lowStockThreshold: string
  criticalStockThreshold: string
}

type AdjustmentState = {
  type: "in" | "out"
  quantity: string
  note: string
}

const NO_CATEGORY_VALUE = "__none__"
const NEW_CATEGORY_VALUE = "__new__"
const selectClass =
  "min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all focus:ring-2 focus:ring-emerald-400"

const emptyForm: FormState = {
  name: "",
  categoryOption: NO_CATEGORY_VALUE,
  customCategory: "",
  supplier: "",
  expiry: "",
  price: "",
  quantityUnit: " ",
  sku: "",
  hsnCode: "",
  note: "",
  lowStockThreshold: "",
  criticalStockThreshold: "",
}

const emptyAdjustment: AdjustmentState = {
  type: "in",
  quantity: "",
  note: "",
}

export default function ProductManagementModal({
  open,
  mode,
  product,
  historyCount,
  onClose,
  onSaved,
}: Props) {
  const { products } = useProducts()
  const [form, setForm] = useState<FormState>(emptyForm)
  const [loading, setLoading] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [showStockAdjustment, setShowStockAdjustment] = useState(false)
  const [deleteArmed, setDeleteArmed] = useState(false)
  const [adjustment, setAdjustment] = useState<AdjustmentState>(emptyAdjustment)

  const categoryOptions = useMemo(
    () => buildCategoryOptions(products, product?.category),
    [products, product?.category]
  )

  useEffect(() => {
    if (!product) return

    setForm({
      name: product.name || "",
      categoryOption: normalizeCategoryInput(product.category) || NO_CATEGORY_VALUE,
      customCategory: "",
      supplier: product.supplier || "",
      expiry: product.expiry || "",
      price: String(product.price ?? ""),
      quantityUnit: normalizeQuantityUnit(product.quantityUnit),
      sku: product.sku || "",
      hsnCode: product.hsnCode || "",
      note: product.note || "",
      lowStockThreshold: product.lowStockThreshold !== undefined ? String(product.lowStockThreshold) : "",
      criticalStockThreshold: product.criticalStockThreshold !== undefined ? String(product.criticalStockThreshold) : "",
    })
    setAdjustment(emptyAdjustment)
    setShowWarning(false)
    setShowStockAdjustment(false)
    setDeleteArmed(false)
  }, [product])

  const adjustmentQuantity = Number(adjustment.quantity || 0)
  const hasStockAdjustment = Number.isFinite(adjustmentQuantity) && adjustmentQuantity > 0

  const resolvedCategory = useMemo(() => {
    if (form.categoryOption === NEW_CATEGORY_VALUE) {
      return normalizeCategoryInput(form.customCategory)
    }

    if (form.categoryOption === NO_CATEGORY_VALUE) {
      return ""
    }

    return normalizeCategoryInput(form.categoryOption)
  }, [form.categoryOption, form.customCategory])

  const effectiveNewStock = useMemo(() => {
    const currentStock = Number(product?.quantity || 0)
    if (!hasStockAdjustment) return currentStock
    return adjustment.type === "in"
      ? currentStock + adjustmentQuantity
      : currentStock - adjustmentQuantity
  }, [adjustment.type, adjustmentQuantity, hasStockAdjustment, product?.quantity])

  const inventoryValue = useMemo(() => {
    const price = Number(form.price || 0)
    return price * Math.max(effectiveNewStock, 0)
  }, [effectiveNewStock, form.price])

  if (!open || !product) return null

  const setField = (key: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [key]: value }))

  const setAdjustmentField = (key: keyof AdjustmentState, value: string) =>
    setAdjustment((current) => ({ ...current, [key]: value }))

  const handleSave = async () => {
    if (!form.name.trim()) return toast.error(en.inventory.productManagement.enterItemName)
    if (!form.price || Number(form.price) < 0) return toast.error(en.inventory.enterRate)
    if (!form.quantityUnit.trim()) return toast.error(en.inventory.productManagement.enterUnit)
    if (
      normalizeQuantityUnit(form.quantityUnit) !== normalizeQuantityUnit(product.quantityUnit) &&
      (Number(product.quantity || 0) > 0 || historyCount > 0)
    ) {
      return toast.error(en.inventory.productManagement.unitChangeLocked)
    }
    if (form.categoryOption === NEW_CATEGORY_VALUE && !resolvedCategory) {
      return toast.error(en.inventory.productManagement.enterNewCategory)
    }

    const lowStockThreshold = parseOptionalNumber(form.lowStockThreshold)
    const criticalStockThreshold = parseOptionalNumber(form.criticalStockThreshold)
    if (lowStockThreshold !== undefined && lowStockThreshold < 0) return toast.error(en.inventory.productManagement.lowStockInvalid)
    if (criticalStockThreshold !== undefined && criticalStockThreshold < 0) return toast.error(en.inventory.productManagement.criticalStockInvalid)
    if (
      lowStockThreshold !== undefined &&
      criticalStockThreshold !== undefined &&
      criticalStockThreshold > lowStockThreshold
    ) {
      return toast.error(en.inventory.productManagement.thresholdOrderInvalid)
    }
    if (hasStockAdjustment && (!Number.isFinite(adjustmentQuantity) || adjustmentQuantity <= 0)) {
      return toast.error(en.inventory.productManagement.invalidAdjustmentQuantity)
    }
    if (hasStockAdjustment && adjustment.type === "out" && adjustmentQuantity > Number(product.quantity || 0)) {
      return toast.error(en.inventory.productManagement.adjustmentExceedsStock)
    }

    try {
      setLoading(true)
      await updateProductDetails({
        productId: product.id,
        name: form.name,
        price: Number(form.price),
        quantityUnit: form.quantityUnit,
        category: resolvedCategory,
        supplier: form.supplier,
        expiry: form.expiry,
        sku: form.sku,
        hsnCode: form.hsnCode,
        note: form.note,
        lowStockThreshold,
        criticalStockThreshold,
      })

      let successMessage: string = en.inventory.productManagement.detailsSaved

      if (hasStockAdjustment) {
        await adjustProductStock({
          productId: product.id,
          direction: adjustment.type,
          quantity: adjustmentQuantity,
          quantityUnit: form.quantityUnit,
          price: Number(form.price),
          expiry: form.expiry || undefined,
          note: adjustment.note,
        })
        successMessage = en.inventory.productManagement.adjustmentSaved
      }

      toast.success(successMessage)
      onSaved(successMessage)
      onClose()
    } catch (error) {
      console.error("Product details save failed", error)
      toast.error(hasStockAdjustment ? en.inventory.productManagement.adjustmentFailed : en.inventory.productManagement.detailsSaveFailed)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteArmed) {
      setDeleteArmed(true)
      toast.warning(en.inventory.productManagement.confirmDeletePrompt)
      return
    }

    try {
      setLoading(true)
      await deleteProductWithLogs(product.id)
      toast.success(en.inventory.productManagement.deleted)
      onSaved(en.inventory.productManagement.deleted)
      onClose()
    } catch (error) {
      console.error("Product delete failed", error)
      toast.error(en.inventory.productManagement.deleteFailed)
    } finally {
      setLoading(false)
    }
  }

  const body = mode === "edit" ? (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <datalist id="product-management-quantity-units">
          {QUANTITY_UNITS.map((unit) => (
            <option key={unit.value} value={unit.value}>{unit.label}</option>
          ))}
        </datalist>

        <Input
          label={en.inventory.productManagement.itemName}
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
        />

        <div className="min-w-0">
          <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
            {en.inventory.productManagement.categoryType}
          </label>
          <select
            value={form.categoryOption}
            onChange={(event) => setField("categoryOption", event.target.value)}
            className={selectClass}
          >
            <option value={NO_CATEGORY_VALUE}>{en.inventory.productManagement.noCategoryOption}</option>
            {categoryOptions.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
            <option value={NEW_CATEGORY_VALUE}>{en.inventory.productManagement.addNewCategory}</option>
          </select>
        </div>

        {form.categoryOption === NEW_CATEGORY_VALUE && (
          <Input
            label={en.inventory.productManagement.newCategory}
            value={form.customCategory}
            placeholder={en.inventory.productManagement.newCategoryPlaceholder}
            onChange={(e) => setField("customCategory", e.target.value)}
          />
        )}

        <Input label={en.inventory.supplier} value={form.supplier} onChange={(e) => setField("supplier", e.target.value)} />
        <Input label={en.inventory.code} value={form.sku} onChange={(e) => setField("sku", e.target.value)} />
        <Input label={en.inventory.productManagement.hsnCode} value={form.hsnCode} onChange={(e) => setField("hsnCode", e.target.value)} />
        <Input label={en.inventory.expiry} type="date" value={form.expiry} onChange={(e) => setField("expiry", e.target.value)} />
        <Input label={en.inventory.productManagement.sellingPrice} type="number" min={0} value={form.price} onChange={(e) => setField("price", e.target.value)} />
        <Input
          label={<>{en.inventory.unit} <span className="text-red-400">*</span></>}
          value={form.quantityUnit}
          onChange={(e) => setField("quantityUnit", e.target.value)}
          datalist="product-management-quantity-units"
        />
        <Input
          label={en.inventory.note}
          value={form.note}
          onChange={(e) => setField("note", e.target.value)}
          containerClassName="sm:col-span-2"
        />

        <div className="sm:col-span-2 flex flex-wrap gap-3">
          <Button
            variant="outline"
            title={showWarning ? en.inventory.productManagement.hideWarningSettings : en.inventory.productManagement.setStockWarnings}
            onClick={() => setShowWarning((value) => !value)}
            className="w-full sm:w-auto"
          />
          <Button
            variant="outline"
            title={showStockAdjustment ? en.inventory.productManagement.hideStockAdjustment : en.inventory.productManagement.showStockAdjustment}
            onClick={() => setShowStockAdjustment((value) => !value)}
            className="w-full sm:w-auto"
          />
        </div>

        {showWarning && (
          <StockWarningSection
            product={product}
            criticalValue={form.criticalStockThreshold}
            lowValue={form.lowStockThreshold}
            onChange={setField}
          />
        )}

        {showStockAdjustment && (
          <div className="sm:col-span-2 rounded-2xl border border-sky-200 bg-sky-50/80 p-4 dark:border-sky-900/40 dark:bg-sky-950/20">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-base font-bold text-sky-800 dark:text-sky-200">
                  {en.inventory.productManagement.stockAdjustmentTitle}
                </p>
                <p className="mt-1 text-sm text-sky-700 dark:text-sky-300">
                  {en.inventory.productManagement.stockAdjustmentDescription}
                </p>
              </div>
              <div className="rounded-xl border border-sky-200 bg-white px-3 py-2 text-xs font-semibold text-sky-700 shadow-sm dark:border-sky-900/50 dark:bg-slate-950 dark:text-sky-300">
                {en.inventory.productManagement.currentStock}: {formatQuantity(product.quantity, form.quantityUnit)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="min-w-0">
                <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">
                  {en.inventory.productManagement.adjustmentType}
                </label>
                <select
                  value={adjustment.type}
                  onChange={(event) => setAdjustmentField("type", event.target.value as AdjustmentState["type"])}
                  className={selectClass}
                >
                  <option value="in">{en.inventory.productManagement.adjustmentAdd}</option>
                  <option value="out">{en.inventory.productManagement.adjustmentRemove}</option>
                </select>
              </div>

              <Input
                type="number"
                min={0}
                label={en.inventory.productManagement.adjustmentQuantity}
                value={adjustment.quantity}
                onChange={(e) => setAdjustmentField("quantity", e.target.value)}
                rightAddon={form.quantityUnit}
              />

              <Input
                label={en.inventory.productManagement.adjustmentNote}
                value={adjustment.note}
                placeholder={en.inventory.productManagement.adjustmentNotePlaceholder}
                onChange={(e) => setAdjustmentField("note", e.target.value)}
                containerClassName="sm:col-span-2"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-sky-200 bg-white/90 px-4 py-3 text-sm text-sky-900 shadow-sm dark:border-sky-900/50 dark:bg-slate-950/90 dark:text-sky-100">
              <p className="font-semibold">
                {hasStockAdjustment
                  ? adjustment.type === "in"
                    ? en.inventory.productManagement.adjustmentPreviewAdd
                    : en.inventory.productManagement.adjustmentPreviewRemove
                  : en.inventory.productManagement.saveWithoutAdjustment}
              </p>
              <p className="mt-1">
                {en.inventory.productManagement.availableNow}: {formatQuantity(Math.max(effectiveNewStock, 0), form.quantityUnit)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SummaryCard label={en.inventory.productManagement.availableNow} value={formatQuantity(Math.max(effectiveNewStock, 0), form.quantityUnit)} />
        <SummaryCard label={en.inventory.productManagement.historyEntries} value={String(historyCount)} />
        <SummaryCard label={en.inventory.productManagement.value} value={`${en.common.rupeeSymbol} ${inventoryValue.toLocaleString("en-IN")}`} tone="emerald" />
      </div>
    </>
  ) : (
    <div className="space-y-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-300">
      <p>{en.inventory.productManagement.availableNow}: <b>{formatQuantity(product.quantity, product.quantityUnit)}</b></p>
      <p>{en.inventory.productManagement.historyEntries}: <b>{historyCount}</b></p>
      <p>{en.inventory.productManagement.deleteSyncWarning}</p>
    </div>
  )

  return (
    <Modal
      title={mode === "edit" ? en.inventory.productManagement.editItem : product.name}
      description={mode === "edit" ? en.inventory.productManagement.editDescription : en.inventory.productManagement.deleteDescription}
      onClose={onClose}
      size="lg"
      loading={loading}
      primaryLabel={
        mode === "edit"
          ? hasStockAdjustment
            ? en.inventory.productManagement.saveAndAdjustStock
            : en.profile.saveChanges
          : deleteArmed
            ? en.inventory.productManagement.deleteItem
            : en.common.delete
      }
      primaryVariant={mode === "edit" ? "success" : "danger"}
      onPrimary={mode === "edit" ? handleSave : handleDelete}
      cancelLabel={en.common.cancel}
    >
      {body}
    </Modal>
  )
}

function parseOptionalNumber(value: string) {
  if (!value.trim()) return undefined
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : undefined
}

function normalizeCategoryInput(value?: string) {
  return value?.trim().replace(/\s+/g, " ") || ""
}

function buildCategoryOptions(products: Product[], currentCategory?: string) {
  const map = new Map<string, string>()

  products.forEach((item) => {
    const normalized = normalizeCategoryInput(item.category)
    if (!normalized) return
    const key = normalized.toLowerCase()
    if (!map.has(key)) {
      map.set(key, normalized)
    }
  })

  const normalizedCurrent = normalizeCategoryInput(currentCategory)
  if (normalizedCurrent) {
    const key = normalizedCurrent.toLowerCase()
    if (!map.has(key)) {
      map.set(key, normalizedCurrent)
    }
  }

  return Array.from(map.values())
    .sort((left, right) => left.localeCompare(right))
    .map((category) => ({
      value: category,
      label: category,
    }))
}

function StockWarningSection({
  product,
  criticalValue,
  lowValue,
  onChange,
}: {
  product: Product
  criticalValue: string
  lowValue: string
  onChange: (key: keyof FormState, value: string) => void
}) {
  const unit = normalizeQuantityUnit(product.quantityUnit)
  const critical = parseOptionalNumber(criticalValue) ?? STOCK_THRESHOLDS.criticalMax
  const low = parseOptionalNumber(lowValue) ?? STOCK_THRESHOLDS.lowMax

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900/40 dark:bg-amber-950/20 sm:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-base font-bold text-amber-800 dark:text-amber-200">
            {en.inventory.productManagement.warningTitle}
          </p>
          <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
            {en.inventory.productManagement.warningDescription}
          </p>
        </div>
        <div className="w-fit rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-semibold text-amber-700 shadow-sm dark:border-amber-900/50 dark:bg-slate-950 dark:text-amber-300">
          {en.inventory.productManagement.currentStock}: {formatQuantity(product.quantity, unit)}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-red-200 bg-white p-3 shadow-sm dark:border-red-900/40 dark:bg-slate-950">
          <Input
            type="number"
            min={0}
            label={en.inventory.productManagement.criticalStock}
            helperText={en.inventory.productManagement.criticalStockHelp}
            value={criticalValue}
            onChange={(e) => onChange("criticalStockThreshold", e.target.value)}
            placeholder={String(STOCK_THRESHOLDS.criticalMax)}
            rightAddon={unit}
          />
        </div>

        <div className="rounded-2xl border border-amber-200 bg-white p-3 shadow-sm dark:border-amber-900/40 dark:bg-slate-950">
          <Input
            type="number"
            min={0}
            label={en.inventory.productManagement.lowStock}
            helperText={en.inventory.productManagement.lowStockHelp}
            value={lowValue}
            onChange={(e) => onChange("lowStockThreshold", e.target.value)}
            placeholder={String(STOCK_THRESHOLDS.lowMax)}
            rightAddon={unit}
          />
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-white/80 p-3 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-slate-950/80 dark:text-amber-200">
        <p className="font-semibold">{en.inventory.productManagement.example}</p>
        <p className="mt-1">
          {`${en.inventory.productManagement.criticalStock} = ${critical}, ${en.inventory.productManagement.lowStock} = ${low}: ${critical} ${unit} ${en.inventory.productManagement.redWarningSuffix}; ${critical + 1} ${unit} - ${low} ${unit} ${en.inventory.productManagement.yellowWarningText}.`}
        </p>
        <p className="mt-2 text-[var(--text-secondary)]">
          {en.inventory.productManagement.defaultThresholdHint}
        </p>
      </div>
    </div>
  )
}
