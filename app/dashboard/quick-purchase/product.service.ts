"use client";

import { v4 as uuidv4 } from "uuid";
import {
  db,
  type Product,
  type ProductLog,
  type StockTransactionProduct,
  type StockTransactionType,
} from "@/app/lib/db";
import { autoSyncToSupabase } from "@/app/lib/autoSupabaseSync.service";
import { normalizeQuantityUnit } from "@/app/lib/quantityUnit";
import { buildSaleLogNote } from "@/app/lib/saleMetadata";
import { roundCurrency } from "@/app/lib/gst.utils";

async function ensureCloudSync(context: string) {
  const runSync = () => {
    autoSyncToSupabase().catch((error) => {
      console.error(
        `${context} cloud sync failed. Local data is already saved and will retry on the next sync.`,
        error,
      );
    });
  };

  if (typeof window !== "undefined") {
    window.setTimeout(runSync, 0);
    return;
  }

  runSync();
}

type StockTransactionMetadata = {
  transactionId?: string;
  transactionType?: StockTransactionType;
  products?: StockTransactionProduct[];
  date?: string;
  amount?: number;
  taxableAmount?: number;
  gstRate?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstAmount?: number;
  paymentMode?: string;
  paymentStatus?: string;
  invoiceReceiptNo?: string;
  notes?: string;
  allowNegativeStock?: boolean;
};

type ServiceOptions = {
  skipImmediateSync?: boolean;
  transaction?: StockTransactionMetadata;
};

export type AddProductInput = {
  name: string;
  price: number;
  quantity: number;
  quantityUnit: string;
  category?: string;
  supplier?: string;
  expiry?: string;
  note?: string;
  sku?: string;
  hsnCode?: string;
  lowStockThreshold?: number;
  criticalStockThreshold?: number;
  userId: string;
};

type StockOutInput = {
  productId: string;
  quantity: number;
  quantityUnit?: string;
  salePrice: number;
  expiry?: string;
  reason?: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerGstin?: string;
  note?: string;
  gstRate?: number;
  taxableAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  gstAmount?: number;
  paymentMode?: string;
  paymentStatus?: string;
  invoiceReceiptNo?: string;
  transactionId?: string;
  transactionType?: StockTransactionType;
  transactionProducts?: StockTransactionProduct[];
  allowNegativeStock?: boolean;
};

type UpdateProductInput = {
  productId: string;
  name: string;
  price: number;
  quantityUnit?: string;
  category?: string;
  supplier?: string;
  expiry?: string;
  note?: string;
  sku?: string;
  hsnCode?: string;
  lowStockThreshold?: number;
  criticalStockThreshold?: number;
};

type AdjustProductStockInput = {
  productId: string;
  direction: "in" | "out";
  quantity: number;
  quantityUnit?: string;
  price?: number;
  reason?: string;
  note?: string;
  expiry?: string;
};

type UpdateProductLogInput = {
  logId: string;
  quantity: number;
  quantityUnit?: string;
  price: number;
  type?: "in" | "out";
  reason?: string;
  expiry?: string;
  date?: string;
  note?: string;
  buyerName?: string;
  buyerPhone?: string;
  buyerGstin?: string;
};

