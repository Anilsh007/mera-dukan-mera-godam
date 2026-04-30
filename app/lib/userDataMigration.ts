import type { User } from "firebase/auth"
import { db } from "./db"
import { getUserIdentityFromAuthUser } from "./userIdentity"

export async function migrateLocalUserData(user: User) {
  const emailIdentity = getUserIdentityFromAuthUser(user)
  if (!emailIdentity || emailIdentity === user.uid) return

  await db.transaction("rw", db.products, db.profiles, async () => {
    const legacyProducts = await db.products.where("userId").equals(user.uid).toArray()

    for (const product of legacyProducts) {
      await db.products.update(product.id, { userId: emailIdentity })
    }

    const legacyProfile = await db.profiles.get(user.uid)
    if (legacyProfile) {
      await db.profiles.put({
        ...legacyProfile,
        userId: emailIdentity,
      })

      await db.profiles.delete(user.uid)
    }
  })
}
