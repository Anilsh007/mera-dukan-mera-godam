// ---------------------------------------------------------------
// All GST-related types + helper functions.
// Export EVERYTHING that other modules need.
// ---------------------------------------------------------------
import { calculateGstBreakup, roundCurrency } from "@/app/lib/gst.utils";
export interface GSTInvoiceParty {
  name: string;
  gstin?: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  email?: string;
  logoUrl?: string;
}

export interface GSTInvoiceAddress {
  address: string;
  city: string;
  state: string;
  pincode: string;
}

/* ----------------------------------------------------------- */
export interface GSTInvoiceItem {
  name: string;
  description: string;
  category?: string;
  hsnCode: string;
  hsnSacType?: "HSN" | "SAC";
  hsnSacDescription?: string;
  gstCondition?: string;
  quantity: number;
  unit: string;
  discount: number;
  expiry: string;
  rate: number;
  gstRate: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  total: number;
}

/* ----------------------------------------------------------- */
export interface GSTInvoiceTotals {
  taxableValue: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  amountInWords: string;
}

/* ----------------------------------------------------------- */
export interface GSTInvoice {
  invoiceNo: string;
  invoiceDate: string;
  dueDate?: string;
  seller: GSTInvoiceParty;
  buyer: GSTInvoiceParty;
  shippingSameAsBilling: boolean;
  shippingAddress: GSTInvoiceAddress;
  items: GSTInvoiceItem[];
  totals: GSTInvoiceTotals;
  bankDetails?: {
    accountName: string;
    accountNo: string;
    ifsc: string;
    bankName: string;
  };
  terms?: string;
  notes?: string;
}

/* ----------------------------------------------------------- */
export interface GSTInvoiceRecord extends GSTInvoice {
  id: string;
  userId: string;
  buyerName: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: "pending" | "synced" | "failed";
}

export type ProductSuggestion = {
  label: string;
  value: string;
  category: string;
  price?: number;
  unit?: string;
};

/* ----------------------------------------------------------- */
/* Helper functions – they can stay in the same file or be
   moved to a separate utils file; the important thing is that
   they are **exported**. */
export function createEmptyInvoiceItem(): GSTInvoiceItem {
  return {
    name: "",
    description: "",
    hsnCode: "",
    hsnSacType: undefined,
    hsnSacDescription: "",
    gstCondition: "",
    quantity: 1,
    unit: "pcs",
    rate: 0,
    discount: 0,
    expiry: "",
    gstRate: 18,
    taxableValue: 0,
    cgstRate: 9,
    cgstAmount: 0,
    sgstRate: 9,
    sgstAmount: 0,
    igstRate: 18,
    igstAmount: 0,
    total: 0,
  };
}

/* ----------------------------------------------------------- */
export function createEmptyInvoice(): GSTInvoice {
  return {
    invoiceNo: "",
    invoiceDate: "",
    dueDate: "",
    seller: {
      name: "",
      gstin: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      email: "",
    },
    buyer: {
      name: "",
      gstin: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      phone: "",
      email: "",
    },
    shippingSameAsBilling: true,
    shippingAddress: {
      address: "",
      city: "",
      state: "",
      pincode: "",
    },
    items: [createEmptyInvoiceItem()],
    totals: createEmptyTotals(),
    bankDetails: {
      accountName: "",
      accountNo: "",
      ifsc: "",
      bankName: "",
    },
    terms: "",
    notes: "",
  };
}

/* ----------------------------------------------------------- */
export function createEmptyTotals(): GSTInvoiceTotals {
  return {
    taxableValue: 0,
    cgstTotal: 0,
    sgstTotal: 0,
    igstTotal: 0,
    grandTotal: 0,
    amountInWords: "Zero Only",
  };
}

/* -----------------------------------------------------------
   Any other math helpers you already have (calculateGST,
   roundToTwo, numberToWords, etc.) should also be exported
   from this file or from a separate `utils.ts` imported by
   this file.  Keep the exports consistent.
   ----------------------------------------------------------- */
export const roundToTwo = roundCurrency;

// -----------------------------------------------------------
// Convert a numeric amount (e.g. 12345) to the Indian‑style
// wording used on GST invoices: “Twelve Thousand Three Hundred
// Forty‑Five Only”.
// -----------------------------------------------------------
export const numberToWords = (num: number): string => {
  if (num === 0) return "Zero Only";

  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine"
  ];
  const teens = [
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen",
    "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty",
    "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  // Helper that converts numbers < 100 to words
  const twoDigits = (n: number): string => {
    if (n < 10) return ones[n];
    if (n < 20) return teens[n - 10];
    const ten = Math.floor(n / 10);
    const unit = n % 10;
    return tens[ten] + (unit ? ` ${ones[unit]}` : "");
  };

  // Helper for numbers up to 99 99 999 (i.e. < 1 crore)
  const threeDigits = (n: number): string => {
    const hundred = Math.floor(n / 100);
    const rest = n % 100;
    const hundPart = hundred ? `${ones[hundred]} Hundred` : "";
    const restPart = rest ? twoDigits(rest) : "";
    return [hundPart, restPart].filter(Boolean).join(" ");
  };

  // Break the number into Indian‑style groups
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = num % 1000; // last three digits

  const parts: string[] = [];

  if (crore) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${threeDigits(thousand)} Thousand`);
  if (remainder) parts.push(threeDigits(remainder));

  // Join with spaces, add “Only” at the end
  return `${parts.join(" ")} Only`.trim();
};


export const calculateGST = (
  gstRate: number,
  quantity: number,
  price: number,
  discount: number,
  isInterState: boolean,
  rates?: {
    cgstRate?: number
    sgstRate?: number
    igstRate?: number
  }
) => {
  const result = calculateGstBreakup({
    gstRate,
    quantity,
    rate: price,
    discount,
    isInterState,
    cgstRate: rates?.cgstRate,
    sgstRate: rates?.sgstRate,
    igstRate: rates?.igstRate,
  })

  return {
    taxableValue: result.taxableAmount,
    cgst: result.cgstAmount,
    sgst: result.sgstAmount,
    igst: result.igstAmount,
    total: result.grandTotal,
  }
}

/* -----------------------------------------------------------
   buildInvoiceTotals – now uses the exported ZERO_TOTALS.
   ----------------------------------------------------------- */
export const ZERO_TOTALS: GSTInvoiceTotals = {
  taxableValue: 0,
  cgstTotal: 0,
  sgstTotal: 0,
  igstTotal: 0,
  grandTotal: 0,
  amountInWords: "Zero Only",
};

export function buildInvoiceTotals(items: GSTInvoiceItem[]): GSTInvoiceTotals {
  const totals = items.reduce(
    (acc, item) => {
      acc.taxableValue += item.taxableValue;
      acc.cgstTotal += item.cgstAmount;
      acc.sgstTotal += item.sgstAmount;
      acc.igstTotal += item.igstAmount;
      acc.grandTotal += item.total;
      return acc;
    },
    { ...ZERO_TOTALS }
  );

  const roundedGrandTotal = roundToTwo(totals.grandTotal);

  return {
    taxableValue: roundToTwo(totals.taxableValue),
    cgstTotal: roundToTwo(totals.cgstTotal),
    sgstTotal: roundToTwo(totals.sgstTotal),
    igstTotal: roundToTwo(totals.igstTotal),
    grandTotal: roundedGrandTotal,
    amountInWords: numberToWords(Math.round(roundedGrandTotal)),
  };
}