export async function addProduct(
  data: AddProductInput,
  options?: ServiceOptions,
) {
  const normalizedName = data.name.trim().toLowerCase();
  const normalizedCategory = (data.category || "").trim().toLowerCase();
  const quantityUnit = normalizeQuantityUnit(data.quantityUnit);
  const quantity = Number(data.quantity);
  const price = Number(data.price);

  if (!normalizedName) throw new Error("Product name is required");
  if (!Number.isFinite(quantity) || quantity <= 0)
    throw new Error("Quantity should be greater than 0");
  if (!Number.isFinite(price) || price < 0)
    throw new Error("Price cannot be negative");

  const existing = await findProductByIdentity(
    data.userId,
    normalizedName,
    normalizedCategory,
    quantityUnit,
  );
  const transaction = options?.transaction;
  const date = transaction?.date || new Date().toISOString();

  if (existing) {
    const oldStock = Number(existing.quantity || 0);
    const newStock = roundCurrency(oldStock + quantity);

    await db.products.update(existing.id, {
      quantity: newStock,
      quantityUnit,
      price,
      expiry: data.expiry || existing.expiry,
      supplier: data.supplier?.trim() || existing.supplier,
      sku: data.sku?.trim() || existing.sku,
      hsnCode: data.hsnCode?.trim() || existing.hsnCode,
      note: data.note?.trim() || existing.note,
      lowStockThreshold: data.lowStockThreshold ?? existing.lowStockThreshold,
      criticalStockThreshold:
        data.criticalStockThreshold ?? existing.criticalStockThreshold,
    });

    await db.productLogs.add(
      buildProductLog({
        product: {
          ...existing,
          price,
          expiry: data.expiry || existing.expiry,
          supplier: data.supplier?.trim() || existing.supplier,
          sku: data.sku?.trim() || existing.sku,
          hsnCode: data.hsnCode?.trim() || existing.hsnCode,
          note: data.note?.trim() || existing.note,
        },
        quantity,
        quantityUnit,
        type: "in",
        price,
        oldStock,
        newStock,
        expiry: data.expiry || undefined,
        date,
        note: mergeNotes(data.note, transaction?.notes),
        transaction: normalizeTransactionMetadata(transaction, {
          transactionType: "stock-in",
          amount: price * quantity,
        }),
      }),
    );

    if (!options?.skipImmediateSync) await ensureCloudSync("Stock update");
    return "updated";
  }

  const newId = uuidv4();
  const newStock = roundCurrency(quantity);
  const newProduct: Product = {
    id: newId,
    name: normalizedName,
    price,
    quantity: newStock,
    quantityUnit,
    category: normalizedCategory,
    supplier: data.supplier?.trim() || undefined,
    expiry: data.expiry || undefined,
    sku: data.sku?.trim() || undefined,
    hsnCode: data.hsnCode?.trim() || undefined,
    note: data.note?.trim() || undefined,
    lowStockThreshold: data.lowStockThreshold,
    criticalStockThreshold: data.criticalStockThreshold,
    userId: data.userId,
    createdAt: date,
  };

  await db.products.add(newProduct);
  await db.productLogs.add(
    buildProductLog({
      product: newProduct,
      quantity,
      quantityUnit,
      type: "in",
      price,
      oldStock: 0,
      newStock,
      expiry: data.expiry || undefined,
      date,
      note: mergeNotes(data.note, transaction?.notes),
      transaction: normalizeTransactionMetadata(transaction, {
        transactionType: "stock-in",
        amount: price * quantity,
      }),
    }),
  );

  if (!options?.skipImmediateSync) await ensureCloudSync("Product creation");
  return "created";
}

