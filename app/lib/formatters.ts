export function formatCurrency(value: number | string | null | undefined) {
  return `Rs ${Number(value || 0).toLocaleString("en-IN")}`
}

export function formatDateTime(value: string | number | Date) {
  return new Date(value).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}
