import type { User } from "firebase/auth"
import { db } from "./db"
import { getUserIdentityFromAuthUser } from "./userIdentity"

export async function migrateLocalUserData(user: User) {
  const emailIdentity = getUserIdentityFromAuthUser(user)
  if (!emailIdentity || emailIdentity === user.uid) return

  await db.transaction(
    "rw",
    [
      db.products,
      db.profiles,
      db.invoices,
      db.purchases,
      db.sales,
      db.estimates,
      db.returnDocuments,
      db.expenses,
      db.cashbookEntries,
      db.inventoryLocations,
      db.productLocationStocks,
      db.inventoryBatches,
      db.stockTransfers,
      db.parties,
      db.partyLedger,
      db.subscriptions,
      db.usageTracking,
      db.syncTombstones,
    ],
    async () => {
      await Promise.all([
        migrateUserIdField(db.products, user.uid, emailIdentity),
        migrateUserIdField(db.invoices, user.uid, emailIdentity),
        migrateUserIdField(db.purchases, user.uid, emailIdentity),
        migrateUserIdField(db.sales, user.uid, emailIdentity),
        migrateUserIdField(db.estimates, user.uid, emailIdentity),
        migrateUserIdField(db.returnDocuments, user.uid, emailIdentity),
        migrateUserIdField(db.expenses, user.uid, emailIdentity),
        migrateUserIdField(db.cashbookEntries, user.uid, emailIdentity),
        migrateUserIdField(db.inventoryLocations, user.uid, emailIdentity),
        migrateUserIdField(db.productLocationStocks, user.uid, emailIdentity),
        migrateUserIdField(db.inventoryBatches, user.uid, emailIdentity),
        migrateUserIdField(db.stockTransfers, user.uid, emailIdentity),
        migrateUserIdField(db.parties, user.uid, emailIdentity),
        migrateUserIdField(db.partyLedger, user.uid, emailIdentity),
        migrateUserIdField(db.subscriptions, user.uid, emailIdentity),
        migrateUserIdField(db.usageTracking, user.uid, emailIdentity),
        migrateUserIdField(db.syncTombstones, user.uid, emailIdentity),
      ])

      const legacyProfile = await db.profiles.get(user.uid)
      if (legacyProfile) {
        await db.profiles.put({
          ...legacyProfile,
          userId: emailIdentity,
        })

        await db.profiles.delete(user.uid)
      }
    },
  )
}

async function migrateUserIdField<T extends { userId?: string }>(
  table: { where: (index: string) => { equals: (value: string) => { toArray: () => Promise<T[]> } }; update: (key: string, changes: Partial<T>) => Promise<unknown> },
  legacyUserId: string,
  nextUserId: string,
) {
  const records = await table.where("userId").equals(legacyUserId).toArray()
  for (const record of records) {
    const key = (record as { id?: string }).id
    if (!key) continue
    await table.update(key, { userId: nextUserId } as Partial<T>)
  }
}
