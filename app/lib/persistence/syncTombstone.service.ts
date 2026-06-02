"use client"

import { db, type SyncEntityName } from "@/app/lib/db"

function buildTombstoneId(userId: string, entity: SyncEntityName, recordId: string) {
  return `${userId}:${entity}:${recordId}`
}

export async function markRecordDeleted(userId: string, entity: SyncEntityName, recordId: string) {
  await db.syncTombstones.put({
    id: buildTombstoneId(userId, entity, recordId),
    userId,
    entity,
    recordId,
    deletedAt: new Date().toISOString(),
  })
}

export async function markRecordsDeleted(userId: string, entity: SyncEntityName, recordIds: string[]) {
  const uniqueRecordIds = Array.from(new Set(recordIds.filter(Boolean)))
  if (!uniqueRecordIds.length) return

  const deletedAt = new Date().toISOString()
  await db.syncTombstones.bulkPut(
    uniqueRecordIds.map((recordId) => ({
      id: buildTombstoneId(userId, entity, recordId),
      userId,
      entity,
      recordId,
      deletedAt,
    })),
  )
}

export async function loadDeletionTombstones(userId: string) {
  return db.syncTombstones.where("userId").equals(userId).toArray()
}

export async function clearDeletionTombstones(ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)))
  if (!uniqueIds.length) return
  await db.syncTombstones.bulkDelete(uniqueIds)
}

export async function clearRecordDeleted(userId: string, entity: SyncEntityName, recordId: string) {
  await db.syncTombstones.delete(buildTombstoneId(userId, entity, recordId))
}