export async function stockOut(data: StockOutInput, options?: ServiceOptions) {
  const product = await db.products.get(data.productId);
  if (!product) throw new Error("Product not found");

  const quantity = Number(data.quantity);
  const normalizedReason = data.reason || "Sold";
  const normalizedSalePrice = Number(data.salePrice || 0);
  const quantityUnit = normalizeQuantityUnit(
    data.quantityUnit || product.quantityUnit,
  );
  const allowNegativeStock = Boolean(
    data.allowNegativeStock || options?.transaction?.allowNegativeStock,
  );

  if (!Number.isFinite(quantity) || quantity <= 0)
    throw new Error("Quantity should be greater than 0");
  if (!Number.isFinite(normalizedSalePrice) || normalizedSalePrice < 0)
    throw new Error("Price cannot be negative");
  if (!allowNegativeStock && quantity > product.quantity) {
    throw new Error(
      `Only ${product.quantity} ${quantityUnit} available, cannot stock out ${quantity} ${quantityUnit}`,
    );
  }

  const oldStock = Number(product.quantity || 0);
  const newStock = roundCurrency(oldStock - quantity);
  const transaction = normalizeTransactionMetadata(
    {
      ...options?.transaction,
      transactionId: data.transactionId || options?.transaction?.transactionId,
      transactionType:
        data.transactionType || options?.transaction?.transactionType,
      products: data.transactionProducts || options?.transaction?.products,
      gstRate: data.gstRate ?? options?.transaction?.gstRate,
      taxableAmount: data.taxableAmount ?? options?.transaction?.taxableAmount,
      cgstAmount: data.cgstAmount ?? options?.transaction?.cgstAmount,
      sgstAmount: data.sgstAmount ?? options?.transaction?.sgstAmount,
      igstAmount: data.igstAmount ?? options?.transaction?.igstAmount,
      gstAmount: data.gstAmount ?? options?.transaction?.gstAmount,
      paymentMode: data.paymentMode || options?.transaction?.paymentMode,
      paymentStatus: data.paymentStatus || options?.transaction?.paymentStatus,
      invoiceReceiptNo:
        data.invoiceReceiptNo || options?.transaction?.invoiceReceiptNo,
    },
    {
      transactionType:
        normalizedReason === "Sold" ? "sale" : "stock-adjustment",
      amount: normalizedSalePrice * quantity,
    },
  );

  await db.products.update(data.productId, {
    quantity: newStock,
  });

  await db.productLogs.add(
    buildProductLog({
      product,
      quantity,
      quantityUnit,
      type: "out",
      reason: normalizedReason,
      price: normalizedSalePrice,
      oldStock,
      newStock,
      expiry: data.expiry || undefined,
      date: transaction.date || new Date().toISOString(),
      note: buildSaleLogNote({
        buyerName: data.buyerName,
        buyerPhone: data.buyerPhone,
        buyerGstin: data.buyerGstin,
        note: mergeNotes(data.note, transaction.notes),
      }),
      transaction,
    }),
  );

  if (!options?.skipImmediateSync) await ensureCloudSync("Stock out");
  return "stocked-out";
}

export async function stockOutMany(entries: StockOutInput[]) {
  if (!entries.length) throw new Error("Select at least one item to sell");

  const productsById = new Map<string, Product>();
  const totalsByProductId = new Map<string, number>();

  for (const entry of entries) {
    const quantity = Number(entry.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0)
      throw new Error("Quantity should be greater than 0");
    totalsByProductId.set(
      entry.productId,
      (totalsByProductId.get(entry.productId) || 0) + quantity,
    );
  }

  for (const [productId, requestedQty] of totalsByProductId.entries()) {
    const product = await db.products.get(productId);
    if (!product) throw new Error("Product not found");
    productsById.set(productId, product);
    const allowNegative = entries.some(
      (entry) => entry.productId === productId && entry.allowNegativeStock,
    );
    if (!allowNegative && requestedQty > product.quantity) {
      throw new Error(
        `Only ${product.quantity} ${normalizeQuantityUnit(product.quantityUnit)} available for ${product.name}`,
      );
    }
  }

  const transactionId =
    entries[0]?.transactionId || createTransactionId("SALE");
  const date = new Date().toISOString();
  const transactionProducts = entries.map((entry) => {
    const product = productsById.get(entry.productId);
    const quantity = Number(entry.quantity);
    const rate = Number(entry.salePrice || 0);
    const gstAmount = Number(entry.gstAmount || 0);
    return {
      productId: entry.productId,
      name: product?.name || "",
      category: product?.category,
      sku: product?.sku,
      hsnCode: product?.hsnCode,
      quantity,
      quantityUnit: normalizeQuantityUnit(
        entry.quantityUnit || product?.quantityUnit,
      ),
      oldStock: product?.quantity,
      newStock: product
        ? roundCurrency(product.quantity - quantity)
        : undefined,
      rate,
      amount: roundCurrency(rate * quantity),
      gstRate: entry.gstRate,
      gstAmount,
    };
  });

  await db.transaction("rw", db.products, db.productLogs, async () => {
    for (const entry of entries) {
      await stockOut(
        {
          ...entry,
          transactionId,
          transactionType: "multi-item-sale",
          transactionProducts,
        },
        {
          skipImmediateSync: true,
          transaction: {
            transactionId,
            transactionType: "multi-item-sale",
            products: transactionProducts,
            date,
            invoiceReceiptNo: entry.invoiceReceiptNo,
            paymentMode: entry.paymentMode,
            paymentStatus: entry.paymentStatus,
          },
        },
      );
    }
  });

  await ensureCloudSync("Bulk stock out");
  return "stocked-out-many";
}

