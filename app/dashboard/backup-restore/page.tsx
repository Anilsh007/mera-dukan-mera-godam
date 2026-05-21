"use client"

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react"
import { AlertTriangle, DatabaseBackup, FileDown, FileUp, RefreshCw, ShieldCheck } from "lucide-react"
import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import Modal from "@/app/components/ui/Modal"
import PageHeader from "@/app/components/ui/PageHeader"
import SurfaceCard from "@/app/components/ui/SurfaceCard"
import StatusBadge from "@/app/components/ui/StatusBadge"
import { auth } from "@/app/lib/firebase"
import { notify } from "@/app/lib/notifications"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { exportFullBackup, exportModuleCsv, importSafeRecords, loadBackupCounts, previewFullBackupText, previewSafeImportText, restoreFullBackup, type BackupCollectionCounts, type BackupPreview, type ExportModuleKey, type SafeImportKind, type SafeImportPreview } from "@/app/lib/backupRestore/backupRestore.service"
import { en } from "@/app/messages/en"

const exportModules: ExportModuleKey[] = ["inventory", "sales", "purchases", "customers", "suppliers", "expenses", "gstReports"]
const importKinds: SafeImportKind[] = ["products", "customers", "suppliers"]

export default function BackupRestorePage() {
  const [userId, setUserId] = useState("")
  const [counts, setCounts] = useState<BackupCollectionCounts | null>(null)
  const [loadingCounts, setLoadingCounts] = useState(true)
  const [busyAction, setBusyAction] = useState("")
  const [backupPreview, setBackupPreview] = useState<BackupPreview | null>(null)
  const [backupFileName, setBackupFileName] = useState("")
  const [backupConfirmed, setBackupConfirmed] = useState(false)
  const [importKind, setImportKind] = useState<SafeImportKind>("products")
  const [importPreview, setImportPreview] = useState<SafeImportPreview | null>(null)
  const [importFileName, setImportFileName] = useState("")
  const [importConfirmed, setImportConfirmed] = useState(false)
  const [showRestoreModal, setShowRestoreModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  const refreshCounts = useCallback(async (nextUserId: string) => {
    setLoadingCounts(true)
    try {
      setCounts(await loadBackupCounts(nextUserId))
    } catch (error) {
      console.error("Backup counts load failed", error)
      notify.error(en.backupRestore.countsLoadFailed)
    } finally {
      setLoadingCounts(false)
    }
  }, [])

  useEffect(() => {
    if (!auth) {
      setLoadingCounts(false)
      return
    }
    return auth.onAuthStateChanged((user) => {
      const nextUserId = user?.email || ""
      setUserId(nextUserId)
      if (nextUserId) void refreshCounts(nextUserId)
      else setLoadingCounts(false)
    })
  }, [refreshCounts])

  const totalRecords = useMemo(() => Object.values(counts || {}).reduce((sum, value) => sum + value, 0), [counts])

  async function handleFullBackup() {
    const currentUserId = requireUserIdentityFromAuthUser(auth?.currentUser)
    setBusyAction("fullBackup")
    try {
      if (await exportFullBackup(currentUserId)) notify.success(en.backupRestore.backupDownloaded)
      else notify.error(en.backupRestore.backupDownloadFailed)
    } catch (error) {
      console.error("Full backup failed", error)
      notify.error(error instanceof Error ? error.message : en.backupRestore.backupDownloadFailed)
    } finally {
      setBusyAction("")
    }
  }

  async function handleModuleExport(moduleKey: ExportModuleKey) {
    const currentUserId = requireUserIdentityFromAuthUser(auth?.currentUser)
    setBusyAction(`export:${moduleKey}`)
    try {
      if (await exportModuleCsv(currentUserId, moduleKey)) notify.success(en.backupRestore.exportDownloaded)
      else notify.error(en.backupRestore.exportFailed)
    } catch (error) {
      console.error("Module export failed", error)
      notify.error(error instanceof Error ? error.message : en.backupRestore.exportFailed)
    } finally {
      setBusyAction("")
    }
  }

  async function handleBackupFile(file: File | null) {
    setBackupPreview(null)
    setBackupConfirmed(false)
    setBackupFileName(file?.name || "")
    if (!file) return
    const currentUserId = requireUserIdentityFromAuthUser(auth?.currentUser)
    setBusyAction("previewBackup")
    try {
      const preview = await previewFullBackupText(await file.text(), currentUserId)
      setBackupPreview(preview)
      notify[preview.errors.length ? "error" : "success"](preview.errors.length ? en.backupRestore.previewFailed : en.backupRestore.previewReady)
    } catch (error) {
      console.error("Backup preview failed", error)
      notify.error(en.backupRestore.previewFailed)
    } finally {
      setBusyAction("")
    }
  }

  async function handleImportFile(file: File | null) {
    setImportPreview(null)
    setImportConfirmed(false)
    setImportFileName(file?.name || "")
    if (!file) return
    const currentUserId = requireUserIdentityFromAuthUser(auth?.currentUser)
    setBusyAction("previewImport")
    try {
      const preview = await previewSafeImportText(await file.text(), importKind, currentUserId)
      setImportPreview(preview)
      notify[preview.errors.length ? "error" : "success"](preview.errors.length ? en.backupRestore.previewFailed : en.backupRestore.previewReady)
    } catch (error) {
      console.error("Import preview failed", error)
      notify.error(en.backupRestore.previewFailed)
    } finally {
      setBusyAction("")
    }
  }

  async function confirmRestore() {
    const currentUserId = requireUserIdentityFromAuthUser(auth?.currentUser)
    if (!backupPreview?.payload || !backupConfirmed) {
      notify.warning(en.backupRestore.confirmBeforeRestore)
      return
    }
    setBusyAction("restore")
    try {
      const imported = await restoreFullBackup(currentUserId, backupPreview.payload)
      notify.success(en.backupRestore.restoreCompleted.replace("{count}", String(imported)))
      setShowRestoreModal(false)
      setBackupPreview(null)
      setBackupConfirmed(false)
      await refreshCounts(currentUserId)
    } catch (error) {
      console.error("Restore failed", error)
      notify.error(error instanceof Error ? error.message : en.backupRestore.restoreFailed)
    } finally {
      setBusyAction("")
    }
  }

  async function confirmImport() {
    const currentUserId = requireUserIdentityFromAuthUser(auth?.currentUser)
    if (!importPreview || !importConfirmed) {
      notify.warning(en.backupRestore.confirmBeforeImport)
      return
    }
    setBusyAction("import")
    try {
      const imported = await importSafeRecords(currentUserId, importPreview)
      notify.success(en.backupRestore.importCompleted.replace("{count}", String(imported)))
      setShowImportModal(false)
      setImportPreview(null)
      setImportConfirmed(false)
      await refreshCounts(currentUserId)
    } catch (error) {
      console.error("Import failed", error)
      notify.error(error instanceof Error ? error.message : en.backupRestore.importFailed)
    } finally {
      setBusyAction("")
    }
  }

  const canRestore = Boolean(backupPreview?.payload && backupPreview.totalWillImport > 0 && !backupPreview.errors.length)
  const canImport = Boolean(importPreview && importPreview.totalWillImport > 0 && !importPreview.errors.length)

  return (
    <main className="space-y-6">
      <PageHeader eyebrow={en.navigation.settings} title={en.backupRestore.title} description={en.backupRestore.description} actions={<Button type="button" title={en.backupRestore.refreshCounts} icon={<RefreshCw size={16} />} variant="secondary" loading={loadingCounts} onClick={() => userId && void refreshCounts(userId)} />} />

      <SurfaceCard className="border-amber-300/50 bg-amber-50/80 p-4 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
        <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" /><div className="space-y-1 text-sm leading-6"><p className="font-semibold">{en.backupRestore.safetyTitle}</p><p>{en.backupRestore.safetyDescription}</p></div></div>
      </SurfaceCard>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryTile label={en.backupRestore.totalProtectedRecords} value={loadingCounts ? en.common.loading : String(totalRecords)} />
        <SummaryTile label={en.backupRestore.backupFormat} value={en.backupRestore.jsonBackup} />
        <SummaryTile label={en.backupRestore.importMode} value={en.backupRestore.skipDuplicatesMode} />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="space-y-4 p-4">
          <SectionHeading icon={<DatabaseBackup size={18} />} title={en.backupRestore.fullBackupTitle} description={en.backupRestore.fullBackupDescription} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {counts && Object.entries(counts).slice(0, 8).map(([key, value]) => <div key={key} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-subtle)] p-3"><p className="text-xs text-[var(--text-muted)]">{en.backupRestore.collectionLabels[key as keyof typeof en.backupRestore.collectionLabels]}</p><p className="mt-1 text-lg font-bold text-[var(--text-primary)]">{value}</p></div>)}
          </div>
          <Button type="button" title={en.backupRestore.downloadFullBackup} icon={<FileDown size={16} />} loading={busyAction === "fullBackup"} onClick={handleFullBackup} />
        </SurfaceCard>

        <SurfaceCard className="space-y-4 p-4">
          <SectionHeading icon={<FileDown size={18} />} title={en.backupRestore.moduleExportsTitle} description={en.backupRestore.moduleExportsDescription} />
          <div className="grid gap-2 sm:grid-cols-2">
            {exportModules.map((moduleKey) => <Button key={moduleKey} type="button" variant="outline" title={en.backupRestore.exportModuleLabels[moduleKey]} loading={busyAction === `export:${moduleKey}`} onClick={() => void handleModuleExport(moduleKey)} />)}
          </div>
        </SurfaceCard>
      </section>

      <section className="grid gap-5 xl:grid-cols-2">
        <SurfaceCard className="space-y-4 p-4">
          <SectionHeading icon={<ShieldCheck size={18} />} title={en.backupRestore.restoreTitle} description={en.backupRestore.restoreDescription} />
          <Input label={en.backupRestore.chooseBackupFile} type="file" accept="application/json,.json" helperText={backupFileName || en.backupRestore.backupFileHelp} onChange={(event) => void handleBackupFile(event.target.files?.[0] || null)} />
          <PreviewMessages errors={backupPreview?.errors || []} warnings={backupPreview?.warnings || []} />
          {backupPreview ? <BackupPreviewTable preview={backupPreview} /> : null}
          <Button type="button" title={en.backupRestore.reviewAndRestore} icon={<FileUp size={16} />} variant="warning" disabled={!canRestore} onClick={() => setShowRestoreModal(true)} />
        </SurfaceCard>

        <SurfaceCard className="space-y-4 p-4">
          <SectionHeading icon={<FileUp size={18} />} title={en.backupRestore.safeImportTitle} description={en.backupRestore.safeImportDescription} />
          <label className="block text-sm font-semibold text-[var(--text-primary)]">{en.backupRestore.importType}<select value={importKind} onChange={(event) => { setImportKind(event.target.value as SafeImportKind); setImportPreview(null); setImportConfirmed(false) }} className="mt-1 min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-[var(--text-primary)] shadow-[var(--button-shadow)] outline-none focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus-ring)]">{importKinds.map((kind) => <option key={kind} value={kind}>{en.backupRestore.importKindLabels[kind]}</option>)}</select></label>
          <Input label={en.backupRestore.chooseImportFile} type="file" accept=".csv,application/json,.json,text/csv" helperText={importFileName || en.backupRestore.importFileHelp} onChange={(event) => void handleImportFile(event.target.files?.[0] || null)} />
          <PreviewMessages errors={importPreview?.errors || []} warnings={importPreview?.warnings || []} />
          {importPreview ? <ImportPreviewTable preview={importPreview} /> : null}
          <Button type="button" title={en.backupRestore.reviewAndImport} icon={<FileUp size={16} />} variant="warning" disabled={!canImport} onClick={() => setShowImportModal(true)} />
        </SurfaceCard>
      </section>

      <Modal open={showRestoreModal} title={en.backupRestore.restoreConfirmTitle} description={en.backupRestore.restoreConfirmDescription} onClose={() => setShowRestoreModal(false)} primaryLabel={en.backupRestore.confirmRestore} primaryVariant="warning" primaryDisabled={!backupConfirmed || busyAction === "restore"} loading={busyAction === "restore"} onPrimary={() => void confirmRestore()}>
        <ConfirmationCheckbox checked={backupConfirmed} onChange={setBackupConfirmed} label={en.backupRestore.restoreConfirmationLabel} />
      </Modal>

      <Modal open={showImportModal} title={en.backupRestore.importConfirmTitle} description={en.backupRestore.importConfirmDescription} onClose={() => setShowImportModal(false)} primaryLabel={en.backupRestore.confirmImport} primaryVariant="warning" primaryDisabled={!importConfirmed || busyAction === "import"} loading={busyAction === "import"} onPrimary={() => void confirmImport()}>
        <ConfirmationCheckbox checked={importConfirmed} onChange={setImportConfirmed} label={en.backupRestore.importConfirmationLabel} />
      </Modal>
    </main>
  )
}

function SummaryTile({ label, value }: { label: string; value: string }) { return <SurfaceCard className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">{label}</p><p className="mt-2 text-xl font-bold text-[var(--text-primary)]">{value}</p></SurfaceCard> }
function SectionHeading({ icon, title, description }: { icon: ReactNode; title: string; description: string }) { return <div className="flex gap-3"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)] text-[var(--accent)]">{icon}</span><div><h2 className="text-lg font-bold text-[var(--text-primary)]">{title}</h2><p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">{description}</p></div></div> }
function PreviewMessages({ errors, warnings }: { errors: string[]; warnings: string[] }) { if (!errors.length && !warnings.length) return null; return <div className="space-y-2">{errors.map((error) => <p key={error} className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600 dark:text-rose-200">{error}</p>)}{warnings.map((warning) => <p key={warning} className="rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-100">{warning}</p>)}</div> }
function BackupPreviewTable({ preview }: { preview: BackupPreview }) { return <div className="overflow-x-auto rounded-2xl border border-[var(--border-card)]"><table className="min-w-[640px] w-full text-sm"><thead className="bg-[var(--surface-subtle)] text-left text-[var(--text-secondary)]"><tr><th className="p-3">{en.backupRestore.collection}</th><th className="p-3">{en.backupRestore.incoming}</th><th className="p-3">{en.backupRestore.duplicates}</th><th className="p-3">{en.backupRestore.willImport}</th></tr></thead><tbody>{preview.rows.map((row) => <tr key={row.key} className="border-t border-[var(--border-card)]"><td className="p-3 font-medium text-[var(--text-primary)]">{row.label}</td><td className="p-3">{row.incoming}</td><td className="p-3"><StatusBadge tone={row.duplicates ? "warning" : "neutral"}>{row.duplicates}</StatusBadge></td><td className="p-3 font-semibold text-[var(--text-primary)]">{row.willImport}</td></tr>)}</tbody></table></div> }
function ImportPreviewTable({ preview }: { preview: SafeImportPreview }) { return <div className="overflow-x-auto rounded-2xl border border-[var(--border-card)]"><table className="min-w-[560px] w-full text-sm"><thead className="bg-[var(--surface-subtle)] text-left text-[var(--text-secondary)]"><tr><th className="p-3">{en.backupRestore.importType}</th><th className="p-3">{en.backupRestore.incoming}</th><th className="p-3">{en.backupRestore.duplicates}</th><th className="p-3">{en.backupRestore.invalid}</th><th className="p-3">{en.backupRestore.willImport}</th></tr></thead><tbody>{preview.rows.map((row) => <tr key={row.label} className="border-t border-[var(--border-card)]"><td className="p-3 font-medium text-[var(--text-primary)]">{row.label}</td><td className="p-3">{row.incoming}</td><td className="p-3"><StatusBadge tone={row.duplicates ? "warning" : "neutral"}>{row.duplicates}</StatusBadge></td><td className="p-3"><StatusBadge tone={row.invalid ? "danger" : "neutral"}>{row.invalid}</StatusBadge></td><td className="p-3 font-semibold text-[var(--text-primary)]">{row.willImport}</td></tr>)}</tbody></table></div> }
function ConfirmationCheckbox({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <label className="flex items-start gap-3 rounded-2xl border border-amber-300/50 bg-amber-50/70 p-4 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-1 h-4 w-4" /><span>{label}</span></label> }
