"use client"

import { Crown, Lock } from "lucide-react"
import { useRouter } from "next/navigation"
import Modal from "@/app/components/ui/Modal"
import { en } from "@/app/messages/en"

type SubscriptionRequiredModalProps = {
  open: boolean
  onClose: () => void
  title?: string
  description?: string
}

export default function SubscriptionRequiredModal({
  open,
  onClose,
  title = en.subscription.subscriptionRequired,
  description = en.subscription.premiumActionRequiresUpgrade,
}: SubscriptionRequiredModalProps) {
  const router = useRouter()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      titleIcon={<Lock size={18} aria-hidden="true" />}
      primaryLabel={en.subscription.upgradeNow}
      onPrimary={() => {
        onClose()
        router.push("/pricing")
      }}
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4">
          <div className="flex items-start gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">
              <Crown size={18} aria-hidden="true" />
            </span>
            <div>
              <p className="font-semibold text-[var(--text-primary)]">{en.subscription.keepDataSafeTitle}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{en.subscription.keepDataSafeDescription}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
