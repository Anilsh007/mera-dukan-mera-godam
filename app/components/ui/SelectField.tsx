"use client"

import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from "react"

type SelectOption = { value: string; label: ReactNode }

interface SelectFieldProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode
  options?: SelectOption[]
  containerClassName?: string
  helperText?: ReactNode
  error?: ReactNode
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
  ...props
}, ref) {
  const generatedId = useId()
  const selectId = id || generatedId
  const helpId = helperText ? `${selectId}-help` : undefined
  const errorId = error ? `${selectId}-error` : undefined
  const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined

  return (
    <div className={`min-w-0 ${containerClassName}`}>
      {label && (
        <label htmlFor={selectId} className="mb-1 block text-sm font-semibold text-[var(--text-primary)]">
          {label}
        </label>
      )}
      <select
        id={selectId}
        ref={ref}
        aria-invalid={Boolean(error) || undefined}
        aria-describedby={describedBy}
        {...props}
        className={`min-h-11 w-full rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] px-3 py-2 text-[var(--text-primary)] shadow-[var(--button-shadow)] outline-none transition-all disabled:cursor-not-allowed disabled:bg-[var(--button-disabled-bg)] disabled:text-[var(--text-primary)] disabled:opacity-100 focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--focus-ring)] ${error ? "border-red-400 focus:ring-red-300" : ""} ${className}`}
      >
        {options ? options.map((option) => <option key={String(option.value)} value={option.value}>{option.label}</option>) : children}
      </select>
      {helperText && !error && <p id={helpId} className="mt-1 text-xs text-[var(--text-muted)]">{helperText}</p>}
      {error && <p id={errorId} className="mt-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
})

SelectField.displayName = "SelectField"

export default SelectField
