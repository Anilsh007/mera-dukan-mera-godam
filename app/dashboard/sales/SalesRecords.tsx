"use client"

import { createPortal } from "react-dom"
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from "react"
import { ChevronDown } from "lucide-react"
import PaymentStatusBadge from "@/app/components/ui/PaymentStatusBadge"
import ResponsiveDataTable from "@/app/components/ui/ResponsiveDataTable"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import type { SaleRecord } from "@/app/lib/db"
import type { BusinessDocumentProfile } from "@/app/lib/transactionDocument"
import { buildSaleTransactionDocument } from "@/app/lib/sales/sale.documents"
import { buildItemsSummary, formatDateTime } from "./sales.utils"

type SalesRecordsProps = {
  paginatedSales: SaleRecord[]
  sellerProfile: BusinessDocumentProfile
  onCreateDraft: (sale: SaleRecord) => void
  onCreateReturn: (sale: SaleRecord) => void
  onCreateExchange: (sale: SaleRecord) => void
  onCancelSale: (sale: SaleRecord) => void
}

export default function SalesRecords({
  paginatedSales,
  sellerProfile,
  onCreateDraft,
  onCreateReturn,
  onCreateExchange,
  onCancelSale,
}: SalesRecordsProps) {
  return (
    <>
      <section className="grid grid-cols-1 gap-4 md:hidden">
        {paginatedSales.map((sale) => (
          <SalesRecordCard
            key={sale.id}
            sale={sale}
            sellerProfile={sellerProfile}
            onCreateDraft={onCreateDraft}
            onCreateReturn={onCreateReturn}
            onCreateExchange={onCreateExchange}
            onCancelSale={onCancelSale}
          />
        ))}
      </section>

      <section className="hidden overflow-hidden rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] px-4 shadow-[var(--shadow-card)] backdrop-blur-xl md:block">
        <ResponsiveDataTable rows={paginatedSales} getRowKey={(sale) => sale.id}
          columns={[
            { key: "receipt", header: en.sales.receiptNo, render: (sale) => <span className="font-semibold text-[var(--text-primary)]">{sale.receiptNo}</span> },
            { key: "date", header: en.sales.saleDate, render: (sale) => formatDateTime(sale.saleDateTime), className: "text-[var(--text-secondary)]" },
            { key: "customer", header: en.sales.customerName, render: (sale) => sale.customer?.name || en.common.notAvailable, className: "text-[var(--text-secondary)]" },
            { key: "items", header: en.sales.itemsSummary, render: buildItemsSummary, className: "text-[var(--text-secondary)]" },
            { key: "total", header: en.sales.totalAmount, render: (sale) => formatCurrency(sale.totalAmount), className: "font-semibold text-[var(--text-primary)]" },
            { key: "paid", header: en.sales.amountPaid, render: (sale) => formatCurrency(sale.amountPaid), className: "text-[var(--text-secondary)]" },
            { key: "due", header: en.sales.dueAmount, render: (sale) => formatCurrency(sale.dueAmount), className: "text-[var(--text-secondary)]" },
            { key: "status", header: en.sales.paymentStatus, render: (sale) => <PaymentStatusBadge status={sale.paymentStatus} cancelled={sale.status === "cancelled"} /> },
            { key: "mode", header: en.sales.paymentMode, render: (sale) => sale.paymentMode, className: "text-[var(--text-secondary)]" },
            {
              key: "actions",
              header: en.gstInvoice.action,
              render: (sale) => (
                <div className="flex items-center gap-2">
                  <TransactionActionPanel document={buildSaleTransactionDocument(sale, sellerProfile)} />
                  <SaleMoreActionsMenu sale={sale} onCreateDraft={onCreateDraft} onCreateReturn={onCreateReturn} onCreateExchange={onCreateExchange} onCancelSale={onCancelSale} />
                </div>
              ),
            },
          ]}
        />
      </section>
    </>
  )
}

function SalesRecordCard({
  sale,
  sellerProfile,
  onCreateDraft,
  onCreateReturn,
  onCreateExchange,
  onCancelSale,
}: {
  sale: SaleRecord
  sellerProfile: BusinessDocumentProfile
  onCreateDraft: (sale: SaleRecord) => void
  onCreateReturn: (sale: SaleRecord) => void
  onCreateExchange: (sale: SaleRecord) => void
  onCancelSale: (sale: SaleRecord) => void
}) {
  return (
    <article className="rounded-[28px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{en.sales.receiptNo}</p>
          <p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{sale.receiptNo}</p>
        </div>
        <PaymentStatusBadge status={sale.paymentStatus} cancelled={sale.status === "cancelled"} />
      </div>
      <div className="mt-4 space-y-2 text-sm text-[var(--text-secondary)]">
        <p>{en.sales.customerName}: {sale.customer?.name || en.common.notAvailable}</p>
        <p>{en.sales.saleDate}: {formatDateTime(sale.saleDateTime)}</p>
        <p>{en.sales.itemsSummary}: {buildItemsSummary(sale)}</p>
        <p>{en.sales.totalAmount}: {formatCurrency(sale.totalAmount)}</p>
        <p>{en.sales.dueAmount}: {formatCurrency(sale.dueAmount)}</p>
      </div>
      <div className="mt-4">
        <TransactionActionPanel document={buildSaleTransactionDocument(sale, sellerProfile)} />
      </div>
      <div className="mt-4">
        <SaleMoreActionsMenu
          sale={sale}
          onCreateDraft={onCreateDraft}
          onCreateReturn={onCreateReturn}
          onCreateExchange={onCreateExchange}
          onCancelSale={onCancelSale}
          fullWidth
        />
      </div>
    </article>
  )
}

