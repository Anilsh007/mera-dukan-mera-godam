"use client"

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  type FormEventHandler,
  type KeyboardEvent,
  type MouseEvent,
  type ReactNode,
} from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"
import { en } from "@/app/messages/en"
import { beginCrudBusy, endCrudBusy } from "@/app/lib/crudBusy"

type ModalSize = "sm" | "md" | "lg" | "xl" | "full"
type ModalVariant = "default" | "form" | "confirmation" | "detail" | "warning"
type ModalActionVariant = "primary" | "success" | "danger" | "warning" | "outline" | "ghost"

type ModalProps = {
  open?: boolean
  as?: "div" | "form"
  onSubmit?: FormEventHandler<HTMLFormElement>
  title: ReactNode
  titleIcon?: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  onClose: () => void
  size?: ModalSize
  variant?: ModalVariant
  loading?: boolean
  closeOnOutsideClick?: boolean
  closeOnEscape?: boolean
  showCloseButton?: boolean
  cancelLabel?: string | null
  primaryLabel?: string
  primaryLoadingLabel?: string
  primaryVariant?: ModalActionVariant
  primaryDisabled?: boolean
  onPrimary?: () => void | Promise<void>
}

type ConfirmationModalProps = Omit<ModalProps, "variant" | "children"> & {
  confirmMessage?: ReactNode
}

const sizeClassName: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-2xl",
  xl: "max-w-5xl",
  full: "max-w-[min(96vw,72rem)]",
}

const variantClassName: Record<ModalVariant, string> = {
  default: "border-[var(--border-card)]",
  form: "border-[var(--border-card)]",
  confirmation: "border-amber-300/70 dark:border-amber-400/30",
  detail: "border-[var(--border-card)]",
  warning: "border-amber-300/70 dark:border-amber-400/30",
}

const actionClassName: Record<ModalActionVariant, string> = {
  primary: "border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-foreground)] hover:brightness-95 focus-visible:ring-[var(--focus-ring)]",
  success: "border-emerald-600 bg-emerald-600 text-white hover:brightness-95 focus-visible:ring-emerald-600",
  danger: "border-rose-600 bg-rose-600 text-white hover:brightness-95 focus-visible:ring-rose-600",
  warning: "border-amber-500 bg-amber-500 text-white hover:brightness-95 focus-visible:ring-amber-500",
  outline: "border-[var(--border-card)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] focus-visible:ring-[var(--focus-ring)]",
  ghost: "border-transparent bg-transparent text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] focus-visible:ring-[var(--focus-ring)]",
}

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "textarea:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

