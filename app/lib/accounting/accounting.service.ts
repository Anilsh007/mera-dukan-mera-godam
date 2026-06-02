"use client"

import { v4 as uuidv4 } from "uuid"
import { db, type CashbookAccount, type CashbookEntryRecord, type CashbookEntryType, type ExpenseCategory, type ExpenseRecord } from "@/app/lib/db"
import { assertFeatureAccess, incrementUsage } from "@/app/lib/subscription/subscription.service"
import { requestSupabaseSync } from "@/app/lib/persistence/supabaseSyncTrigger"
import { requirePositiveNumber, trimOrUndefined } from "@/app/lib/normalization.utils"
import { en } from "@/app/messages/en"
import { buildCashbookNumber, buildExpenseNumber, EXPENSE_CATEGORIES, CASHBOOK_ACCOUNTS, roundAccounting } from "./accounting.utils"
import { clearRecordDeleted, markRecordDeleted } from "@/app/lib/persistence/syncTombstone.service"
import { runWithCrudBusy } from "@/app/lib/crudBusy"

export type SaveExpenseInput = {
  userId: string
  expenseNo?: string
  category: ExpenseCategory
  amount: number
  expenseDate: string
  expenseDateTime?: string
  paymentMode: string
  note?: string
  reference?: string
}

export type SaveCashbookEntryInput = {
  userId: string
  entryNo?: string
  entryDate: string
  entryDateTime?: string
  type: CashbookEntryType
  account: CashbookAccount
  amount: number
  paymentMode?: string
  note: string
  reference?: string
}

export async function loadExpenses(userId: string) {
  const expenses = await db.expenses.where("userId").equals(userId).toArray()
  return expenses.sort((left, right) => right.expenseDateTime.localeCompare(left.expenseDateTime))
}

export async function loadCashbookEntries(userId: string) {
  const entries = await db.cashbookEntries.where("userId").equals(userId).toArray()
  return entries.sort((left, right) => right.entryDateTime.localeCompare(left.entryDateTime))
}

export async function saveExpense(input: SaveExpenseInput) {
  return runWithCrudBusy("Saving expense", async () => {
    await assertFeatureAccess(input.userId, "accounting", { operation: "create", incrementBy: 1 })
    const amount = requirePositiveNumber(input.amount, en.accounting.amountRequired)
    const category = input.category
    const expenseDate = input.expenseDate || new Date().toISOString().slice(0, 10)
    const expenseDateTime = input.expenseDateTime || `${expenseDate}T${new Date().toTimeString().slice(0, 8)}`
    const paymentMode = trimOrUndefined(input.paymentMode)
    const expenseNo = input.expenseNo?.trim() || buildExpenseNumber()

    if (!EXPENSE_CATEGORIES.includes(category)) throw new Error(en.accounting.categoryRequired)
    if (!paymentMode) throw new Error(en.accounting.paymentModeRequired)

    const duplicate = await db.expenses.where("[userId+expenseNo]").equals([input.userId, expenseNo]).first()
    if (duplicate) throw new Error(en.accounting.duplicateExpenseNo)

    const now = new Date().toISOString()
    const record: ExpenseRecord = {
      id: uuidv4(),
      userId: input.userId,
      expenseNo,
      category,
      amount: roundAccounting(amount),
      expenseDate,
      expenseDateTime,
      paymentMode,
      reference: input.reference?.trim() || undefined,
      note: input.note?.trim() || undefined,
      receiptAttachmentStatus: "placeholder",
      createdAt: now,
      updatedAt: now,
    }

    await db.expenses.add(record)
    await requestSupabaseSync("expense")
    await incrementUsage(input.userId, "accounting")
    return record
  })
}

export async function updateExpense(
  expenseId: string,
  input: SaveExpenseInput,
) {
  return runWithCrudBusy("Updating expense", async () => {
    await assertFeatureAccess(input.userId, "accounting", { operation: "update" })
    const existing = await db.expenses.get(expenseId)
    if (!existing || existing.userId !== input.userId) throw new Error(en.accounting.expenseSaveFailed)

    const amount = requirePositiveNumber(input.amount, en.accounting.amountRequired)
    const category = input.category
    const expenseDate = input.expenseDate || existing.expenseDate
    const expenseDateTime = input.expenseDateTime || `${expenseDate}T${new Date().toTimeString().slice(0, 8)}`
    const paymentMode = trimOrUndefined(input.paymentMode)
    const expenseNo = input.expenseNo?.trim() || existing.expenseNo

    if (!EXPENSE_CATEGORIES.includes(category)) throw new Error(en.accounting.categoryRequired)
    if (!paymentMode) throw new Error(en.accounting.paymentModeRequired)

    const duplicate = await db.expenses.where("[userId+expenseNo]").equals([input.userId, expenseNo]).first()
    if (duplicate && duplicate.id !== expenseId) throw new Error(en.accounting.duplicateExpenseNo)

    await clearRecordDeleted(input.userId, "expenses", expenseId)
    const updated: ExpenseRecord = {
      ...existing,
      expenseNo,
      category,
      amount: roundAccounting(amount),
      expenseDate,
      expenseDateTime,
      paymentMode,
      reference: input.reference?.trim() || undefined,
      note: input.note?.trim() || undefined,
      updatedAt: new Date().toISOString(),
    }

    await db.expenses.put(updated)
    await requestSupabaseSync("expense update")
    return updated
  })
}

