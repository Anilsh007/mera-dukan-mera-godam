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
        <div className={containerClassName}>
            {label && (
                <label htmlFor={inputId} className="block mb-1 text-sm font-medium text-[var(--text-primary)]" >
                    {label}
                </label>
            )}

            <input id={inputId} list={datalist} {...props} className={`w-full p-2 rounded-xl border bg-[var(--bg-input)] border-[var(--border-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-2 focus:ring-emerald-400 outline-none transition-all ${className}`} />
        </div>
    )
}
