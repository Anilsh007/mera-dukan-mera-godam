"use client"

import { useMemo, useState } from "react"
import Input from "@/app/components/ui/Input"
import Button from "@/app/components/ui/Button"
import SectionCard from "../components/SectionCard"
import { auth } from "@/app/lib/firebase"
import { notify as toast } from "@/app/lib/notifications"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { ensureDefaultInventoryLocation, saveInventoryLocation } from "@/app/lib/advancedInventory/advancedInventory.service"
import { useInventoryLocations } from "@/app/hooks/useAdvancedInventory"
import { en } from "@/app/messages/en"
import { MdWarehouse } from "react-icons/md"

export default function GodownInfo() {
  const { locations, loading } = useInventoryLocations()
  const [locationName, setLocationName] = useState("")
  const [locationCode, setLocationCode] = useState("")
  const [locationNotes, setLocationNotes] = useState("")
  const [saving, setSaving] = useState(false)
  const currentLocations = useMemo(() => locations || [], [locations])

  const handleEnsureDefault = async () => {
    try {
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await ensureDefaultInventoryLocation(userId)
      toast.success(en.advancedInventory.locationSaved)
    } catch (error) {
      console.error("Default godown ensure failed", error)
      toast.error(error instanceof Error ? error.message : en.advancedInventory.locationSaveFailed)
    }
  }

  const handleSaveLocation = async () => {
    try {
      setSaving(true)
      const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
      await saveInventoryLocation({ userId, name: locationName, code: locationCode, notes: locationNotes })
      toast.success(en.advancedInventory.locationSaved)
      setLocationName("")
      setLocationCode("")
      setLocationNotes("")
    } catch (error) {
      console.error("Godown save failed", error)
      toast.error(error instanceof Error ? error.message : en.advancedInventory.locationSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SectionCard title={en.advancedInventory.locations} icon={<MdWarehouse />} iconColor="text-emerald-500">
      <div className="grid gap-4 lg:grid-cols-[minmax(320px,0.75fr)_minmax(0,1.25fr)]">
        <div className="space-y-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
          <h3 className="text-base font-bold text-[var(--text-primary)]">{en.advancedInventory.saveLocation}</h3>
          <Input label={en.advancedInventory.locationName} value={locationName} onChange={(event) => setLocationName(event.target.value)} placeholder={en.advancedInventory.locationNamePlaceholder} />
          <Input label={en.advancedInventory.locationCode} value={locationCode} onChange={(event) => setLocationCode(event.target.value)} />
          <Input label={en.advancedInventory.locationNotes} value={locationNotes} onChange={(event) => setLocationNotes(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button type="button" title={en.advancedInventory.defaultGodownName} variant="outline" onClick={() => void handleEnsureDefault()} />
            <Button type="button" title={en.advancedInventory.saveLocation} onClick={() => void handleSaveLocation()} loading={saving} disabled={saving || loading} />
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
            <h3 className="text-base font-bold text-[var(--text-primary)]">{en.advancedInventory.locations}</h3>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">{en.advancedInventory.bundleNote}</p>
          </div>
          <div className="grid gap-3">
            {currentLocations.map((location) => (
              <article key={location.id} className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card)] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">{location.name}</p>
                    <p className="text-sm text-[var(--text-secondary)]">{location.code || en.common.notAvailable}</p>
                  </div>
                  {location.isDefault ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-600">
                      {en.advancedInventory.defaultGodownName}
                    </span>
                  ) : null}
                </div>
                {location.notes ? <p className="mt-2 text-sm text-[var(--text-secondary)]">{location.notes}</p> : null}
              </article>
            ))}
            {!currentLocations.length ? (
              <p className="rounded-2xl border border-dashed border-[var(--border-input)] p-4 text-sm text-[var(--text-secondary)]">
                {en.common.loading}
              </p>
            ) : null}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
