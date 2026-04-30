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
        primary: "bg-emerald-500/10 text-emerald-600 border-emerald-400/40 hover:bg-emerald-500 hover:text-[var(--text-primary)] hover:border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/25",
        secondary: "bg-blue-500/10 text-blue-600 border-blue-400/40 hover:bg-blue-500 hover:text-[var(--text-primary)] hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/25",
        danger: "bg-red-500/10 text-red-600 border-red-400/40 hover:bg-red-500 hover:text-[var(--text-primary)] hover:border-red-500 hover:shadow-lg hover:shadow-red-500/25",
        warning: "bg-amber-500/10 text-amber-600 border-amber-400/40 hover:bg-amber-500 hover:text-[var(--text-primary)] hover:border-amber-500 hover:shadow-lg hover:shadow-amber-500/25",
        success: "bg-green-500/20 text-[var(--text-primary)] border-green-500/50 hover:bg-green-600 hover:border-green-600 hover:shadow-lg hover:shadow-green-500/30",
        black: "bg-transparent text-gray-600 border-black-200 hover:bg-gray-900 hover:text-[var(--text-primary)] hover:border-gray-900 hover:shadow-lg",

        // always soft fill
        "soft-primary": "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800 dark:hover:bg-emerald-900/40",
        "soft-danger": "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/40",
        "soft-warning": "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 hover:border-amber-300 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-900/40",
        "soft-secondary": "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 hover:border-blue-300 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-900/40",

        // minimal
        ghost: "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200 dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white/10",
        outline: "bg-transparent text-[var(--text-primary)] border-[var(--border-input)] hover:bg-[var(--bg-primary)]",
        dotBorder: "border-2 border-dashed border-slate-300 text-slate-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50 dark:border-slate-600 dark:hover:border-blue-500 dark:hover:bg-blue-900/20",
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
                    "px-5 py-2 rounded-xl border font-medium",
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
