interface TableItem {
    id?: number | string | null
    name?: string
    category?: string
    supplier?: string
    expiry?: string
    price?: number
    quantity?: number
    createdAt?: string
    note?: string
}

const columns = ["name", "category", "supplier", "expiry", "price", "quantity", "total", "createdAt", "note"] as const

export default function TableComponent({ data }: { data: TableItem[] }) {

    return (
        <div className="w-[96.5vw] md:w-auto rounded-xl border bg-[var(--bg-card)] border-[var(--border-card)] shadow-[var(--shadow-card)]">

            <div className="relative overflow-x-auto">
                <table className="w-full text-left border-collapse  table-auto">
                    {/* HEADER */}
                    <thead className="bg-black-90/90 dark:bg-white/5">
                        <tr className="border-b border-[var(--border-card)]">
                            {columns.map((col) => (
                                <th key={col} className="px-6 py-4 text-sm font-semibold capitalize whitespace-nowrap">
                                    {col === "price" ? "Price / Item" : col === "total" ? "Total" : col}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {data.map((item, index) => (
                            <tr key={item.id ?? index} className="group hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors" >
                                {columns.map((col) => {
                                    if (col === "total") {
                                        const total = (item.price ?? 0) * (item.quantity ?? 0)
                                        return (
                                            <td key={col} className="px-6 py-4 font-semibold text-emerald-600 whitespace-nowrap" >
                                                ₹{total.toLocaleString("en-IN")}
                                            </td>
                                        )
                                    }

                                    if (col === "price")

                                        return (
                                            <td key={col} className="px-6 py-4 font-mono whitespace-nowrap">
                                                ₹{Number(item.price ?? 0).toLocaleString("en-IN")}
                                            </td>
                                        )

                                    if (col === "quantity")
                                        return (
                                            <td key={col} className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className={`h-2 w-2 rounded-full ${(item.quantity ?? 0) > 5
                                                        ? "bg-emerald-500"
                                                        : "bg-amber-500"
                                                        }`}
                                                    />
                                                    {item.quantity ?? 0} units
                                                </div>
                                            </td>
                                        )

                                    if (col === "category")
                                        return (
                                            <td key={col} className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex rounded-md px-2 py-1 text-xs uppercase">{item.category || "General"}</span>
                                            </td>
                                        )

                                    if (col === "supplier")
                                        return (
                                            <td key={col} className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex rounded-md px-2 py-1 text-xs uppercase">{item.supplier || "General"}</span>
                                            </td>
                                        )

                                    if (col === "expiry")
                                        return (
                                            <td key={col} className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex rounded-md px-2 py-1 text-xs uppercase">{item.expiry || "General"}</span>
                                            </td>
                                        )

                                    if (col === "createdAt")
                                        return (
                                            <td key={col} className="px-6 py-4 text-gray-700 dark:text-gray-400 whitespace-nowrap">
                                                {item.createdAt ? (
                                                    <>
                                                        {new Date(String(item.createdAt))
                                                            .toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}{" - "}
                                                        <span className="text-gray-400 dark:text-gray-500">
                                                            ({new Date(String(item.createdAt)).toLocaleTimeString("en-IN", {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                            })})
                                                        </span>
                                                    </>
                                                ) : (
                                                    "N/A"
                                                )}
                                            </td>
                                        )

                                    if (col === "note")
                                        return (
                                            <td key={col} className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex rounded-md px-2 py-1 text-xs uppercase">{item.note || "General"}</span>
                                            </td>
                                        )


                                    return (
                                        <td key={col} className="px-6 py-4 font-medium whitespace-nowrap" >
                                            {(item as any)[col] || "N/A"}
                                        </td>
                                    )
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data.length === 0 && (
                <div className="py-12 text-center text-gray-500 text-sm">
                    No stock items found.
                </div>
            )}

        </div>
    )
}