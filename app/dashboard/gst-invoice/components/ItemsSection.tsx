import Button from "@/app/components/utility/Button"
import { MdAdd } from "react-icons/md"
import ItemCard from "./ItemCard"
import { ItemsSectionProps } from "../types/ui.types"

export default function ItemsSection({items,onChange,addItem,removeItem,productSuggestions,}:ItemsSectionProps) {
  return (
    <section className="card">
      <div className="flex justify-between">
        <h3>Items</h3>
        <Button title="Add Item" variant="outline" icon={<MdAdd />} onClick={addItem} />
      </div>

      <datalist id="products">
        {productSuggestions.map((p) => (
          <option key={p.name} value={p.displayName} />
        ))}
      </datalist>

      <div className="space-y-4 mt-4">
        {items.map((item, i) => (
          <ItemCard
            key={i}
            item={item}
            index={i}
            onChange={onChange}
            onRemove={removeItem}
          />
        ))}
      </div>
    </section>
  )
}