export async function updateProductDetails(data: UpdateProductInput) {
  const product = await db.products.get(data.productId);
  if (!product) throw new Error("Product not found");

  const normalizedName = data.name.trim().toLowerCase();
  const normalizedCategory = (data.category || "").trim().toLowerCase();
  const quantityUnit = normalizeQuantityUnit(
    data.quantityUnit || product.quantityUnit,
  );
  const price = Number(data.price);
  const quantityUnitChanged =
    quantityUnit !== normalizeQuantityUnit(product.quantityUnit);

  if (!normalizedName) throw new Error("Product name is required");
  if (!Number.isFinite(price) || price < 0)
    throw new Error("Price cannot be negative");

  if (quantityUnitChanged) {
    const historyCount = await db.productLogs
      .where("productId")
      .equals(product.id)
      .count();

    if (Number(product.quantity || 0) > 0 || historyCount > 0) {
      throw new Error(
        "Unit cannot be changed after stock or history already exists for this item",
      );
    }
  }

  const duplicate = await db.products
    .where("[userId+name+category+quantityUnit]")
    .equals([product.userId, normalizedName, normalizedCategory, quantityUnit])
    .first();

  if (duplicate && duplicate.id !== product.id) {
    throw new Error(
      "Another product already exists with same name and category",
    );
  }

  await db.products.update(product.id, {
    name: normalizedName,
    price,
    quantityUnit,
    category: normalizedCategory,
    supplier: data.supplier?.trim() || undefined,
    expiry: data.expiry || undefined,
    sku: data.sku?.trim() || undefined,
    hsnCode: data.hsnCode?.trim() || undefined,
    note: data.note?.trim() || undefined,
    lowStockThreshold: data.lowStockThreshold,
    criticalStockThreshold: data.criticalStockThreshold,
  });

  await ensureCloudSync("Product update");
  return "product-updated";
}

export async function adjustProductStock(data: AdjustProductStockInput) {
  const product = await db.products.get(data.productId);
  if (!product) throw new Error("Product not found");

  const quantity = Number(data.quantity);
  const price = Number(data.price ?? product.price ?? 0);
  const quantityUnit = normalizeQuantityUnit(
    data.quantityUnit || product.quantityUnit,
  );

  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantity should be greater than 0");
  }

  if (!Number.isFinite(price) || price < 0) {
    throw new Error("Price cannot be negative");
  }

  if (data.direction === "out" && quantity > Number(product.quantity || 0)) {
    throw new Error("Adjustment would make stock negative");
  }

  const oldStock = Number(product.quantity || 0);
  const newStock = roundCurrency(
    data.direction === "in" ? oldStock + quantity : oldStock - quantity,
  );
  const date = new Date().toISOString();
  const reason = data.reason?.trim() || "Adjustment";

  await db.transaction("rw", db.products, db.productLogs, async () => {
    await db.products.update(product.id, {
      quantity: newStock,
    });

    await db.productLogs.add(
      buildProductLog({
        product,
        quantity,
        quantityUnit,
        type: data.direction,
        price,
        oldStock,
        newStock,
        reason,
        expiry: data.expiry || product.expiry,
        date,
        note: data.note?.trim() || undefined,
        transaction: normalizeTransactionMetadata(
          {
            date,
            notes: data.note?.trim() || undefined,
          },
          {
            transactionType: "stock-adjustment",
            amount: price * quantity,
          },
        ),
      }),
    );
  });

  await ensureCloudSync("Stock adjustment");
  return "product-stock-adjusted";
}

