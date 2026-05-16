import QuickPurchaseForm from "./QuickPurchaseForm"
import { en } from "@/app/messages/en"

export default function QuickPurchasePage() {

    return (
        <div className="space-y-5">
            <div>
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">{en.pages.quickPurchaseTitle}</h2>
                <p className="mt-1 text-sm text-[var(--text-secondary)]">
                    {en.pages.quickPurchaseDescription}
                </p>
            </div>
            <QuickPurchaseForm />
        </div>
    )

}
