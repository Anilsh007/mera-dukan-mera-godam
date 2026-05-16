// InvoiceHelpers.tsx

import React from "react"
import { en } from "@/app/messages/en"

// -------------------- PartyCard --------------------
export function PartyCard({
  title,
  party,
  fallback,
  customLabels,
}: {
  title: string
  party: {
    name?: string
    gstin?: string
    address?: string
    city?: string
    state?: string
    pincode?: string
    phone?: string
    email?: string
  }
  fallback: string
  customLabels?: Partial<Record<"gstin" | "address" | "city", string>>
}) {
  const fullAddress = [
    party.address,
    party.city,
    party.state,
    party.pincode,
  ]
    .filter(Boolean)
    .join(", ")

  const lines = [
    party.name,

    party.gstin && (
      <span>
        <strong>{customLabels?.gstin || en.gstInvoice.gstin}:</strong> {party.gstin}
      </span>
    ),

    fullAddress && (
      <span>
        <strong>{customLabels?.address || en.profile.address}:</strong> {fullAddress}
      </span>
    ),

    party.phone && (
      <span>
        <strong>{en.profile.phone}:</strong> {party.phone}
      </span>
    ),

    party.email && (
      <span>
        <strong>{en.profile.email}:</strong> {party.email}
      </span>
    ),
  ].filter(Boolean)

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-semibold">{title}</p>

      {lines.length ? (
        <div className="mt-2 space-y-1 break-words text-sm text-slate-600">
          {lines.map((line, index) => (
            <p key={index}>{line}</p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{fallback}</p>
      )}
    </div>
  )
}

// -------------------- SummaryRow (UNCHANGED) --------------------
export function SummaryRow({
  label,
  value,
  strong = false,
}: {
  label: string
  value: number
  strong?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={strong ? "font-semibold" : "text-slate-500"}>
        {label}
      </span>
      <span className={strong ? "font-bold" : "font-semibold"}>
        {en.common.rupeeSymbol} {value.toFixed(2)}
      </span>
    </div>
  )
}