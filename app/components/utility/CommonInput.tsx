import { useId } from "react"

// Input.tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: React.ReactNode
    containerClassName?: string
    datalist?: string   // 🔹 new prop for suggestions
}

export default function Input({
    label,
    containerClassName,
    className = "",
    id,
    datalist,
    ...props
}: InputProps) {
    const generatedId = useId()
    const inputId = id || generatedId

    return (
        <div className={`min-w-0 ${containerClassName || ""}`}>
            {label && (
                <label htmlFor={inputId} className="block mb-1 text-sm font-medium text-[var(--text-primary)]" >
                    {label}
                </label>
            )}

            <input id={inputId} list={datalist} {...props} className={`min-h-10 w-full min-w-0 rounded-xl border border-[var(--border-input)] bg-[var(--bg-input)] p-2 text-base text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none transition-all focus:ring-2 focus:ring-emerald-400 sm:text-sm ${className}`} />
        </div>
    )
}
