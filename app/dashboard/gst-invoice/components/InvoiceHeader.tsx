import Button from "@/app/components/ui/Button"
import Input from "@/app/components/ui/Input"
import { MdOutlinePrint, MdOutlineWallet, MdSave } from "react-icons/md"
import { InvoiceHeaderProps } from "../types/ui.types"
import { en } from "@/app/messages/en"

export default function InvoiceHeader({ invoice, onChange, onSave, onReset, onPrintPreview, saving, }: InvoiceHeaderProps) {
    return (
        <>
            <section className="premium-surface min-w-0 rounded-2xl p-4 sm:p-5">
                <div className="flex flex-wrap justify-between">
                    <h2 className="text-2xl font-bold">{en.gstInvoice.createTitle}</h2>
                    <div className="flex gap-3">
                        <Button title={en.gstInvoice.newInvoice} variant="outline" icon={<MdOutlineWallet />} onClick={onReset} />
                        <Button title={en.gstInvoice.save} variant="primary" icon={<MdSave />} onClick={onSave} loading={saving} />
                    </div>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-3 rounded-2xl border border-[var(--border-card)] bg-[var(--bg-card-strong)] p-3 shadow-[var(--shadow-card)] backdrop-blur-xl sm:grid-cols-3 sm:p-2">
                    <Input label={en.gstInvoice.invoiceNo} value={invoice.invoiceNo} readOnly aria-readonly="true" />
                    <Input type="date" label={en.gstInvoice.date} value={invoice.invoiceDate} onChange={(e) => onChange("invoiceDate", e.target.value)} />
                    <Input type="date" label={en.gstInvoice.due} value={invoice.dueDate} onChange={(e) => onChange("dueDate", e.target.value)} />
                </div>
            </section>

            <div className=" fixed z-10 right-4 bottom-4">
                <Button title={`${en.gstInvoice.printPreview} & ${en.gstInvoice.preview}`} variant="danger" icon={<MdOutlinePrint />} onClick={onPrintPreview} className="dark:bg-red-900 animate-pulse" />
            </div>
        </>
    )
}
