import Button from "@/app/components/utility/Button";
import { MdAdd } from "react-icons/md";
import ItemCard from "./ItemCard";
import { ItemsSectionProps } from "../types/ui.types";

export default function ItemsSection({
  items,
  onChange,
  addItem,
  removeItem,
  isInterState,
}: ItemsSectionProps) {

  return (
    <section className="card">
      <div className="flex justify-between">
        <h3>Items</h3>
        <Button
          title="Add Item"
          variant="outline"
          icon={<MdAdd />}
          onClick={addItem}
        />
      </div>

      <div className="space-y-4 mt-4">
        {items.map((item, i) => (
          <ItemCard
            key={i}
            item={item}
            index={i}
            onChange={onChange}
            onRemove={removeItem}
            isInterState={isInterState}
          />
        ))}
      </div>
    </section>
  );
}
