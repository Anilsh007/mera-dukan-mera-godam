"use client";

import { Product } from "@/app/lib/db";

type SuggestionsProps = {
  products: Product[];
  type: "product" | "category" | "supplier";
};

export default function Suggestions({ products, type }: SuggestionsProps) {
  const uniqueValues = Array.from(
    new Set(
      products
        .map(p => (type === "product" ? p.name : type === "category" ? p.category : p.supplier))
        .filter(Boolean)
    )
  );

  const listId =
    type === "product" ? "productNames" : type === "category" ? "categories" : "suppliers";

  return (
    <datalist id={listId}>
      {uniqueValues.map((val, idx) => (
        <option key={idx} value={val} />
      ))}
    </datalist>
  );
}
