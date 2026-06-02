"use client"

import { useState } from "react"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import SelectField from "@/app/components/ui/SelectField"
import { notify as toast } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { ensurePartyRecord } from "@/app/lib/parties/party.service"
import type { PartyType } from "@/app/lib/db"
import { useEffect } from "react"

type PartyFormValue = {
  name: string
  mobile: string
  email: string
  gstin: string
  address: string
  city: string
  state: string
  pincode: string
  type: PartyType | ""
  openingBalance: string
  notes: string
}

const EMPTY_VALUE: PartyFormValue = {
  name: "",
  mobile: "",
  email: "",
  gstin: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  type: "",
  openingBalance: "0",
  notes: "",
}

export default function PartyFormModal({
  open,
  type = "customer",
  onClose,
}: {
  open: boolean
  type?: PartyType
  onClose: () => void
}) {
  const [value, setValue] = useState<PartyFormValue>(EMPTY_VALUE)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setValue((current) => (current.type ? current : { ...EMPTY_VALUE, type }))
  }, [open, type])

  const update = (key: keyof PartyFormValue, next: string) => {
    setValue((current) => ({ ...current, [key]: next }))
  }

  const handleSave = async () => {
    if (!value.type) {
      toast.error(en.parties.typeRequired)
      return
    }
    try {
      setSaving(true)
      await ensurePartyRecord({
        userId: requireUserIdentityFromAuthUser(auth?.currentUser),
        name: value.name,
        mobile: value.mobile,
        email: value.email,
        gstin: value.gstin,
        address: value.address,
        city: value.city,
        state: value.state,
        pincode: value.pincode,
        type: value.type,
        openingBalance: Number(value.openingBalance || 0),
        notes: value.notes,
      })
      toast.success(en.parties.partySaved)
      onClose()
    } catch (error) {
      console.error("Party save failed", error)
      toast.error(error instanceof Error ? error.message : en.parties.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={en.parties.addParty}
      description={en.parties.createPartyDescription}
      primaryLabel={en.parties.saveParty}
      onPrimary={handleSave}
      loading={saving}
      size="xl"
    >
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <Input label={en.parties.name} value={value.name} onChange={(event) => update("name", event.target.value)} />
        <SelectField
          label={en.parties.type}
          value={value.type}
          onChange={(event) => update("type", event.target.value)}
          options={[
            { value: "customer", label: en.parties.customer },
            { value: "supplier", label: en.parties.supplier },
            { value: "both", label: en.parties.both },
          ]}
        />
        <Input label={en.parties.mobile} value={value.mobile} onChange={(event) => update("mobile", event.target.value)} />
        <Input label={en.parties.email} value={value.email} onChange={(event) => update("email", event.target.value)} />
        <Input label={en.parties.gstin} value={value.gstin} onChange={(event) => update("gstin", event.target.value.toUpperCase())} />
        <Input label={en.parties.pincode} value={value.pincode} onChange={(event) => update("pincode", event.target.value)} />
        <Input label={en.parties.city} value={value.city} onChange={(event) => update("city", event.target.value)} />
        <Input label={en.parties.state} value={value.state} onChange={(event) => update("state", event.target.value)} />
        <Input label={en.parties.address} value={value.address} onChange={(event) => update("address", event.target.value)} containerClassName="md:col-span-2" />
        <Input label={en.parties.openingBalance} type="number" value={value.openingBalance} onChange={(event) => update("openingBalance", event.target.value)} />
        <Input label={en.parties.notes} value={value.notes} onChange={(event) => update("notes", event.target.value)} />
      </div>
    </Modal>
  )
}
