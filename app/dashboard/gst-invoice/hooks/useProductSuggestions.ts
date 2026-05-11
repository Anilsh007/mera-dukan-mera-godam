import useProducts from "@/app/hooks/useProducts";
import type { Product } from "@/app/lib/db";

export interface ProductSuggestion {
  label: string;
  value: string;
  category: string;
  price: number;
  unit: string;
  hsnCode: string;
}

export const useProductSuggestions = () => {
  const { products } = useProducts();

  const suggestions: ProductSuggestion[] = products.map((p: Product) => ({
    label: p.name,
    value: p.name,
    category: p.category || "",
    price: p.price || 0,
    unit: p.quantityUnit || "pcs",
    hsnCode: p.hsnCode || "",
  }));

  return { suggestions };
};
