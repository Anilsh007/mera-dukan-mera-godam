import React from "react";

interface ButtonProps {
    onClick?: () => void;
    title?: string;
    icon?: React.ReactNode;
    className?: string;
    type?: "submit" | "reset" | "button";
    variant?: "primary" | "secondary" | "danger" | "ghost" | "warning" | "menu" | "dotBorder" | "delete" | "black";
    loading?: boolean;
    disabled?: boolean;
}

export default function Button({ onClick, title, icon, className = "", type = "button", variant = "primary", loading = false, disabled = false }: ButtonProps) {

    const variants = {
        primary: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30 hover:bg-emerald-500 hover:text-white",
        secondary: "bg-blue-500/10 text-blue-600 border-blue-500/30 hover:bg-blue-500 hover:text-white",
        danger: "bg-red-500/10 text-red-600 border-red-500/30 hover:bg-red-500 hover:text-white",
        warning: "bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500 hover:text-white",
        ghost: "bg-gray-100 text-gray-600 border-transparent hover:bg-gray-200",
        black: "bg-black-100 text-gray-600 border-black-200 hover:bg-black hover:text-white hover:border-black",
        dotBorder: "border-2 border-dashed border-slate-200 text-slate-400 hover:text-blue-500 hover:border-blue-300 hover:bg-blue-50 transition-all font-semibold",
        delete: "p-0 border-none text-rose-200 hover:text-red-500 hover:bg-red-00 rounded-xl transition-all",
        menu: "lg:hidden"
    };

    const isDisabled = loading || disabled;

    return (
        <button type={type} disabled={isDisabled}
            // Clicks ko ignore karne ke liye preventDefault
            onClick={(e) => {
                if (isDisabled) {
                    e.preventDefault();
                    return;
                }
                onClick?.();
            }}
            className={`w-fit flex items-center justify-center px-5 py-2 rounded-xl border font-medium transition-all ${variants[variant]} ${isDisabled ? "!opacity-50 !cursor-not-allowed !pointer-events-none active:scale-100" : "cursor-pointer active:scale-95"} ${className}`}
        >
            {loading ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
                icon && <span className="mr-2 text-xl">{icon}</span>
            )}
            <span>{loading ? "Processing..." : title}</span>
        </button>
    );
}
