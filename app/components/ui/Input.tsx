"use client"

import { useId, type ReactNode } from "react"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: ReactNode
    containerClassName?: string
    datalist?: string
    leftAddon?: ReactNode
    rightAddon?: ReactNode
    helperText?: ReactNode
    error?: ReactNode
}

export default function Input({
    label,
    containerClassName,
    className = "",
    id,
    datalist,
    leftAddon,
    rightAddon,
    helperText,
    error,
    ...props
}: InputProps) {
    const generatedId = useId()
    const inputId = id || generatedId
    const helpId = helperText ? `${inputId}-help` : undefined
    const errorId = error ? `${inputId}-error` : undefined
    const describedBy = [helpId, errorId].filter(Boolean).join(" ") || undefined
    const inputClass = [
        "min-h-11 w-full min-w-0 bg-[var(--bg-input)] p-2 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none backdrop-blur-xl transition-all sm:text-sm",
        leftAddon || rightAddon ? "border-0" : "rounded-xl border border-[var(--border-input)] shadow-[var(--button-shadow)] focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent)]",
        error && !(leftAddon || rightAddon) ? "border-red-400 focus:ring-red-300" : "",
        className,
    ].join(" ")

    const input = (
        <input
            id={inputId}
            list={datalist}
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={describedBy}
            {...props}
            className={inputClass}
        />
    )

    return (
        <div className={`min-w-0 ${containerClassName || ""}`}>
            {label && (
                <label htmlFor={inputId} className="mb-1 block text-sm font-semibold text-[var(--text-primary)]" >
                    {label}
                </label>
            )}

            {leftAddon || rightAddon ? (
                <div className={`flex min-h-11 min-w-0 overflow-hidden rounded-xl border bg-[var(--bg-input)] shadow-[var(--button-shadow)] backdrop-blur-xl transition-all focus-within:ring-2 ${error ? "border-red-400 focus-within:ring-red-300" : "border-[var(--border-input)] focus-within:border-[var(--accent)] focus-within:ring-[var(--focus-ring)]"}`}>
                    {leftAddon && (
                        <span className="flex items-center border-r border-[var(--border-input)] px-3 text-sm font-semibold text-[var(--text-secondary)]">
                            {leftAddon}
                        </span>
                    )}
                    {input}
                    {rightAddon && (
                        <span className="flex items-center border-l border-[var(--border-input)] px-3 text-sm font-semibold text-[var(--text-secondary)]">
                            {rightAddon}
                        </span>
                    )}
                </div>
            ) : input}

            {helperText && !error && (
                <p id={helpId} className="mt-1 text-xs text-[var(--text-muted)]">{helperText}</p>
            )}
            {error && (
                <p id={errorId} className="mt-1 text-xs font-medium text-red-500">{error}</p>
            )}
        </div>
    )
}