export async function deleteProductWithLogs(productId: string) {
  const product = await db.products.get(productId);
  if (!product) throw new Error("Product not found");

  await db.transaction("rw", db.products, db.productLogs, async () => {
    await db.productLogs.where("productId").equals(productId).delete();
    await db.products.delete(productId);
  });

  await ensureCloudSync("Product deletion");
  return "product-deleted";
}

export async function updateProductLog(data: UpdateProductLogInput) {
  const log = await db.productLogs.get(data.logId);
  if (!log) throw new Error("History entry not found");

  const product = await db.products.get(log.productId);
  if (!product) throw new Error("Related product not found");

  const nextType =
    data.type || log.type || (log.quantityAdded < 0 ? "out" : "in");
  const nextQuantity = Number(data.quantity);
  const nextPrice = Number(data.price || 0);
  const quantityUnit = normalizeQuantityUnit(
    data.quantityUnit || log.quantityUnit || product.quantityUnit,
  );

  if (!Number.isFinite(nextQuantity) || nextQuantity <= 0)
    throw new Error("Quantity should be greater than 0");
  if (!Number.isFinite(nextPrice) || nextPrice < 0)
    throw new Error("Price cannot be negative");

  const nextSignedQuantity = nextType === "out" ? -nextQuantity : nextQuantity;
  const nextProductQuantity = roundCurrency(
    product.quantity - log.quantityAdded + nextSignedQuantity,
  );

  if (nextProductQuantity < 0)
    throw new Error("Correction would make stock negative");

  const now = new Date().toISOString();
  const updatedTransaction = normalizeTransactionMetadata(
    {
      transactionId: log.transactionId || createTransactionId("CORR"),
      transactionType: "stock-correction",
      products: log.products,
      invoiceReceiptNo: log.invoiceReceiptNo,
      paymentMode: log.paymentMode,
      paymentStatus: log.paymentStatus,
      gstRate: log.gstRate,
      taxableAmount: log.taxableAmount,
      cgstAmount: log.cgstAmount,
      sgstAmount: log.sgstAmount,
      igstAmount: log.igstAmount,
      gstAmount: log.gstAmount,
      notes: data.note?.trim() || log.notes,
      date: data.date || log.date,
    },
    {
      transactionType: "stock-correction",
      amount: nextPrice * nextQuantity,
    },
  );

  await db.transaction("rw", db.products, db.productLogs, async () => {
    await db.products.update(product.id, {
      quantity: nextProductQuantity,
    });

    await db.productLogs.update(log.id, {
      productName: log.productName || product.name,
      productCategory: log.productCategory || product.category,
      productSku: log.productSku || product.sku,
      productHsnCode: log.productHsnCode || product.hsnCode,
      quantityAdded: nextSignedQuantity,
      quantity: nextQuantity,
      quantityUnit,
      oldStock: log.oldStock,
      newStock: nextProductQuantity,
      type: nextType,
      reason:
        nextType === "out" ? data.reason || log.reason || "Sold" : undefined,
      price: nextPrice,
      amount: roundCurrency(nextPrice * nextQuantity),
      taxableAmount: updatedTransaction.taxableAmount,
      gstRate: updatedTransaction.gstRate,
      cgstAmount: updatedTransaction.cgstAmount,
      sgstAmount: updatedTransaction.sgstAmount,
      igstAmount: updatedTransaction.igstAmount,
      gstAmount: updatedTransaction.gstAmount,
      expiry: data.expiry || undefined,
      date: data.date || log.date,
      transactionId: updatedTransaction.transactionId,
      transactionType: updatedTransaction.transactionType,
      invoiceReceiptNo: updatedTransaction.invoiceReceiptNo,
      paymentMode: updatedTransaction.paymentMode,
      paymentStatus: updatedTransaction.paymentStatus,
      products: updatedTransaction.products,
      correctedAt: now,
      correctionLabel: "corrected",
      note:
        nextType === "out"
          ? buildSaleLogNote({
              buyerName: data.buyerName,
              buyerPhone: data.buyerPhone,
              buyerGstin: data.buyerGstin,
              note: data.note,
            })
          : data.note?.trim() || undefined,
      notes: data.note?.trim() || undefined,
    });
  });

  await ensureCloudSync("History correction");
  return "log-updated";
}

