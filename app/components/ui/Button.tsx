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
        primary: "bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-700 hover:text-white hover:border-teal-700 hover:shadow-lg hover:shadow-teal-700/20 dark:bg-teal-400/14 dark:text-teal-200 dark:border-teal-300/30 dark:hover:bg-teal-400 dark:hover:text-slate-950 dark:hover:border-teal-300 dark:hover:shadow-teal-500/25",
        secondary: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-700 hover:text-white hover:border-blue-700 hover:shadow-lg hover:shadow-blue-700/20 dark:bg-sky-400/14 dark:text-sky-200 dark:border-sky-300/30 dark:hover:bg-sky-400 dark:hover:text-slate-950 dark:hover:border-sky-300 dark:hover:shadow-sky-500/25",
        danger: "bg-red-50 text-red-700 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-lg hover:shadow-red-700/20 dark:bg-rose-400/14 dark:text-rose-200 dark:border-rose-300/28 dark:hover:bg-rose-500 dark:hover:text-white dark:hover:border-rose-300 dark:hover:shadow-rose-500/25",
        warning: "border-amber-300 bg-amber-50 text-amber-700 hover:border-amber-500 hover:bg-amber-500 hover:text-white hover:shadow-lg hover:shadow-amber-600/20 dark:border-amber-300/28 dark:bg-amber-300/12 dark:text-amber-100 dark:hover:border-amber-300 dark:hover:bg-amber-400 dark:hover:text-slate-950 dark:hover:shadow-amber-500/25",
        success: "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-700/20 dark:bg-emerald-400/14 dark:text-emerald-200 dark:border-emerald-300/30 dark:hover:bg-emerald-400 dark:hover:text-slate-950 dark:hover:border-emerald-300 dark:hover:shadow-emerald-500/25",
        black: "bg-transparent text-[var(--text-secondary)] border-[var(--border-input)] hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-lg dark:bg-[var(--surface-subtle)] dark:text-[var(--text-primary)] dark:hover:bg-[var(--text-primary)] dark:hover:text-[var(--bg-primary)] dark:hover:border-[var(--text-primary)]",
        "soft-primary": "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-400/10 dark:text-emerald-200 dark:border-emerald-300/20 dark:hover:bg-emerald-400/18 dark:hover:border-emerald-300/35",
        "soft-danger": "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-rose-400/10 dark:text-rose-200 dark:border-rose-300/20 dark:hover:bg-rose-400/18 dark:hover:border-rose-300/35",
        "soft-warning": "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-300/10 dark:text-amber-100 dark:border-amber-300/20 dark:hover:bg-amber-300/18 dark:hover:border-amber-300/35",
        "soft-secondary": "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-sky-400/10 dark:text-sky-200 dark:border-sky-300/20 dark:hover:bg-sky-400/18 dark:hover:border-sky-300/35",
        ghost: "bg-black/5 text-[var(--text-secondary)] border-transparent hover:bg-black/10 dark:bg-[var(--surface-subtle)] dark:text-[var(--text-secondary)] dark:hover:bg-[var(--surface-soft-strong)] dark:hover:text-[var(--text-primary)]",
        outline: "bg-transparent text-[var(--text-primary)] border-[var(--border-input)] hover:bg-[var(--bg-primary)] dark:bg-[var(--surface-subtle)] dark:hover:bg-[var(--surface-soft-strong)] dark:hover:border-[var(--border-card)]",
        dotBorder: "border-2 border-dashed border-[var(--border-input)] text-[var(--text-muted)] hover:text-teal-700 hover:border-teal-400 hover:bg-teal-50 dark:bg-[var(--surface-subtle)] dark:hover:text-teal-200 dark:hover:border-teal-300 dark:hover:bg-teal-400/10",
        delete: "border-none text-rose-300 hover:text-red-500 hover:bg-red-50 dark:text-rose-200 dark:hover:text-rose-100 dark:hover:bg-rose-500/14 rounded-xl",
        menu: "lg:hidden border-transparent bg-transparent text-[var(--text-primary)]",
        login: "border border-white/60 text-[var(--text-primary)] hover:bg-white/10",
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
                "min-h-11 rounded-xl border px-3 py-2 font-medium shadow-[var(--button-shadow)] sm:px-5",
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
