"use client"

import React, { useRef } from "react"
import { en } from "@/app/messages/en"

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
            "border border-teal-400/70 bg-gradient-to-br from-teal-500 via-emerald-500 to-cyan-500 text-white shadow-lg shadow-teal-500/20 hover:border-teal-200 hover:from-teal-400 hover:via-emerald-400 hover:to-cyan-400 hover:shadow-teal-500/40 dark:border-teal-300/30 dark:text-white",

        secondary:
            "border border-blue-400/70 bg-gradient-to-br from-blue-500 via-sky-500 to-indigo-500 text-white shadow-lg shadow-blue-500/20 hover:border-blue-200 hover:from-blue-400 hover:via-sky-400 hover:to-indigo-400 hover:shadow-blue-500/40 dark:border-sky-300/30 dark:text-white",

        danger:
            "border border-rose-400/70 bg-gradient-to-br from-rose-500 via-pink-500 to-red-500 text-white shadow-lg shadow-rose-500/20 hover:border-rose-200 hover:from-rose-400 hover:via-pink-400 hover:to-red-400 hover:shadow-rose-500/40 dark:border-rose-300/30",

        warning:
            "border border-amber-300/80 bg-gradient-to-br from-amber-400 via-orange-400 to-yellow-300 text-slate-900 shadow-lg shadow-amber-500/20 hover:border-amber-100 hover:from-amber-300 hover:via-orange-300 hover:to-yellow-200 hover:shadow-amber-500/40 dark:border-amber-300/30 dark:text-slate-900",

        success:
            "border border-emerald-400/70 bg-gradient-to-br from-emerald-500 via-green-500 to-lime-500 text-white shadow-lg shadow-emerald-500/20 hover:border-emerald-200 hover:from-emerald-400 hover:via-green-400 hover:to-lime-400 hover:shadow-emerald-500/40 dark:border-emerald-300/30",

        black:
            "border border-slate-700 bg-gradient-to-br from-slate-800 via-slate-900 to-black text-white shadow-lg shadow-slate-900/30 hover:border-slate-500 hover:from-slate-700 hover:to-slate-950 hover:shadow-slate-900/50 dark:border-slate-500",

        ghost:
            "border border-transparent bg-white/5 text-[var(--text-primary)] backdrop-blur-md hover:border-white/10 hover:bg-white/10 dark:bg-white/[0.03] dark:hover:bg-white/[0.06]",

        outline:
            "border border-slate-300 bg-white text-slate-700 shadow-sm hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 hover:shadow-md dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-teal-400 dark:hover:bg-teal-500/10 dark:hover:text-teal-300",

        dotBorder:
            "border-2 border-dashed border-slate-400 bg-white text-slate-600 hover:border-teal-400 hover:bg-teal-50 hover:text-teal-700 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-teal-400 dark:hover:bg-teal-500/10 dark:hover:text-teal-300",

        delete:
            "border border-transparent bg-transparent text-rose-500 hover:border-rose-200 hover:bg-rose-50 hover:text-red-600 dark:text-rose-300 dark:hover:border-rose-500/20 dark:hover:bg-rose-500/10 dark:hover:text-rose-100 rounded-2xl",

        menu:
            "lg:hidden border border-transparent bg-transparent text-[var(--text-primary)] hover:border-slate-300 hover:bg-slate-100 dark:hover:border-slate-700 dark:hover:bg-slate-800",

        login:
            "border border-fuchsia-400/60 bg-gradient-to-br from-fuchsia-500 via-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/20 hover:border-fuchsia-200 hover:from-fuchsia-400 hover:via-pink-400 hover:to-rose-400 hover:shadow-pink-500/40",

        "soft-primary":
            "border border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-400 hover:bg-emerald-100 dark:border-emerald-400/20 dark:bg-emerald-500/10 dark:text-emerald-200 dark:hover:bg-emerald-500/20",

        "soft-danger":
            "border border-rose-300 bg-rose-50 text-rose-700 hover:border-rose-400 hover:bg-rose-100 dark:border-rose-400/20 dark:bg-rose-500/10 dark:text-rose-200 dark:hover:bg-rose-500/20",

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
                "backdrop-blur-md",
                "transition-all duration-300 ease-out",
                "select-none motion-reduce:transform-none",
                "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-400/60",
                variants[variant] ?? variants.primary,

                isDisabled
                    ? "cursor-not-allowed opacity-50 pointer-events-none"
                    : "cursor-pointer active:scale-[0.97] hover:-translate-y-0.5",

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