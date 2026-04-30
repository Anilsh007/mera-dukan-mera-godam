// InvoiceHelpers.tsx

import React from "react"

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
  const lines = [
    party.name,
    party.gstin && `${customLabels?.gstin || "GSTIN"}: ${party.gstin}`,
    party.address && `${customLabels?.address || "Address"}: ${party.address}`,
    party.city && `${customLabels?.city || "City"}: ${party.city}`,
    party.state && `State: ${party.state}`,
    party.pincode && `Pincode: ${party.pincode}`,
    party.phone && `Phone: ${party.phone}`,
    party.email && `Email: ${party.email}`,
  ].filter(Boolean)

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-semibold">{title}</p>
      {lines.length ? (
        <div className="mt-2 space-y-1 break-words text-sm text-slate-600">
          {lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm text-slate-500">{fallback}</p>
      )}
    </div>
  )
}

// -------------------- SummaryRow --------------------
export function SummaryRow({ label, value, strong = false }: { label: string; value: number; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className={strong ? "font-semibold" : "text-slate-500"}>{label}</span>
      <span className={strong ? "font-bold" : "font-semibold"}>Rs {value.toFixed(2)}</span>
    </div>
  )
}