export default function Modal({
  open = true,
  as = "div",
  onSubmit,
  title,
  titleIcon,
  description,
  children,
  footer,
  onClose,
  size = "md",
  variant = as === "form" ? "form" : "default",
  loading = false,
  closeOnOutsideClick = true,
  closeOnEscape = true,
  showCloseButton = true,
  cancelLabel = en.common.cancel,
  primaryLabel,
  primaryLoadingLabel = en.common.processing,
  primaryVariant = "primary",
  primaryDisabled = false,
  onPrimary,
}: ModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  const dialogRef = useRef<HTMLDivElement | HTMLFormElement | null>(null)
  const previouslyFocusedElement = useRef<HTMLElement | null>(null)

  const canClose = !loading
  const visiblePrimaryLabel = loading && primaryLabel ? primaryLoadingLabel : primaryLabel
  const shellClassName = useMemo(
    () => [
      "relative flex max-h-[calc(100dvh-1.5rem)] w-full flex-col overflow-hidden rounded-[24px] border bg-[var(--surface-primary)] shadow-2xl outline-none transition-all sm:max-h-[calc(100dvh-3rem)] sm:rounded-[28px]",
      sizeClassName[size],
      variantClassName[variant],
    ].join(" "),
    [size, variant],
  )

  useEffect(() => {
    if (!open || typeof document === "undefined") return

    previouslyFocusedElement.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const frame = window.requestAnimationFrame(() => {
      const dialog = dialogRef.current
      if (!dialog) return
      const firstFocusable = dialog.querySelector<HTMLElement>(focusableSelector)
      ;(firstFocusable || dialog).focus({ preventScroll: true })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      document.body.style.overflow = previousOverflow
      previouslyFocusedElement.current?.focus?.({ preventScroll: true })
    }
  }, [open])

  useEffect(() => {
    if (!loading) return
    beginCrudBusy(typeof title === "string" ? title : en.common.processing)
    return () => {
      endCrudBusy()
    }
  }, [loading, title])

  if (!open || typeof document === "undefined") return null

  const handleOverlayClick = () => {
    if (!closeOnOutsideClick || !canClose) return
    onClose()
  }

  const handleShellClick = (event: MouseEvent) => {
    event.stopPropagation()
  }

  const setDialogRef = (node: HTMLDivElement | HTMLFormElement | null) => {
    dialogRef.current = node
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Escape" && closeOnEscape && canClose) {
      event.preventDefault()
      onClose()
      return
    }

    if (event.key !== "Tab") return

    const dialog = dialogRef.current
    if (!dialog) return
    const focusableElements = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
      (element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true",
    )

    if (!focusableElements.length) {
      event.preventDefault()
      dialog.focus()
      return
    }

    const first = focusableElements[0]
    const last = focusableElements[focusableElements.length - 1]
    const active = document.activeElement

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const header = (
    <div className="flex items-start justify-between gap-4 border-b border-[var(--border-card)] px-4 py-4 sm:px-6">
      <div className="min-w-0">
        <div className="flex min-w-0 items-center gap-2">
          {titleIcon ? (
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-secondary)] text-[var(--accent)]">
              {titleIcon}
            </span>
          ) : null}
          <h2 id={titleId} className="min-w-0 text-lg font-semibold text-[var(--text-primary)] sm:text-xl">
            {title}
          </h2>
        </div>
        {description ? (
          <p id={descriptionId} className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
            {description}
          </p>
        ) : null}
      </div>
      {showCloseButton ? (
        <button
          type="button"
          aria-label={en.modals.close}
          title={en.modals.close}
          onClick={onClose}
          disabled={!canClose}
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-card)] bg-[var(--surface-secondary)] text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X size={18} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  )

  const defaultFooter = primaryLabel || cancelLabel ? (
    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
      {cancelLabel ? (
        <button
          type="button"
          onClick={onClose}
          disabled={!canClose}
          className={`${actionClassName.outline} inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {cancelLabel}
        </button>
      ) : null}
      {primaryLabel ? (
        <button
          type={as === "form" && !onPrimary ? "submit" : "button"}
          onClick={onPrimary}
          disabled={primaryDisabled || loading}
          className={`${actionClassName[primaryVariant]} inline-flex min-h-11 items-center justify-center rounded-2xl border px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60`}
        >
          {visiblePrimaryLabel}
        </button>
      ) : null}
    </div>
  ) : null

  const shellProps = {
    role: "dialog",
    "aria-modal": true,
    "aria-labelledby": titleId,
    "aria-describedby": description ? descriptionId : undefined,
    tabIndex: -1,
    className: shellClassName,
    onClick: handleShellClick,
    onKeyDown: handleKeyDown,
  }

  const content = (
    <div
      className="fixed inset-0 z-[100] flex min-h-[100dvh] items-center justify-center bg-black/55 p-3 backdrop-blur-sm sm:p-6"
      onClick={handleOverlayClick}
    >
      {as === "form" ? (
        <form {...shellProps} ref={setDialogRef} onSubmit={onSubmit}>
          {header}
          {children ? <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div> : null}
          {footer || defaultFooter ? (
            <div className="border-t border-[var(--border-card)] bg-[var(--surface-secondary)] px-4 py-4 sm:px-6">
              {footer || defaultFooter}
            </div>
          ) : null}
        </form>
      ) : (
        <div {...shellProps} ref={setDialogRef}>
          {header}
          {children ? <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6">{children}</div> : null}
          {footer || defaultFooter ? (
            <div className="border-t border-[var(--border-card)] bg-[var(--surface-secondary)] px-4 py-4 sm:px-6">
              {footer || defaultFooter}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )

  return createPortal(content, document.body)
}

export function ConfirmationModal({ confirmMessage, ...props }: ConfirmationModalProps) {
  return (
    <Modal {...props} variant={props.primaryVariant === "danger" ? "warning" : "confirmation"}>
      {confirmMessage ? (
        <div className="rounded-2xl border border-amber-300/70 bg-amber-50 p-3 text-sm leading-6 text-amber-900 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100">
          {confirmMessage}
        </div>
      ) : null}
    </Modal>
  )
}
