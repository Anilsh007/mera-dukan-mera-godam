"use client"

import { useMemo, useState } from "react"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import TransactionActionPanel from "@/app/components/ui/TransactionActionPanel"
import useProfile from "@/app/dashboard/profile/useProfile"
import { buildBusinessDocumentProfile, type TransactionOptionFlags } from "@/app/lib/transactionDocument"
import { createTransactionOptions, runTransactionDocumentActions, ensureValidTransactionOptions } from "@/app/lib/transactionActions"
import { notify as toast } from "@/app/lib/notifications"
import { auth } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { buildPartyStatementDocument } from "@/app/lib/parties/party.documents"
import { recordPartyPayment, type PartyDetailData, type PartyPaymentDirection } from "@/app/lib/parties/party.service"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"

export default function PartyPaymentModal({
  open,
  detail,
  direction,
  onClose,
}: {
  open: boolean
  detail: PartyDetailData | null
  direction: PartyPaymentDirection
  onClose: () => void
}) {
  const { profile } = useProfile()
  const sellerProfile = buildBusinessDocumentProfile(profile)
  const [amount, setAmount] = useState("")
  const [paymentMode, setPaymentMode] = useState("Cash")
  const [reference, setReference] = useState("")
  const [note, setNote] = useState("")
  const [saving, setSaving] = useState(false)
  const [transactionOptions, setTransactionOptions] = useState<TransactionOptionFlags>(createTransactionOptions())

  const maxAmount = useMemo(() => {
    if (!detail) return 0
    return direction === "received" ? detail.party.receivable : detail.party.payable
  }, [detail, direction])

  const nextBalance = Math.max(maxAmount - Number(amount || 0), 0)

  const handleSubmit = async () => {
    if (!detail) return
    if (!ensureValidTransactionOptions(transactionOptions)) return

    try {
      setSaving(true)
      await recordPartyPayment({
        userId: requireUserIdentityFromAuthUser(auth?.currentUser),
        partyId: detail.party.id,
        direction,
        amount: Number(amount || 0),
        paymentMode,
        note,
        reference,
      })

      await runTransactionDocumentActions(
        buildPartyStatementDocument(detail, sellerProfile),
        transactionOptions,
      )
      toast.success(en.parties.paymentSaved)
      onClose()
    } catch (error) {
      console.error("Party payment save failed", error)
      toast.error(error instanceof Error ? error.message : en.parties.paymentSaveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={direction === "received" ? en.parties.paymentDirectionReceived : en.parties.paymentDirectionPaid}
      description={detail?.party.name || en.parties.title}
      primaryLabel={en.parties.recordPayment}
      onPrimary={handleSubmit}
      loading={saving}
      closeOnOutsideClick={!saving}
    >
      <div className="space-y-4">
        <Input label={en.parties.paymentAmount} type="number" min={0} max={maxAmount} value={amount} onChange={(event) => setAmount(event.target.value)} />
        <Input label={en.parties.paymentMode} value={paymentMode} onChange={(event) => setPaymentMode(event.target.value)} />
        <Input label={en.parties.reference} value={reference} onChange={(event) => setReference(event.target.value)} />
        <Input label={en.parties.notes} value={note} onChange={(event) => setNote(event.target.value)} />
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-input)] px-3 py-2 text-sm text-[var(--text-secondary)]">
          {en.parties.afterPaymentBalance}: <strong className="text-[var(--text-primary)]">{formatCurrency(nextBalance)}</strong>
        </div>
        <TransactionActionPanel
          value={transactionOptions}
          onChange={setTransactionOptions}
                    disabled={saving}
        />
      </div>
    </Modal>
  )
}
