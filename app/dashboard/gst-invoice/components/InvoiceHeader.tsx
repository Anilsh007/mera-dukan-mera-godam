import Button from "@/app/components/utility/Button"
import Input from "@/app/components/utility/CommonInput"
import { MdOutlinePrint, MdOutlineWallet, MdSave } from "react-icons/md"
import { InvoiceHeaderProps } from "../types/ui.types"

export default function InvoiceHeader({ invoice, onChange, onSave, onReset, saving, }: InvoiceHeaderProps) {
    return (
        <section className="card min-w-0">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="min-w-0">
                    <h2 className="text-2xl font-bold">Create GST Invoice</h2>
                </div>

                <div className="grid grid-cols-1 gap-2 min-[420px]:grid-cols-3">
                    <Button title="New Invoice" variant="outline" icon={<MdOutlineWallet />} onClick={onReset} />
                    <Button title="Print" variant="secondary" icon={<MdOutlinePrint />} onClick={() => window.print()} />
                    <Button title="Save" variant="primary" icon={<MdSave />} onClick={onSave} loading={saving} />
                </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3 shadow-[var(--shadow-card)] backdrop-blur-xl sm:grid-cols-3 sm:p-2">
                <Input label="Invoice No" value={invoice.invoiceNo} onChange={(e) => onChange("invoiceNo", e.target.value)} />
                <Input type="date" label="Date" value={invoice.invoiceDate} onChange={(e) => onChange("invoiceDate", e.target.value)} />
                <Input type="date" label="Due" value={invoice.dueDate} onChange={(e) => onChange("dueDate", e.target.value)} />
            </div>
        </section>
    )
}
