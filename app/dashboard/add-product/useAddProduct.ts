import { db, Product } from "@/app/lib/db";
import { auth } from "@/app/lib/firebase";
import { autoSyncToSupabase } from "@/app/lib/autoSupabaseSync.service";
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity";
import { v4 as uuidv4 } from "uuid";

export default function useAddProduct() {

  const createProduct = async (
    product: Omit<Product, "id" | "createdAt">,
    options?: { skipImmediateSync?: boolean }
  ) => {

    const userId = requireUserIdentityFromAuthUser(auth.currentUser);

    const normalizedName = product.name.trim().toLowerCase();
    const normalizedCategory = (product.category || "").trim().toLowerCase();

    const existing = await db.products
      .where("[userId+name+category]")
      .equals([userId, normalizedName, normalizedCategory])
      .first();

    if (existing) {
      await db.products.update(existing.id!, {
        quantity: existing.quantity + Number(product.quantity),
        price: Number(product.price),
      });

      await db.productLogs.add({
        id: uuidv4(),
        productId: existing.id!,
        quantityAdded: Number(product.quantity),
        type: "in",
        price: Number(product.price),
        date: new Date().toISOString(),
        note: product.note || undefined,
      });

    } else {

      const newId = uuidv4();

      await db.products.add({
        id: newId,
        name: normalizedName,
        price: Number(product.price),
        quantity: Number(product.quantity),
        category: normalizedCategory || undefined,
        supplier: product.supplier || undefined,
        expiry: product.expiry || undefined,
        sku: product.sku || undefined,
        note: product.note || undefined,
        userId,
        createdAt: new Date().toISOString(),
      });

      await db.productLogs.add({
        id: uuidv4(),
        productId: newId,
        quantityAdded: Number(product.quantity),
        type: "in",
        price: Number(product.price),
        date: new Date().toISOString(),
        note: product.note || undefined,
      });
    }

    if (!options?.skipImmediateSync) {
      await autoSyncToSupabase();
    }
  };

  return { createProduct };
}
