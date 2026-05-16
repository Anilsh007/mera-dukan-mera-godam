export function escapePrintHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function openPrintWindow(html: string) {
  if (typeof window === "undefined") return false

  const printWindow = window.open("", "_blank", "width=900,height=700")
  if (!printWindow) return false

  printWindow.document.open()
  printWindow.document.write(html)
  printWindow.document.close()
  printWindow.focus()
  return true
}

export function printCurrentPage() {
  if (typeof window === "undefined") return false

  try {
    window.print()
    return true
  } catch {
    return false
  }
}
