"use client"

import { ShoppingCart } from "lucide-react"
import Button from "@/app/components/ui/Button"
import GuidedStepCard from "@/app/components/ui/GuidedStepCard"
import Input from "@/app/components/ui/Input"
import QuantityStepper from "@/app/components/ui/QuantityStepper"
import SimpleEmptyState from "@/app/components/ui/SimpleEmptyState"
import { en } from "@/app/messages/en"
import { formatCurrency } from "@/app/lib/formatters"
import { formatQuantity } from "@/app/lib/quantityUnit"
import type { SaleItem } from "@/app/lib/db"
import type { QuickSaleCartItem } from "./types"

type QuickSaleCartEditorProps = {
  cart: QuickSaleCartItem[]
  calculatedItems: SaleItem[]
  gstEnabled: boolean
  onUpdateCartItem: (productId: string, patch: Partial<QuickSaleCartItem>) => void
  onRemoveCartItem: (productId: string) => void
}

export default function QuickSaleCartEditor({
  cart,
  calculatedItems,
  gstEnabled,
  onUpdateCartItem,
  onRemoveCartItem,
}: QuickSaleCartEditorProps) {
  return (
    <div className="py-4">
      <GuidedStepCard step={2} title={en.sales.stepCartTitle} description={en.sales.stepCartDescription} icon={<ShoppingCart size={18} />} >
        <div className="space-y-4">
          {cart.map((item, index) => (
            <div key={item.productId} className="rounded-2xl border border-[var(--border-card)] bg-[var(--surface-primary)] p-4">
              <div className="flex flex-wrap align-items-center justify-between gap-3">
                <div className="flex align-items-end gap-2">
                  <p className="font-semibold capitalize text-[var(--text-primary)]">{item.name}</p>
                  <span className="text-xs text-[var(--text-secondary)]">(
                    {formatQuantity(item.availableQty, item.quantityUnit)} | {item.category || en.inventory.noCategory})
                  </span>
                </div>
                <div>
                  <span className="mr-2 border border-[var(--border-card)] bg-[var(--surface-secondary)] rounded-2xl w-full px-2 py-3 text-sm font-semibold text-emerald-500">
                    {formatCurrency(calculatedItems[index]?.lineTotal || 0)}
                  </span>
                  <Button type="button" variant="delete" title={en.common.delete} onClick={() => onRemoveCartItem(item.productId)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <QuantityStepper label={en.inventory.quantityToSell} value={item.quantity} onChange={(value) => onUpdateCartItem(item.productId, { quantity: value })} min={1} max={item.availableQty} unitLabel={item.quantityUnit} decreaseLabel={en.pos.decreaseQuantity} increaseLabel={en.pos.increaseQuantity} />
                <Input type="number" min={0} label={en.inventory.saleRate} value={item.salePrice} onChange={(event) => onUpdateCartItem(item.productId, { salePrice: event.target.value })} />
                <Input type="number" min={0} label={en.sales.discount} value={item.discount} onChange={(event) => onUpdateCartItem(item.productId, { discount: event.target.value })} placeholder={en.sales.discountPlaceholder} />
                <Input type="number" min={0} label={en.inventory.gstPercent} value={item.gstRate} onChange={(event) => onUpdateCartItem(item.productId, { gstRate: event.target.value })} disabled={!gstEnabled} />
                <Input label={en.inventory.note} value={item.note} onChange={(event) => onUpdateCartItem(item.productId, { note: event.target.value })} />
              </div>

            </div>
          ))}

          {!cart.length ? (
            <SimpleEmptyState title={en.sales.emptyCartTitle} description={en.sales.emptyCartDescription} icon={<ShoppingCart size={18} aria-hidden="true" />}
            />
          ) : null}
        </div>
      </GuidedStepCard>
    </div>
  )
}