export async function deleteProductLog(logId: string) {
  const log = await db.productLogs.get(logId);
  if (!log) throw new Error("History entry not found");

  const product = await db.products.get(log.productId);
  if (!product) throw new Error("Related product not found");

  const nextProductQuantity = roundCurrency(
    product.quantity - log.quantityAdded,
  );
  if (nextProductQuantity < 0)
    throw new Error(
      "Cannot delete this entry because stock would become negative",
    );

  await db.transaction("rw", db.products, db.productLogs, async () => {
    await db.products.update(product.id, {
      quantity: nextProductQuantity,
    });
    await db.productLogs.delete(log.id);
  });

  await ensureCloudSync("History deletion");
  return "log-deleted";
}

export async function getProducts(userId: string): Promise<Product[]> {
  return await db.products.where("userId").equals(userId).toArray();
}

export async function getProductLogs(productId: string) {
  return await db.productLogs
    .where("productId")
    .equals(productId)
    .reverse()
    .toArray();
}

export async function getProductLogsByProductIds(
  productIds: string[],
): Promise<Map<string, ProductLog[]>> {
  const uniqueProductIds = Array.from(new Set(productIds.filter(Boolean)));
  const logsByProduct = new Map<string, ProductLog[]>();

  uniqueProductIds.forEach((productId) => logsByProduct.set(productId, []));
  if (!uniqueProductIds.length) return logsByProduct;

  const logs = await db.productLogs
    .where("productId")
    .anyOf(uniqueProductIds)
    .toArray();

  logs.forEach((log) => {
    const current = logsByProduct.get(log.productId) || [];
    current.push(log);
    logsByProduct.set(log.productId, current);
  });

  logsByProduct.forEach((productLogs, productId) => {
    logsByProduct.set(
      productId,
      productLogs.sort((left, right) => right.date.localeCompare(left.date)),
    );
  });

  return logsByProduct;
}

export async function getProductExpiryBatches(productId: string) {
  const logs = await db.productLogs
    .where("productId")
    .equals(productId)
    .toArray();
  const batchMap = new Map<string, number>();

  for (const log of logs) {
    if (!log.expiry) continue;
    const current = batchMap.get(log.expiry) || 0;
    batchMap.set(log.expiry, current + Number(log.quantityAdded));
  }

  return Array.from(batchMap.entries())
    .map(([expiry, quantity]) => ({
      expiry,
      quantity: Math.max(0, roundCurrency(quantity)),
    }))
    .filter((batch) => batch.quantity > 0)
    .sort(
      (left, right) =>
        new Date(left.expiry).getTime() - new Date(right.expiry).getTime(),
    );
}

async function findProductByIdentity(
  userId: string,
  name: string,
  category: string,
  quantityUnit: string,
) {
  return (
    (await db.products
      .where("[userId+name+category+quantityUnit]")
      .equals([userId, name, category, quantityUnit])
      .first()) ||
    (await db.products
      .where("userId")
      .equals(userId)
      .filter(
        (product) =>
          product.name === name &&
          (product.category || "") === category &&
          normalizeQuantityUnit(product.quantityUnit) === quantityUnit,
      )
      .first())
  );
}

