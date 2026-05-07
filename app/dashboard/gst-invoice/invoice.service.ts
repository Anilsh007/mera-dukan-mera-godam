"use client";

import { v4 as uuidv4 } from "uuid";
import { auth } from "@/app/lib/firebase";
import { db } from "@/app/lib/db";
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity";
import type { ProfileState } from "@/app/dashboard/profile/useProfile";
import type { GSTInvoice, GSTInvoiceRecord } from "./types/gst.types";

/* -------------------------------------------------
   ONE‑STOP USER‑ID getter – throws if no user
   ------------------------------------------------- */
function requireUserId(userId?: string): string {
  const uid = userId ?? getCurrentUserId();
  if (!uid) throw new Error("User not authenticated");
  return uid;
}

/* -------------------------------------------------
   PUBLIC SERVICE FUNCTIONS
   ------------------------------------------------- */
export async function loadInvoicesFromDb(userId?: string): Promise<GSTInvoiceRecord[]> {
  const resolvedUserId = requireUserId(userId);
  const invoices = await db.invoices.where("userId").equals(resolvedUserId).toArray();
  return invoices.sort((l, r) => r.invoiceDate.localeCompare(l.invoiceDate));
}

export async function saveInvoiceToDb(invoice: GSTInvoice, userId?: string): Promise<GSTInvoiceRecord> {
  const resolvedUserId = requireUserId(userId);
  const now = new Date().toISOString();

  const existing = await db.invoices
    .where("[userId+invoiceNo]")
    .equals([resolvedUserId, invoice.invoiceNo])
    .first();

  const record: GSTInvoiceRecord = {
    id: existing?.id || uuidv4(),
    userId: resolvedUserId,
    buyerName: invoice.buyer.name.trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    ...invoice,
  };

  await db.invoices.put(record);
  return record;
}

/* -------------------------------------------------
   OTHER helpers (supabase, builders, etc.)
   ------------------------------------------------- */
export async function loadInvoicesFromSupabase(): Promise<GSTInvoiceRecord[]> {
  const token = await getFirebaseIdToken();
  if (!token) return [];

  const response = await fetch("/api/invoices", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await readApiError(response);
    console.error("Invoice load error:", error);
    return [];
  }

  return (await response.json()) as GSTInvoiceRecord[];
}

export async function saveInvoiceToSupabase(invoice: GSTInvoiceRecord): Promise<GSTInvoiceRecord> {
  const token = await getFirebaseIdToken();
  if (!token) throw new Error("User not authenticated");

  const response = await fetch("/api/invoices", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(invoice),
  });

  if (!response.ok) {
    const error = await readApiError(response);
    console.error("Invoice save error:", error);
    throw error;
  }

  return (await response.json()) as GSTInvoiceRecord;
}

/* -------------------------------------------------
   BUILDERS – these must stay **exported**
   ------------------------------------------------- */
export function buildSellerFromProfile(profile: ProfileState) {
  return {
    name: profile.business.shopName || profile.personal.displayName || "",
    gstin: profile.business.gstNumber || "",
    address: profile.address.address || "",
    city: profile.address.district || "",
    state: profile.address.state || "",
    pincode: profile.address.pincode || "",
    phone: profile.personal.phone || "",
    email: profile.personal.email || "",
    logoUrl: profile.business.logoUrl || "",
  };
}

/* ← NEW – exported now */
export function buildBankDetailsFromProfile(profile: ProfileState) {
  return {
    accountName: profile.banking.accountHolderName || "",
    accountNo: profile.banking.accountNumber || "",
    ifsc: profile.banking.ifscCode || "",
    bankName: profile.banking.bankName || "",
  };
}

export function buildInvoiceNumber(profile: ProfileState, invoices: GSTInvoiceRecord[]) {
  const prefix = (profile.business.invoicePrefix || "INV").trim() || "INV";
  const nextNumber = invoices.length + 1;
  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
}

/* -------------------------------------------------
   PRIVATE helpers (auth, API error handling)
   ------------------------------------------------- */
function getCurrentUserId() {
  const user = auth.currentUser;
  if (!user) return null;
  return requireUserIdentityFromAuthUser(user);
}

async function getFirebaseIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}

async function readApiError(response: Response) {
  try {
    return await response.json();
  } catch {
    return { message: `Invoice API request failed with status ${response.status}` };
  }
}
