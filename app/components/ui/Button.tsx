"use client"

import React, { useRef } from "react";
import { en } from "@/app/messages/en"

interface ButtonProps {
    onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
    title?: React.ReactNode;
    icon?: React.ReactNode;
    className?: string;
    type?: "submit" | "reset" | "button";
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
    | "soft-secondary";
    loading?: boolean;
    disabled?: boolean;
    iconRight?: React.ReactNode;
    ripple?: boolean;
    ariaLabel?: string;
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
    ripple = false,
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
            border-radius: 50%;
            background: rgba(255,255,255,0.35);
            transform: scale(0);
            animation: btn-ripple 0.5s linear;
            pointer-events: none;
        `
        btn.style.overflow = "hidden"
        btn.appendChild(circle)
        setTimeout(() => circle.remove(), 550)
    }

    const variants: Record<string, string> = {
        primary: "border-teal-700 bg-[linear-gradient(135deg,#0f9f7f,#0b7f76)] text-white hover:border-teal-600 hover:bg-[linear-gradient(135deg,#10b981,#0f766e)] hover:text-white hover:shadow-lg hover:shadow-teal-700/25 dark:border-teal-300/35 dark:bg-[linear-gradient(135deg,#2dd4bf,#0f766e)] dark:text-slate-950 dark:hover:border-teal-200 dark:hover:bg-[linear-gradient(135deg,#5eead4,#14b8a6)] dark:hover:text-slate-950 dark:hover:shadow-teal-500/30",
        secondary: "border-blue-700 bg-[linear-gradient(135deg,#2563eb,#1d4ed8)] text-white hover:border-blue-600 hover:bg-[linear-gradient(135deg,#3b82f6,#2563eb)] hover:text-white hover:shadow-lg hover:shadow-blue-700/25 dark:border-sky-300/35 dark:bg-[linear-gradient(135deg,#60a5fa,#2563eb)] dark:text-slate-950 dark:hover:border-sky-200 dark:hover:bg-[linear-gradient(135deg,#93c5fd,#3b82f6)] dark:hover:text-slate-950 dark:hover:shadow-sky-500/30",
        danger: "border-red-700 bg-[linear-gradient(135deg,#e11d48,#be123c)] text-white hover:border-red-600 hover:bg-[linear-gradient(135deg,#f43f5e,#e11d48)] hover:text-white hover:shadow-lg hover:shadow-red-700/25 dark:border-rose-300/35 dark:bg-[linear-gradient(135deg,#fb7185,#e11d48)] dark:text-white dark:hover:border-rose-200 dark:hover:bg-[linear-gradient(135deg,#fda4af,#f43f5e)] dark:hover:text-white dark:hover:shadow-rose-500/30",
        warning: "border-amber-600 bg-[linear-gradient(135deg,#f59e0b,#d97706)] text-white hover:border-amber-500 hover:bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] hover:text-slate-950 hover:shadow-lg hover:shadow-amber-600/25 dark:border-amber-300/35 dark:bg-[linear-gradient(135deg,#fbbf24,#f59e0b)] dark:text-slate-950 dark:hover:border-amber-200 dark:hover:bg-[linear-gradient(135deg,#fcd34d,#fbbf24)] dark:hover:text-slate-950 dark:hover:shadow-amber-500/30",
        success: "border-emerald-700 bg-[linear-gradient(135deg,#16a34a,#15803d)] text-white hover:border-emerald-600 hover:bg-[linear-gradient(135deg,#22c55e,#16a34a)] hover:text-white hover:shadow-lg hover:shadow-emerald-700/25 dark:border-emerald-300/35 dark:bg-[linear-gradient(135deg,#4ade80,#16a34a)] dark:text-slate-950 dark:hover:border-emerald-200 dark:hover:bg-[linear-gradient(135deg,#86efac,#22c55e)] dark:hover:text-slate-950 dark:hover:shadow-emerald-500/30",
        black: "bg-[var(--bg-card-strong)] text-[var(--text-primary)] border-[var(--border-input)] hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-lg dark:bg-[var(--surface-secondary)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--text-primary)] dark:hover:text-[var(--bg-primary)] dark:hover:border-[var(--text-primary)]",
        "soft-primary": "bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 dark:bg-emerald-400/10 dark:text-emerald-200 dark:border-emerald-300/20 dark:hover:bg-emerald-400/18 dark:hover:border-emerald-300/35",
        "soft-danger": "bg-red-50 text-red-800 border-red-300 hover:bg-red-100 hover:border-red-400 dark:bg-rose-400/10 dark:text-rose-200 dark:border-rose-300/20 dark:hover:bg-rose-400/18 dark:hover:border-rose-300/35",
        "soft-warning": "bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 hover:border-amber-400 dark:bg-amber-300/10 dark:text-amber-100 dark:border-amber-300/20 dark:hover:bg-amber-300/18 dark:hover:border-amber-300/35",
        "soft-secondary": "bg-blue-50 text-blue-800 border-blue-300 hover:bg-blue-100 hover:border-blue-400 dark:bg-sky-400/10 dark:text-sky-200 dark:border-sky-300/20 dark:hover:bg-sky-400/18 dark:hover:border-sky-300/35",
        ghost: "bg-[var(--surface-subtle)] text-[var(--text-primary)] border-transparent hover:bg-[var(--surface-soft-strong)] hover:text-[var(--text-primary)] dark:bg-[var(--surface-subtle)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-soft-strong)] dark:hover:text-[var(--text-primary)]",
        outline: "bg-[var(--bg-card-strong)] text-[var(--text-primary)] border-[var(--border-input)] hover:bg-[var(--surface-primary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] dark:bg-[var(--surface-subtle)] dark:hover:bg-[var(--surface-soft-strong)] dark:hover:border-[var(--border-card)]",
        dotBorder: "border-2 border-dashed border-[var(--border-input)] bg-[var(--bg-card-strong)] text-[var(--text-secondary)] hover:text-teal-700 hover:border-teal-500 hover:bg-teal-50 dark:bg-[var(--surface-subtle)] dark:hover:text-teal-200 dark:hover:border-teal-300 dark:hover:bg-teal-400/10",
        delete: "border-none text-rose-300 hover:text-red-500 hover:bg-red-50 dark:text-rose-200 dark:hover:text-rose-100 dark:hover:bg-rose-500/14 rounded-xl",
        menu: "lg:hidden border-transparent bg-transparent text-[var(--text-primary)]",
        login: "border-[var(--accent)] bg-[linear-gradient(135deg,var(--accent),color-mix(in_srgb,var(--accent)_76%,#ec4899_24%))] text-white hover:border-[var(--accent)] hover:bg-[linear-gradient(135deg,color-mix(in_srgb,var(--accent)_92%,white_8%),color-mix(in_srgb,var(--accent)_72%,#ec4899_28%))] hover:text-white dark:text-white",
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
                "relative inline-flex max-w-full min-w-0 items-center justify-center gap-2",
                "min-h-11 rounded-xl border px-3 py-2 font-semibold shadow-[var(--button-shadow)] sm:px-5",
                "transition-all duration-200 ease-out",
                "select-none motion-reduce:transform-none",
                variants[variant] ?? variants.primary,
                isDisabled
                    ? "opacity-50 cursor-not-allowed pointer-events-none"
                    : "cursor-pointer active:translate-y-[1px] active:scale-[0.98] hover:-translate-y-[1px] hover:shadow-[var(--button-shadow-hover)]",
                className,
            ].join(" ")}
        >
            {loading ? (
                <span className="btn-spinner" />
            ) : (
                icon && <span className="text-[18px] leading-none flex-shrink-0">{icon}</span>
            )}

            {(title || loading) && (
                <span className="min-w-0 text-center leading-tight sm:whitespace-nowrap">
                    {loading ? en.common.processing : title}
                </span>
            )}

            {!loading && iconRight && (
                <span className="text-[18px] leading-none flex-shrink-0">{iconRight}</span>
            )}
        </button>
    )
}
