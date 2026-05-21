"use client";

import { v4 as uuidv4 } from "uuid";
import { auth } from "@/app/lib/firebase";
import { db } from "@/app/lib/db";
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity";
import type { ProfileState } from "@/app/dashboard/profile/useProfile";
import type { GSTInvoice, GSTInvoiceRecord } from "./types/gst.types";
import { en } from "@/app/messages/en";
import { assertFeatureAccess, incrementUsage } from "@/app/lib/subscription/subscription.service";

function requireUserId(userId?: string): string {
  const uid = userId ?? getCurrentUserId();
  if (!uid) throw new Error(en.profile.signInRequired);
  return uid;
}

export async function loadInvoicesFromDb(userId?: string): Promise<GSTInvoiceRecord[]> {
  const resolvedUserId = requireUserId(userId);
  const invoices = await db.invoices.where("userId").equals(resolvedUserId).toArray();
  return invoices.sort((left, right) => {
    const leftKey = `${left.invoiceDate || ""}-${left.createdAt || ""}`;
    const rightKey = `${right.invoiceDate || ""}-${right.createdAt || ""}`;
    return rightKey.localeCompare(leftKey);
  });
}

export async function saveInvoiceToDb(invoice: GSTInvoice, userId?: string, syncStatus?: GSTInvoiceRecord["syncStatus"]): Promise<GSTInvoiceRecord> {
  const resolvedUserId = requireUserId(userId);
  const now = new Date().toISOString();
  const existingRecordId =
    typeof invoice === "object" && invoice && "id" in invoice && typeof invoice.id === "string"
      ? invoice.id
      : null;

  await assertFeatureAccess(resolvedUserId, "gstInvoices", {
    operation: existingRecordId ? "update" : "create",
    incrementBy: existingRecordId ? 0 : 1,
  })

  const existingWithInvoiceNo = await db.invoices
    .where("[userId+invoiceNo]")
    .equals([resolvedUserId, invoice.invoiceNo])
    .first();

  if (existingWithInvoiceNo && existingRecordId && existingWithInvoiceNo.id !== existingRecordId) {
    throw new Error(en.gstInvoice.duplicateInvoiceNumber);
  }

  if (existingWithInvoiceNo && !existingRecordId) {
    throw new Error(en.gstInvoice.invoiceNumberExists);
  }

  const record: GSTInvoiceRecord = {
    id: existingRecordId || existingWithInvoiceNo?.id || uuidv4(),
    userId: resolvedUserId,
    buyerName: invoice.buyer.name.trim(),
    createdAt:
      existingRecordId && existingWithInvoiceNo?.id === existingRecordId
        ? existingWithInvoiceNo.createdAt
        : existingWithInvoiceNo?.createdAt || now,
    updatedAt: now,
    syncStatus: syncStatus || ("syncStatus" in invoice ? (invoice as GSTInvoiceRecord).syncStatus : undefined),
    ...invoice,
  };

  await db.invoices.put(record);
  if (!existingRecordId) {
    await incrementUsage(resolvedUserId, "gstInvoices")
  }
  return record;
}

export async function loadInvoicesFromSupabase(): Promise<GSTInvoiceRecord[]> {
  const token = await getFirebaseIdToken();
  if (!token) return [];

  const response = await fetch("/api/invoices", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    const error = await readApiError(response);
    throw error;
  }

  return (await response.json()) as GSTInvoiceRecord[];
}

export async function saveInvoiceToSupabase(invoice: GSTInvoiceRecord): Promise<GSTInvoiceRecord> {
  const token = await getFirebaseIdToken();
  if (!token) throw new Error(en.profile.signInRequired);

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
    throw error;
  }

  return (await response.json()) as GSTInvoiceRecord;
}

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
  const prefixPattern = new RegExp(`^${escapeRegex(prefix)}-(\\d+)$`);

  const highestNumber = invoices.reduce((max, invoice) => {
    const match = invoice.invoiceNo?.match(prefixPattern);
    if (!match) return max;

    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);

  return `${prefix}-${String(highestNumber + 1).padStart(4, "0")}`;
}

function getCurrentUserId() {
  const user = auth?.currentUser;
  if (!user) return null;
  return requireUserIdentityFromAuthUser(user);
}

async function getFirebaseIdToken() {
  const user = auth?.currentUser;
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

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
