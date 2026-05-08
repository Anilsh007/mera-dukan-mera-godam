"use client"

import React, { useRef } from "react";

interface ButtonProps {
    onClick?: () => void;
    title?: string;
    icon?: React.ReactNode;
    className?: string;
    type?: "submit" | "reset" | "button";
    variant?:
    | "primary"     // emerald — main action
    | "secondary"   // blue — secondary action  
    | "danger"      // red — destructive
    | "warning"     // amber — caution
    | "success"     // green solid — confirm
    | "ghost"       // subtle gray
    | "outline"     // transparent + border only
    | "black"       // dark
    | "dotBorder"   // dashed — add more
    | "delete"      // icon-only delete
    | "menu"        // mobile menu
    | "login"       // auth screen
    | "soft-primary"   // softer emerald fill
    | "soft-danger"    // softer red fill
    | "soft-warning"   // softer amber fill
    | "soft-secondary" // softer blue fill
    loading?: boolean;
    disabled?: boolean;
    iconRight?: React.ReactNode; // icon on right side
    ripple?: boolean;            // ripple effect toggle (default: true)
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
}: ButtonProps) {

    const btnRef = useRef<HTMLButtonElement>(null)

    // ripple effect on click
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
        // solid on hover
        primary: "bg-teal-50 text-teal-700 border-teal-300 hover:bg-teal-700 hover:text-white hover:border-teal-700 hover:shadow-lg hover:shadow-teal-700/20 dark:bg-teal-400/10 dark:text-teal-300 dark:border-teal-400/35 dark:hover:bg-teal-500 dark:hover:text-slate-950",
        secondary: "bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-700 hover:text-white hover:border-blue-700 hover:shadow-lg hover:shadow-blue-700/20 dark:bg-blue-400/10 dark:text-blue-300 dark:border-blue-400/35 dark:hover:bg-blue-500 dark:hover:text-slate-950",
        danger: "bg-red-50 text-red-700 border-red-300 hover:bg-red-600 hover:text-white hover:border-red-600 hover:shadow-lg hover:shadow-red-700/20 dark:bg-red-400/10 dark:text-red-300 dark:border-red-400/35 dark:hover:bg-red-500 dark:hover:text-white",
        warning: "bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-500 hover:text-slate-950 hover:border-amber-500 hover:shadow-lg hover:shadow-amber-600/20 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/35",
        success: "bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 hover:shadow-lg hover:shadow-emerald-700/20 dark:bg-emerald-400/10 dark:text-emerald-300 dark:border-emerald-400/35 dark:hover:bg-emerald-500 dark:hover:text-slate-950",
        black: "bg-transparent text-[var(--text-secondary)] border-[var(--border-input)] hover:bg-slate-900 hover:text-white hover:border-slate-900 hover:shadow-lg dark:hover:bg-white dark:hover:text-slate-950",

        // always soft fill
        "soft-primary": "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/40",
        "soft-danger": "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40",
        "soft-warning": "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/40",
        "soft-secondary": "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/40",

        // minimal
        ghost: "bg-black/5 text-[var(--text-secondary)] border-transparent hover:bg-black/10 dark:bg-white/5 dark:text-[var(--text-secondary)] dark:hover:bg-white/10",
        outline: "bg-transparent text-[var(--text-primary)] border-[var(--border-input)] hover:bg-[var(--bg-primary)]",
        dotBorder: "border-2 border-dashed border-[var(--border-input)] text-[var(--text-muted)] hover:text-teal-700 hover:border-teal-400 hover:bg-teal-50 dark:hover:text-teal-300 dark:hover:border-teal-400 dark:hover:bg-teal-400/10",
        delete: "border-none text-rose-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl",
        menu: "lg:hidden border-transparent bg-transparent text-[var(--text-primary)]",
        login: "border border-white/60 text-[var(--text-primary)] hover:bg-white/10",
    }

    const isDisabled = loading || disabled

    return (
        <>
            <style>{`
                @keyframes btn-ripple {
                    to { transform: scale(2.5); opacity: 0; }
                }
                @keyframes btn-spin {
                    to { transform: rotate(360deg); }
                }
                .btn-spinner {
                    width: 16px; height: 16px;
                    border: 2px solid currentColor;
                    border-top-color: transparent;
                    border-radius: 50%;
                    animation: btn-spin 0.6s linear infinite;
                    flex-shrink: 0;
                }
            `}</style>

            <button
                ref={btnRef}
                type={type}
                disabled={isDisabled}
                onClick={(e) => {
                    if (isDisabled) { e.preventDefault(); return }
                    handleRipple(e)
                    onClick?.()
                }}
                className={[
                    "relative inline-flex max-w-full items-center justify-center gap-2",
                    "min-h-10 rounded-xl border px-3 py-2 font-medium sm:px-5",
                    "transition-all duration-200 ease-out",
                    "select-none",
                    "capitalize",
                    variants[variant] ?? variants.primary,
                    isDisabled
                        ? "opacity-50 cursor-not-allowed pointer-events-none"
                        : "cursor-pointer active:scale-[0.96] hover:-translate-y-[1px]",
                    className,
                ].join(" ")}
            >
                {/* left icon or spinner */}
                {loading ? (
                    <span className="btn-spinner" />
                ) : (
                    icon && <span className="text-[18px] leading-none flex-shrink-0">{icon}</span>
                )}

                {/* label */}
                {(title || loading) && (
                    <span className="text-center leading-tight sm:whitespace-nowrap">
                        {loading ? "Processing..." : title}
                    </span>
                )}

                {/* right icon */}
                {!loading && iconRight && (
                    <span className="text-[18px] leading-none flex-shrink-0">{iconRight}</span>
                )}
            </button>
        </>
    )
}
