"use client"

import { Minus, Plus } from "lucide-react"
import type { ReactNode } from "react"

type QuantityStepperProps = {
  label: ReactNode
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  unitLabel?: ReactNode
  helperText?: ReactNode
  disabled?: boolean
  decreaseLabel: string
  increaseLabel: string
  className?: string
}

export default function QuantityStepper({
  label,
  value,
  onChange,
  min = 1,
  max,
  unitLabel,
  helperText,
  disabled = false,
  decreaseLabel,
  increaseLabel,
  className = "",
}: QuantityStepperProps) {
  const numericValue = Number(value || 0)
  const changeBy = (delta: number) => {
    const base = Number.isFinite(numericValue) && numericValue > 0 ? numericValue : min
    const next = clampQuantity(base + delta, min, max)
    onChange(String(next))
  }

  const handleInputChange = (nextValue: string) => {
    if (nextValue === "") {
      onChange(nextValue)
      return
    }
    const parsed = Number(nextValue)
    if (!Number.isFinite(parsed)) return
    onChange(String(clampQuantity(parsed, min, max)))
  }

  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-semibold text-[var(--text-primary)]">{label}</label>
      <div className="flex min-h-11 overflow-hidden rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] shadow-[var(--button-shadow)] focus-within:ring-2 focus-within:ring-[var(--focus-ring)]">
        <button
          type="button"
          className="flex w-11 shrink-0 items-center justify-center border-r border-[var(--border-input)] text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => changeBy(-1)}
          disabled={disabled || numericValue <= min}
          aria-label={decreaseLabel}
        >
          <Minus size={16} aria-hidden="true" />
        </button>
        <input
          type="number"
          min={min}
          max={max}
          value={value}
          onChange={(event) => handleInputChange(event.target.value)}
          disabled={disabled}
          className="w-full min-w-0 bg-transparent px-3 text-center text-[var(--text-primary)] outline-none disabled:cursor-not-allowed disabled:opacity-60"
          aria-label={typeof label === "string" ? label : undefined}
        />
        {unitLabel ? (
          <span className="flex min-w-12 shrink-0 items-center justify-center border-l border-[var(--border-input)] px-2 text-xs font-semibold text-[var(--text-secondary)]">
            {unitLabel}
          </span>
        ) : null}
        <button
          type="button"
          className="flex w-11 shrink-0 items-center justify-center border-l border-[var(--border-input)] text-[var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => changeBy(1)}
          disabled={disabled || (typeof max === "number" && numericValue >= max)}
          aria-label={increaseLabel}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>
      {helperText ? <p className="mt-1 text-xs text-[var(--text-secondary)]">{helperText}</p> : null}
    </div>
  )
}

function clampQuantity(value: number, min: number, max?: number) {
  const lowerBounded = Math.max(value, min)
  return typeof max === "number" ? Math.min(lowerBounded, max) : lowerBounded
}
