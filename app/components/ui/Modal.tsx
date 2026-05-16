"use client"

import { useCallback, useEffect, useId, useRef, type FormEvent, type ReactNode } from "react"
import { AlertCircle, X } from "lucide-react"
import Button from "@/app/components/ui/Button"
import { en } from "@/app/messages/en"

type ModalSize = "sm" | "md" | "lg" | "xl" | "full"

type ModalProps = {
  open?: boolean
  title: ReactNode
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
  onClose: () => void
  onSubmit?: (event: FormEvent<HTMLFormElement>) => void
  as?: "div" | "form"
  size?: ModalSize
  primaryLabel?: ReactNode
  cancelLabel?: ReactNode
  onPrimary?: () => void
  primaryType?: "button" | "submit"
  primaryVariant?: "primary" | "secondary" | "danger" | "warning" | "success"
  primaryDisabled?: boolean
  loading?: boolean
  error?: ReactNode
  showCloseButton?: boolean
  closeOnEsc?: boolean
  closeOnOutsideClick?: boolean
  preventCloseWhileLoading?: boolean
  className?: string
  bodyClassName?: string
  footerClassName?: string
  titleIcon?: ReactNode
}

const sizeClass: Record<ModalSize, string> = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-5xl",
  full: "sm:max-w-[min(1120px,calc(100vw-2rem))]",
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
  title,
  description,
  children,
  footer,
  onClose,
  onSubmit,
  as = "div",
  size = "md",
  primaryLabel,
  cancelLabel = en.common.cancel,
  onPrimary,
  primaryType = "button",
  primaryVariant = "primary",
  primaryDisabled,
  loading = false,
  error,
  showCloseButton = true,
  closeOnEsc = true,
  closeOnOutsideClick = true,
  preventCloseWhileLoading = true,
  className = "",
  bodyClassName = "",
  footerClassName = "",
  titleIcon,
}: ModalProps) {
  const dialogRef = useRef<HTMLElement | null>(null)
  const setDialogRef = (element: HTMLDivElement | HTMLFormElement | null) => {
    dialogRef.current = element
  }
  const titleId = useId()
  const descriptionId = useId()
  const errorId = useId()

  const canClose = !loading || !preventCloseWhileLoading

  const requestClose = useCallback(() => {
    if (canClose) onClose()
  }, [canClose, onClose])

  useEffect(() => {
    if (!open) return

    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    const focusFirst = window.setTimeout(() => {
      const dialog = dialogRef.current
      if (!dialog) return
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute("disabled") && element.tabIndex !== -1
      )
      ;(focusable[0] || dialog).focus()
    }, 0)

    const handleKeyDown = (event: KeyboardEvent) => {
      const dialog = dialogRef.current
      if (!dialog) return

      if (event.key === "Escape" && closeOnEsc) {
        event.stopPropagation()
        requestClose()
        return
      }

      if (event.key !== "Tab") return

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute("disabled") && element.tabIndex !== -1
      )

      if (!focusable.length) {
        event.preventDefault()
        dialog.focus()
        return
      }

      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement

      if (event.shiftKey && active === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && active === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    return () => {
      window.clearTimeout(focusFirst)
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
      previousActive?.focus()
    }
  }, [open, closeOnEsc, requestClose])

  if (!open) return null

  const dialogProps = {
    role: "dialog",
    "aria-modal": true,
    "aria-labelledby": titleId,
    "aria-describedby": description ? descriptionId : undefined,
    "aria-busy": loading || undefined,
    tabIndex: -1,
    className: [
      "premium-surface flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-3xl outline-none sm:max-h-[92vh] sm:rounded-2xl",
      sizeClass[size],
      className,
    ].join(" "),
  }

  const content = (
    <>
      <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[var(--border-card)] p-4 sm:p-5">
        <div className="min-w-0">
          <div className="flex items-start gap-3">
            {titleIcon && <span className="mt-0.5 shrink-0 text-[var(--accent)]">{titleIcon}</span>}
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-bold leading-tight text-[var(--text-primary)] sm:text-xl">
                {title}
              </h2>
              {description && (
                <p id={descriptionId} className="mt-1 text-xs leading-5 text-[var(--text-secondary)] sm:text-sm">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>

        {showCloseButton && (
          <Button
            type="button"
            variant="ghost"
            ariaLabel={en.common.close}
            icon={<X size={18} />}
            onClick={requestClose}
            disabled={!canClose}
            className="min-h-9 shrink-0 rounded-full px-2 py-2 sm:px-2"
          />
        )}
      </div>

      {error && (
        <div id={errorId} className="mx-4 mt-4 flex gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300 sm:mx-5" role="alert">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className={`min-h-0 flex-1 overscroll-contain overflow-y-auto p-4 sm:p-5 ${bodyClassName}`}>{children}</div>

      {(footer || primaryLabel) && (
        <div className={`shrink-0 border-t border-[var(--border-card)] bg-[var(--bg-card-strong)] p-4 sm:p-5 ${footerClassName}`}>
          {footer || (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" title={cancelLabel} onClick={requestClose} disabled={!canClose} className="w-full sm:w-auto" />
              <Button
                type={primaryType}
                variant={primaryVariant}
                title={primaryLabel}
                loading={loading}
                disabled={primaryDisabled || loading}
                onClick={primaryType === "button" ? onPrimary : undefined}
                className="w-full sm:w-auto"
              />
            </div>
          )}
        </div>
      )}
    </>
  )

  return (
    <div
      className="fixed inset-0 z-[100] flex min-h-dvh items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (closeOnOutsideClick && event.target === event.currentTarget) requestClose()
      }}
    >
      {as === "form" ? (
        <form ref={setDialogRef} {...dialogProps} onSubmit={onSubmit}>{content}</form>
      ) : (
        <div ref={setDialogRef} {...dialogProps}>{content}</div>
      )}
    </div>
  )
}
