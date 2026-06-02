"use client"

import { useSyncExternalStore } from "react"

type CrudBusyState = {
  count: number
  label: string
}

type Listener = () => void

const listeners = new Set<Listener>()

let busyState: CrudBusyState = {
  count: 0,
  label: "",
}

function emitChange() {
  listeners.forEach((listener) => listener())
}

export function beginCrudBusy(label: string) {
  busyState = {
    count: busyState.count + 1,
    label,
  }
  emitChange()
}

export function endCrudBusy() {
  busyState = {
    count: Math.max(0, busyState.count - 1),
    label: busyState.count > 1 ? busyState.label : "",
  }
  emitChange()
}

function subscribe(listener: Listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return busyState
}

export function useCrudBusyState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot)
}

export async function runWithCrudBusy<T>(label: string, task: () => Promise<T> | T): Promise<T> {
  beginCrudBusy(label)
  try {
    return await task()
  } finally {
    endCrudBusy()
  }
}

export function CrudBusyOverlay() {
  const { count, label } = useCrudBusyState()

  if (!count) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/35 px-4 backdrop-blur-sm">
      <div className="flex max-w-sm flex-col items-center gap-3 rounded-3xl border border-white/10 bg-[var(--bg-card-strong)] px-6 py-5 text-center shadow-2xl">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-[var(--accent)]" />
        <p className="text-base font-semibold text-[var(--text-primary)]">Working…</p>
        <p className="text-sm leading-6 text-[var(--text-secondary)]">{label || "Please wait while the data is saved."}</p>
      </div>
    </div>
  )
}
