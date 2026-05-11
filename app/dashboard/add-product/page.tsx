import AddProductForm from "./AddProductForm"
import { en } from "@/app/messages/en"

export default function AddProductPage() {

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{en.pages.quickPurchaseTitle}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {en.pages.quickPurchaseDescription}
                </p>
            </div>
            <AddProductForm />
        </div>
    )

}
