import Input from "@/app/components/utility/CommonInput"
import Button from "@/app/components/utility/Button"
import { MdDeleteOutline } from "react-icons/md"
import StatPill from "./StatPill"
import { ItemCardProps } from "../types/ui.types"

export default function ItemCard({ item, index, onChange, onRemove }:ItemCardProps) {
  return (
    <div className="border p-4 rounded-xl">
      <div className="flex justify-between">
        <p>Item {index + 1}</p>
        <Button variant="delete" icon={<MdDeleteOutline />} onClick={() => onRemove(index)} />
      </div>

      <div className="grid md:grid-cols-4 gap-2 mt-3">
        <Input label="Product" value={item.description} onChange={(e) => onChange(index, "description", e.target.value)} />
        <Input label="HSN / SAC" value={item.hsnCode} onChange={(e) => onChange(index, "hsnCode", e.target.value)} />
        <Input label="Rate" type="number" value={String(item.rate)} onChange={(e) => onChange(index, "rate", e.target.value)} />
        <Input label="Qty" type="number" value={String(item.quantity)} onChange={(e) => onChange(index, "quantity", e.target.value)} />
      </div>

      <div className="grid md:grid-cols-3 gap-2 mt-3">
        <StatPill label="Taxable" value={item.taxableValue.toFixed(2)} />
        <StatPill label="CGST" value={item.cgstAmount.toFixed(2)} />
        <StatPill label="Total" value={item.total.toFixed(2)} />
      </div>
    </div>
  )
}