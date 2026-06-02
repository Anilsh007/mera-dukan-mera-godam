"use client"

import { ChevronDown, ChevronUp } from "lucide-react"
import {
  forwardRef,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type SelectHTMLAttributes,
} from "react"
import { createPortal } from "react-dom"
import { en } from "@/app/messages/en"

type SelectOption = { value: string; label: ReactNode }

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  options?: SelectOption[]
  containerClassName?: string
  helperText?: ReactNode
  error?: ReactNode
  placeholder?: ReactNode
}

const SelectField = forwardRef<HTMLSelectElement, SelectFieldProps>(function SelectField({
  label,
  options,
  children,
  containerClassName = "",
  className = "",
  id,
  helperText,
  error,
  placeholder,
  ...props
}, ref) {
  const generatedId = useId()
  const selectId = id || generatedId
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const hiddenSelectRef = useRef<HTMLSelectElement | null>(null)
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<CSSProperties | null>(null)
  const helpId = helperText ? `${selectId}-help` : undefined
  const errorId = error ? `${selectId}-error` : undefined
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined
  const resolvedPlaceholder = placeholder ?? en.common.select
  const selectedOption = useMemo(
    () => options?.find((option) => option.value === props.value),
    [options, props.value],
  )
  const displayLabel = props.value ? selectedOption?.label || props.value : resolvedPlaceholder

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (!rootRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setOpen(false)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false)
    }

    document.addEventListener("pointerdown", handlePointerDown)
    document.addEventListener("keydown", handleKeyDown)

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown)
      document.removeEventListener("keydown", handleKeyDown)
    }
  }, [open])

  useEffect(() => {
    if (props.disabled) setOpen(false)
  }, [props.disabled])

  const updateMenuPosition = () => {
    const button = buttonRef.current
    if (!button) return

    const rect = button.getBoundingClientRect()
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const gap = 8
    const sidePadding = 12
    const availableBelow = viewportHeight - rect.bottom - sidePadding
    const availableAbove = rect.top - sidePadding
    const openUpward = availableBelow < 220 && availableAbove > availableBelow

    const width = rect.width
    const maxHeight = Math.max(140, openUpward ? availableAbove - gap : availableBelow - gap)
    const left = Math.min(Math.max(rect.left, sidePadding), Math.max(sidePadding, viewportWidth - width - sidePadding))

    setMenuStyle({
      position: "fixed",
      left,
      width,
      maxHeight,
      top: openUpward ? rect.top - gap : rect.bottom + gap,
      transform: openUpward ? "translateY(-100%)" : "translateY(0)",
    })
  }

  useLayoutEffect(() => {
    if (!open) {
      setMenuStyle(null)
      return
    }

    updateMenuPosition()

    const handleViewportChange = () => updateMenuPosition()
    window.addEventListener("resize", handleViewportChange)
    window.addEventListener("scroll", handleViewportChange, true)

    const resizeTarget = buttonRef.current
    const resizeObserver = typeof ResizeObserver !== "undefined" && resizeTarget ? new ResizeObserver(handleViewportChange) : null
    if (resizeObserver && resizeTarget) {
      resizeObserver.observe(resizeTarget)
    }

    return () => {
      window.removeEventListener("resize", handleViewportChange)
      window.removeEventListener("scroll", handleViewportChange, true)
      resizeObserver?.disconnect()
    }
  }, [open])

  const dispatchNativeChange = (nextValue: string) => {
    const hiddenSelect = hiddenSelectRef.current
    if (!hiddenSelect) return

    hiddenSelect.value = nextValue
    hiddenSelect.dispatchEvent(new Event("change", { bubbles: true }))
  }

  const handlePick = (nextValue: string) => {
    if (props.disabled) return
    dispatchNativeChange(nextValue)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={`min-w-0 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <div ref={rootRef} className="min-w-0">
        <button
          ref={buttonRef}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${selectId}-listbox`}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          disabled={props.disabled}
          onClick={() => setOpen((current) => !current)}
          className={`flex min-h-11 w-full items-center justify-between gap-3 rounded-xl border border-[var(--border-input)] bg-[var(--bg-card-strong)] px-3 py-2 text-left text-[var(--text-primary)] shadow-[var(--button-shadow)] outline-none transition-all disabled:cursor-not-allowed disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--text-primary)] disabled:opacity-100 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus-ring)] ${error ? "border-red-400 focus:ring-red-300" : ""} ${className}`}
        >
          <span className={`min-w-0 flex-1 truncate ${!props.value ? "text-[var(--text-muted)]" : ""}`}>
            {displayLabel}
          </span>
          <span className="flex-shrink-0 text-[var(--text-muted)]">
            {open ? <ChevronUp size={16} aria-hidden="true" /> : <ChevronDown size={16} aria-hidden="true" />}
          </span>
        </button>

        <select
          id={selectId}
          ref={(node) => {
            hiddenSelectRef.current = node
            if (typeof ref === "function") {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          aria-hidden="true"
          tabIndex={-1}
          value={props.value}
          onChange={props.onChange}
          disabled={props.disabled}
          required={props.required}
          name={props.name}
          className="sr-only"
        >
          <option value="" disabled>{resolvedPlaceholder}</option>
          {options
             ? options.filter((option) => option.value !== "").map((option) => (
                 <option key={String(option.value)} value={option.value}>
                   {option.label}
                 </option>
               ))
            : children}
        </select>
      </div>
      {open && typeof document !== "undefined" && menuStyle
        ? createPortal(
            <div
              id={`${selectId}-listbox`}
              ref={menuRef}
              role="listbox"
              className="z-[9999] overflow-auto rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-1 shadow-[0_24px_80px_rgba(0,0,0,0.18)] backdrop-blur-xl"
              style={menuStyle}
            >
              <button
                type="button"
                role="option"
                aria-selected={!props.value}
                aria-disabled="true"
                disabled
                onClick={() => handlePick("")}
                className="flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm text-[var(--text-muted)] opacity-60 transition"
              >
                {resolvedPlaceholder}
              </button>
              {options?.filter((option) => option.value !== "").map((option) => {
                const isSelected = option.value === props.value
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handlePick(option.value)}
                    className={`flex w-full items-center rounded-xl px-3 py-2.5 text-left text-sm transition ${
                      isSelected
                        ? "bg-[var(--selected-row)] font-semibold text-[var(--text-primary)]"
                        : "text-[var(--text-primary)] hover:bg-[var(--accent-soft)]"
                    }`}
                  >
                    <span className="min-w-0 flex-1 truncate">{option.label}</span>
                  </button>
                )
              })}
              {!options && children}
            </div>,
            document.body,
          )
        : null}
      {helperText && !error && <p id={helpId} className="mt-1 text-xs text-[var(--text-muted)]">{helperText}</p>}
      {error && <p id={errorId} className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
})

SelectField.displayName = "SelectField"

export default SelectField