export async function deleteExpense(userId: string, expenseId: string) {
  return runWithCrudBusy("Deleting expense", async () => {
    await assertFeatureAccess(userId, "accounting", { operation: "update" })
    const existing = await db.expenses.get(expenseId)
    if (!existing || existing.userId !== userId) throw new Error(en.accounting.expenseSaveFailed)

    await markRecordDeleted(userId, "expenses", expenseId)
    await db.expenses.delete(expenseId)
    await requestSupabaseSync("expense delete")
  })
}

export async function saveCashbookEntry(input: SaveCashbookEntryInput) {
  return runWithCrudBusy("Saving cashbook entry", async () => {
    await assertFeatureAccess(input.userId, "accounting", { operation: "create", incrementBy: 1 })
    const amount = requirePositiveNumber(input.amount, en.accounting.amountRequired)
    const entryDate = input.entryDate || new Date().toISOString().slice(0, 10)
    const entryDateTime = input.entryDateTime || `${entryDate}T${new Date().toTimeString().slice(0, 8)}`
    const note = trimOrUndefined(input.note)
    const entryNo = input.entryNo?.trim() || buildCashbookNumber()

    if (input.type !== "cash-in" && input.type !== "cash-out") throw new Error(en.accounting.typeRequired)
    if (!CASHBOOK_ACCOUNTS.includes(input.account)) throw new Error(en.accounting.accountRequired)
    if (!note) throw new Error(en.accounting.noteRequired)

    const duplicate = await db.cashbookEntries.where("[userId+entryNo]").equals([input.userId, entryNo]).first()
    if (duplicate) throw new Error(en.accounting.duplicateCashbookNo)

    const now = new Date().toISOString()
    const record: CashbookEntryRecord = {
      id: uuidv4(),
      userId: input.userId,
      entryNo,
      entryDate,
      entryDateTime,
      type: input.type,
      account: input.account,
      amount: roundAccounting(amount),
      paymentMode: input.paymentMode?.trim() || undefined,
      reference: input.reference?.trim() || undefined,
      note,
      source: "manual",
      createdAt: now,
      updatedAt: now,
    }

    await db.cashbookEntries.add(record)
    await requestSupabaseSync("cashbook entry")
    await incrementUsage(input.userId, "accounting")
    return record
  })
}

export async function updateCashbookEntry(
  entryId: string,
  input: SaveCashbookEntryInput,
) {
  return runWithCrudBusy("Updating cashbook entry", async () => {
    await assertFeatureAccess(input.userId, "accounting", { operation: "update" })
    const existing = await db.cashbookEntries.get(entryId)
    if (!existing || existing.userId !== input.userId) throw new Error(en.accounting.cashbookEntrySaveFailed)

    const amount = requirePositiveNumber(input.amount, en.accounting.amountRequired)
    const entryDate = input.entryDate || existing.entryDate
    const entryDateTime = input.entryDateTime || `${entryDate}T${new Date().toTimeString().slice(0, 8)}`
    const note = trimOrUndefined(input.note)
    const entryNo = input.entryNo?.trim() || existing.entryNo

    if (input.type !== "cash-in" && input.type !== "cash-out") throw new Error(en.accounting.typeRequired)
    if (!CASHBOOK_ACCOUNTS.includes(input.account)) throw new Error(en.accounting.accountRequired)
    if (!note) throw new Error(en.accounting.noteRequired)

    const duplicate = await db.cashbookEntries.where("[userId+entryNo]").equals([input.userId, entryNo]).first()
    if (duplicate && duplicate.id !== entryId) throw new Error(en.accounting.duplicateCashbookNo)

    await clearRecordDeleted(input.userId, "cashbookEntries", entryId)
    const updated: CashbookEntryRecord = {
      ...existing,
      entryNo,
      entryDate,
      entryDateTime,
      type: input.type,
      account: input.account,
      amount: roundAccounting(amount),
      paymentMode: input.paymentMode?.trim() || undefined,
      reference: input.reference?.trim() || undefined,
      note,
      updatedAt: new Date().toISOString(),
    }

    await db.cashbookEntries.put(updated)
    await requestSupabaseSync("cashbook entry update")
    return updated
  })
}

export async function deleteCashbookEntry(userId: string, entryId: string) {
  return runWithCrudBusy("Deleting cashbook entry", async () => {
    await assertFeatureAccess(userId, "accounting", { operation: "update" })
    const existing = await db.cashbookEntries.get(entryId)
    if (!existing || existing.userId !== userId) throw new Error(en.accounting.cashbookEntrySaveFailed)

    await markRecordDeleted(userId, "cashbookEntries", entryId)
    await db.cashbookEntries.delete(entryId)
    await requestSupabaseSync("cashbook entry delete")
  })
}
