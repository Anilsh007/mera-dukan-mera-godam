"use client"

import React, { useEffect, useRef } from "react"
import { en } from "@/app/messages/en"
import { beginCrudBusy, endCrudBusy } from "@/app/lib/crudBusy"

interface ButtonProps {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void
    title?: React.ReactNode
    icon?: React.ReactNode
    className?: string
    type?: "submit" | "reset" | "button"
    variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "warning"
    | "success"
    | "ghost"
    | "outline"
    | "black"
    | "dotBorder"
    | "delete"
    | "menu"
    | "login"
    | "soft-primary"
    | "soft-danger"
    | "soft-warning"
    | "soft-secondary"
    loading?: boolean
    disabled?: boolean
    iconRight?: React.ReactNode
    ripple?: boolean
    ariaLabel?: string
}

export default function Button({
    onClick,
    title,
    icon,
    iconRight,
    className = "",
    type = "button",
    variant = "primary",
    loading = false,
    disabled = false,
    ripple = true,
    ariaLabel,
}: ButtonProps) {

    const btnRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (!loading) return
        beginCrudBusy(typeof title === "string" ? title : en.common.processing)
        return () => {
            endCrudBusy()
        }
    }, [loading, title])

    const handleRipple = (e: React.MouseEvent<HTMLButtonElement>) => {
        if (!ripple || disabled || loading) return

        const btn = btnRef.current
        if (!btn) return

        const circle = document.createElement("span")
        const rect = btn.getBoundingClientRect()
        const size = Math.max(rect.width, rect.height)

        const x = e.clientX - rect.left - size / 2
        const y = e.clientY - rect.top - size / 2

        circle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            border-radius: 9999px;
            background: rgba(255,255,255,0.30);
            transform: scale(0);
            animation: btn-ripple 0.6s linear;
            pointer-events: none;
            z-index: 0;
        `

        btn.appendChild(circle)

        setTimeout(() => {
            circle.remove()
        }, 650)
    }

    const variants: Record<string, string> = {

        primary:
            "border border-[color-mix(in_srgb,var(--accent)_56%,white_10%)] bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary,#8b5cf6))] text-white shadow-[var(--button-shadow)] hover:border-[var(--accent-secondary,#8b5cf6)] hover:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_80%,white_20%),color-mix(in_srgb,var(--accent-secondary,#8b5cf6)_82%,white_18%))] hover:shadow-[var(--button-shadow-hover)]",

        secondary:
            "border border-[var(--border-card)] bg-[linear-gradient(145deg,var(--surface-primary),color-mix(in_srgb,var(--bg-card-strong)_84%,#020611_16%))] text-[var(--text-primary)] shadow-[var(--button-shadow)] hover:border-[var(--accent)] hover:bg-[linear-gradient(145deg,color-mix(in_srgb,var(--surface-primary)_58%,var(--accent-soft)_42%),color-mix(in_srgb,var(--bg-card-strong)_76%,#020611_24%))] hover:shadow-[var(--button-shadow-hover)]",

        danger:
            "border border-rose-400/70 bg-gradient-to-br from-rose-500 via-pink-500 to-red-500 text-white shadow-lg shadow-rose-500/20 hover:border-rose-200 hover:from-rose-400 hover:via-pink-400 hover:to-red-400 hover:shadow-rose-500/40 dark:border-rose-300/30",

        warning:
            "border border-amber-300/80 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-300 text-slate-900 shadow-lg shadow-amber-500/20 hover:border-amber-100 hover:from-amber-300 hover:via-orange-300 hover:to-yellow-200 hover:shadow-amber-500/40 dark:border-amber-300/30 dark:text-slate-900",

        success:
            "border border-emerald-400/70 bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 text-white shadow-lg shadow-emerald-500/20 hover:border-emerald-200 hover:from-emerald-400 hover:via-green-400 hover:to-lime-400 hover:shadow-emerald-500/40 dark:border-emerald-300/30",

        black:
            "border border-[var(--border-card)] bg-[linear-gradient(145deg,rgba(5,17,26,0.95),rgba(3,11,18,0.98))] text-[var(--text-primary)] shadow-[var(--button-shadow)] hover:border-[var(--accent)] hover:shadow-[var(--button-shadow-hover)]",

        ghost:
            "border border-transparent bg-[color-mix(in_srgb,var(--bg-card-strong)_62%,transparent)] text-[var(--text-primary)] backdrop-blur-md hover:border-[var(--border-card)] hover:bg-[var(--surface-subtle)]",

        outline:
            "border border-[var(--border-input)] bg-[color-mix(in_srgb,var(--bg-card-strong)_84%,white_16%)] text-[var(--text-secondary)] shadow-[var(--button-shadow)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)] hover:shadow-[var(--button-shadow-hover)]",

        dotBorder:
            "border-2 border-dashed border-[var(--border-input)] bg-[color-mix(in_srgb,var(--bg-card-strong)_72%,transparent)] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:bg-[var(--accent-soft)] hover:text-[var(--text-primary)]",

        delete:
            "border border-transparent bg-transparent text-rose-500 hover:border-rose-200 hover:bg-rose-50 hover:text-red-600 dark:text-rose-300 dark:hover:border-rose-500/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-100 rounded-2xl",

        menu:
            "lg:hidden border border-transparent bg-transparent text-[var(--text-primary)] hover:border-slate-300 hover:bg-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-800",

        login:
            "border border-[color-mix(in_srgb,var(--accent)_56%,white_10%)] bg-[linear-gradient(135deg,var(--accent),var(--accent-secondary,#8b5cf6))] text-white shadow-[var(--button-shadow)] hover:border-[var(--accent-secondary,#8b5cf6)] hover:shadow-[var(--button-shadow-hover)]",

        "soft-primary":
            "border border-[color-mix(in_srgb,var(--accent)_24%,white_14%)] bg-[color-mix(in_srgb,var(--accent-soft)_88%,white_12%)] text-[var(--accent)] hover:border-[var(--accent)] hover:bg-[color-mix(in_srgb,var(--accent-soft)_96%,white_4%)]",

        "soft-danger":
            "border border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-400 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-600 dark:hover:bg-rose-500/20",

        "soft-warning":
            "border border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-400 hover:bg-amber-100 dark:border-amber-400/20 dark:bg-amber-500/10 dark:text-amber-100 dark:hover:bg-amber-500/20",

        "soft-secondary":
            "border border-sky-300 bg-sky-50 text-sky-700 hover:border-sky-400 hover:bg-sky-100 dark:border-sky-400/20 dark:bg-sky-500/10 dark:text-sky-200 dark:hover:bg-sky-500/20",
    }

    const isDisabled = loading || disabled

    return (
        <button
            ref={btnRef}
            type={type}
            disabled={isDisabled}
            aria-label={ariaLabel}
            aria-busy={loading || undefined}
            onClick={(e) => {
                if (isDisabled) {
                    e.preventDefault()
                    return
                }

                handleRipple(e)
                onClick?.(e)
            }}
            className={[
                "relative inline-flex max-w-full min-w-0 items-center justify-center gap-2 overflow-hidden",
                "min-h-11 rounded-2xl px-4 py-2.5 sm:px-5",
                "font-semibold tracking-wide",
                "backdrop-blur-xl",
                "transition-all duration-300 ease-out",
                "select-none motion-reduce:transform-none",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400/60",
                variants[variant] ?? variants.primary,

                isDisabled
                    ? "cursor-not-allowed border-[var(--button-disabled-border)] bg-[var(--button-disabled-bg)] text-[var(--button-disabled-text)] shadow-none pointer-events-none"
                    : "cursor-pointer hover:-translate-y-0.5 hover:brightness-95 hover:saturate-[0.88] active:translate-y-px active:scale-[0.985] active:brightness-90 active:saturate-[0.82]",

                className,
            ].join(" ")}
        >

            {loading ? (
                <span className="btn-spinner relative z-10" />
            ) : (
                icon && (
                    <span className="relative z-10 flex-shrink-0 text-[18px] leading-none">
                        {icon}
                    </span>
                )
            )}

            {(title || loading) && (
                <span className="relative z-10 min-w-0 text-center leading-tight sm:whitespace-nowrap">
                    {loading ? en.common.processing : title}
                </span>
            )}

            {!loading && iconRight && (
                <span className="relative z-10 flex-shrink-0 text-[18px] leading-none">
                    {iconRight}
                </span>
            )}
        </button>
    )
}