function buildProductLog({
  product,
  quantity,
  quantityUnit,
  type,
  price,
  oldStock,
  newStock,
  reason,
  expiry,
  date,
  note,
  transaction,
}: {
  product: Product;
  quantity: number;
  quantityUnit: string;
  type: "in" | "out";
  price: number;
  oldStock: number;
  newStock: number;
  reason?: string;
  expiry?: string;
  date: string;
  note?: string;
  transaction: Required<
    Pick<StockTransactionMetadata, "transactionId" | "transactionType">
  > &
    StockTransactionMetadata;
}): ProductLog {
  const amount = roundCurrency(transaction.amount ?? price * quantity);
  const currentProductSnapshot: StockTransactionProduct = {
    productId: product.id,
    name: product.name,
    category: product.category,
    sku: product.sku,
    hsnCode: product.hsnCode,
    quantity,
    quantityUnit,
    oldStock,
    newStock,
    rate: price,
    amount,
    gstRate: roundOptional(transaction.gstRate),
    gstAmount: roundOptional(transaction.gstAmount),
  };
  const transactionProducts = transaction.products?.length
    ? transaction.products.map((item) => {
        const matchesCurrentProduct =
          item.productId === product.id ||
          (!item.productId &&
            item.name === product.name &&
            item.quantity === quantity &&
            item.rate === price);

        return matchesCurrentProduct
          ? {
              ...item,
              productId: item.productId || product.id,
              oldStock: item.oldStock ?? oldStock,
              newStock: item.newStock ?? newStock,
              gstRate: item.gstRate ?? roundOptional(transaction.gstRate),
              gstAmount: item.gstAmount ?? roundOptional(transaction.gstAmount),
            }
          : item;
      })
    : [currentProductSnapshot];

  return {
    id: uuidv4(),
    productId: product.id,
    productName: product.name,
    productCategory: product.category,
    productSku: product.sku,
    productHsnCode: product.hsnCode,
    quantityAdded: type === "out" ? -quantity : quantity,
    quantity,
    quantityUnit,
    oldStock,
    newStock,
    type,
    reason,
    price,
    amount,
    taxableAmount: roundOptional(transaction.taxableAmount),
    gstRate: roundOptional(transaction.gstRate),
    cgstAmount: roundOptional(transaction.cgstAmount),
    sgstAmount: roundOptional(transaction.sgstAmount),
    igstAmount: roundOptional(transaction.igstAmount),
    gstAmount: roundOptional(transaction.gstAmount),
    expiry,
    date,
    transactionId: transaction.transactionId,
    transactionType: transaction.transactionType,
    invoiceReceiptNo: transaction.invoiceReceiptNo,
    paymentMode: transaction.paymentMode,
    paymentStatus: transaction.paymentStatus,
    products: transactionProducts,
    note,
    notes: transaction.notes,
  };
}

function normalizeTransactionMetadata(
  transaction: StockTransactionMetadata | undefined,
  fallback: { transactionType: StockTransactionType; amount: number },
): Required<
  Pick<StockTransactionMetadata, "transactionId" | "transactionType">
> &
  StockTransactionMetadata {
  return {
    ...transaction,
    transactionId:
      transaction?.transactionId ||
      createTransactionId(
        transactionPrefix(
          transaction?.transactionType || fallback.transactionType,
        ),
      ),
    transactionType: transaction?.transactionType || fallback.transactionType,
    amount: roundCurrency(transaction?.amount ?? fallback.amount),
    gstAmount: roundCurrency(transaction?.gstAmount || 0),
  };
}

function createTransactionId(prefix: string) {
  return `${prefix}-${Date.now()}-${uuidv4().slice(0, 8)}`;
}

function transactionPrefix(type: StockTransactionType) {
  if (type === "purchase") return "PUR";
  if (type === "quick-purchase") return "QP";
  if (type === "sale" || type === "multi-item-sale") return "SALE";
  if (type === "stock-correction") return "CORR";
  if (type === "stock-adjustment") return "ADJ";
  return "STK";
}

function mergeNotes(...parts: Array<string | undefined>) {
  return (
    parts
      .map((part) => part?.trim())
      .filter(Boolean)
      .join(" | ") || undefined
  );
}

function roundOptional(value: number | undefined) {
  return value === undefined ? undefined : roundCurrency(value);
}