function SaleMoreActionsMenu({
  sale,
  onCreateDraft,
  onCreateReturn,
  onCreateExchange,
  onCancelSale,
  fullWidth = false,
}: {
  sale: SaleRecord
  onCreateDraft: (sale: SaleRecord) => void
  onCreateReturn: (sale: SaleRecord) => void
  onCreateExchange: (sale: SaleRecord) => void
  onCancelSale: (sale: SaleRecord) => void
  fullWidth?: boolean
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)
  const actions = [
    {
      key: "return",
      label: en.sales.returnSale,
      onClick: () => onCreateReturn(sale),
      disabled: sale.status === "cancelled",
      toneClass: "text-[var(--text-primary)]",
    },
    {
      key: "exchange",
      label: en.sales.exchangeSale,
      onClick: () => onCreateExchange(sale),
      disabled: sale.status === "cancelled",
      toneClass: "text-sky-700 dark:text-sky-200",
    },
    {
      key: "draft",
      label: en.sales.createFromThisSale,
      onClick: () => onCreateDraft(sale),
      disabled: false,
      toneClass: "text-[var(--text-primary)]",
    },
    {
      key: "cancel",
      label: en.sales.cancelSale,
      onClick: () => onCancelSale(sale),
      disabled: sale.status === "cancelled",
      toneClass: "text-rose-600 dark:text-rose-300",
    },
  ]

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    globalThis.document.addEventListener("pointerdown", handlePointerDown)
    globalThis.document.addEventListener("keydown", handleKeyDown)

    return () => {
      globalThis.document.removeEventListener("pointerdown", handlePointerDown)
      globalThis.document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  useLayoutEffect(() => {
    if (!open) return

    const updateMenuPosition = () => {
      const trigger = triggerRef.current
      if (!trigger) return

      const rect = trigger.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const menuWidth = Math.min(240, viewportWidth - 24)
      const left = Math.min(Math.max(rect.right - menuWidth, 12), viewportWidth - menuWidth - 12)
      const estimatedHeight = actions.length * 46 + 20
      const openUpward = rect.top > estimatedHeight + 16

      setMenuStyle({
        position: "fixed",
        left,
        top: openUpward ? rect.top - 8 : rect.bottom + 8,
        transform: openUpward ? "translateY(-100%)" : undefined,
        width: menuWidth,
      })
    }

    updateMenuPosition()
    window.addEventListener("resize", updateMenuPosition)
    window.addEventListener("scroll", updateMenuPosition, true)

    return () => {
      window.removeEventListener("resize", updateMenuPosition)
      window.removeEventListener("scroll", updateMenuPosition, true)
    }
  }, [actions.length, open])

  return (
    <div ref={rootRef} className={`relative ${fullWidth ? "w-full" : "inline-flex"}`}>
      {open && typeof document !== "undefined" && menuStyle
        ? createPortal(
          <div
            ref={menuRef}
            role="menu"
            className="z-[9999] overflow-hidden rounded-[24px] border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-2 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl"
            style={menuStyle}
          >
            <div className="space-y-1">
              {actions.map((action) => (
                <button
                  key={action.key}
                  type="button"
                  role="menuitem"
                  disabled={action.disabled}
                  onClick={() => {
                    setOpen(false)
                    action.onClick()
                  }}
                  className={[
                    "flex min-h-11 w-full items-center justify-start rounded-2xl px-4 py-2 text-sm font-semibold transition",
                    action.disabled
                      ? "cursor-not-allowed opacity-50"
                      : "hover:bg-[var(--surface-subtle)]",
                    action.toneClass,
                  ].join(" ")}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>,
          globalThis.document.body,
        )
        : null}

      <button ref={triggerRef} type="button" onClick={() => setOpen((current) => !current)} aria-haspopup="menu" aria-expanded={open}
        className={["inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border-card)] bg-[linear-gradient(145deg,var(--surface-primary),color-mix(in_srgb,var(--bg-card-strong)_84%,#020611_16%))] px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] shadow-[var(--button-shadow)] transition hover:border-[var(--accent)] hover:bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface-primary)_58%,var(--accent-soft)_42%),color-mix(in_srgb,var(--bg-card-strong)_76%,#020611_24%))] hover:shadow-[var(--button-shadow-hover)]",
          fullWidth ? "w-full" : "",
        ].join(" ")}
      >
        <span>{en.sales.moreActions}</span>
        <ChevronDown size={16} aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
    </div>
  )
}
