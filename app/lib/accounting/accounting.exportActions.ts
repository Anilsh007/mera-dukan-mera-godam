"use client"

import { exportAccountingCsv, exportAccountingExcel, printAccountingRows, type AccountingExportRow } from "@/app/lib/accounting/accounting.export"
import { auth } from "@/app/lib/firebase"
import { notify as toast } from "@/app/lib/notifications"
import { assertFeatureAccess, incrementUsage } from "@/app/lib/subscription/subscription.service"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { en } from "@/app/messages/en"

export type AccountingExportKind = "csv" | "excel" | "print"

export async function runAccountingExport({
  kind,
  rows,
  filenamePrefix,
  title,
  errorLabel,
}: {
  kind: AccountingExportKind
  rows: AccountingExportRow[]
  filenamePrefix: string
  title: string
  errorLabel: string
}) {
  try {
    const userId = requireUserIdentityFromAuthUser(auth?.currentUser)
    await assertFeatureAccess(userId, "exports", { operation: "export", scope: "premium", incrementBy: 1 })

    if (kind === "csv") exportAccountingCsv(rows, filenamePrefix)
    if (kind === "excel") exportAccountingExcel(rows, filenamePrefix)
    if (kind === "print" && !printAccountingRows(rows, title)) {
      toast.error(en.print.popupBlocked)
      return
    }

    await incrementUsage(userId, "exports")
    toast.success(kind === "print" ? en.print.printStarted : en.notifications.exportCompleted)
  } catch (error) {
    console.error(errorLabel, error)
    toast.error(error instanceof Error ? error.message : en.share.downloadFailed)
  }
}
