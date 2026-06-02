"use client"

import { MdWarehouse } from "react-icons/md"
import { useInventoryLocations } from "@/app/hooks/useAdvancedInventory"
import { en } from "@/app/messages/en"

export default function GodownCard() {
  const { locations, loading } = useInventoryLocations()

  return (
    <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex items-center gap-2 text-[var(--text-primary)]">
        <MdWarehouse className="text-emerald-500" size={20} aria-hidden="true" />
        <h3 className="text-base font-bold">{en.advancedInventory.locations}</h3>
      </div>

      {loading ? (
        <p className="text-sm text-[var(--text-secondary)]">{en.common.loading}</p>
      ) : (
        <div className="space-y-3">
          {locations.map((location) => (
            <article key={location.id} className="rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--text-primary)]">{location.name}</p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {location.code || en.common.notAvailable}
                  </p>
                </div>
                {location.isDefault ? (
                  <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-600">
                    {en.advancedInventory.defaultGodownName}
                  </span>
                ) : null}
              </div>
              {location.notes ? <p className="mt-2 text-xs text-[var(--text-secondary)]">{location.notes}</p> : null}
            </article>
          ))}

          {!locations.length ? (
            <p className="rounded-xl border border-dashed border-[var(--border-input)] p-3 text-sm text-[var(--text-secondary)]">
              {en.advancedInventory.noGodownsAdded}
            </p>
          ) : null}
        </div>
      )}
    </div>
  )
}
