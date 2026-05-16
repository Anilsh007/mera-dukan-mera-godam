import Button from "@/app/components/ui/Button"
import { MdAdd } from "react-icons/md"
import ItemCard from "./ItemCard"
import { ItemsSectionProps } from "../types/ui.types"
import { en } from "@/app/messages/en"

export default function ItemsSection({
  items,
  onChange,
  onPatch,
  addItem,
  removeItem,
  isInterState,
}: ItemsSectionProps) {
  return (
    <section className="card min-w-0">
      <div className="flex flex-col gap-3 min-[420px]:flex-row min-[420px]:items-center min-[420px]:justify-between">
        <h3>{en.gstInvoice.items}</h3>
        <Button title={en.gstInvoice.addItem} variant="outline" icon={<MdAdd />} onClick={addItem} className="w-full min-[420px]:w-auto" />
      </div>

      <div className="mt-4 space-y-4">
        {items.map((item, i) => (
          <ItemCard
            key={i}
            item={item}
            index={i}
            onChange={onChange}
            onPatch={onPatch}
            onRemove={removeItem}
            isInterState={isInterState}
          />
        ))}
      </div>
    </section>
  )
}
