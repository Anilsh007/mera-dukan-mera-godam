import Button from "@/app/components/utility/Button"
import Input from "@/app/components/utility/CommonInput"
import { MdOutlinePrint, MdOutlineWallet, MdSave } from "react-icons/md"
import { InvoiceHeaderProps } from "../types/ui.types"

export default function InvoiceHeader({ invoice, onChange, onSave, onReset, saving, }: InvoiceHeaderProps) {
    return (
        <section className="card">
            <div className="grid grid-cols-1 lg:grid-cols-2">
                <div>
                    <h2 className="text-2xl font-bold">Create GST Invoice</h2>
                </div>

                <div className="grid grid-cols-3 gap-2">
                    <Button title="New Invoice" variant="outline" icon={<MdOutlineWallet />} onClick={onReset} />
                    <Button title="Print" variant="secondary" icon={<MdOutlinePrint />} onClick={() => window.print()} />
                    <Button title="Save" variant="primary" icon={<MdSave />} onClick={onSave} loading={saving} />
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4 p-3 sm:p-2 bg-[var(--bg-card-strong)] backdrop-blur-xl border border-[var(--border-card)] rounded-2xl shadow-[var(--shadow-card)]">
                <Input label="Invoice No" value={invoice.invoiceNo} onChange={(e) => onChange("invoiceNo", e.target.value)} />
                <Input type="date" label="Date" value={invoice.invoiceDate} onChange={(e) => onChange("invoiceDate", e.target.value)} />
                <Input type="date" label="Due" value={invoice.dueDate} onChange={(e) => onChange("dueDate", e.target.value)} />
            </div>
        </section>
    )
}