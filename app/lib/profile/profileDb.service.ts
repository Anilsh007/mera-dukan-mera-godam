import { auth } from "../firebase";
import { db } from "../db";
import type { ProfileData } from "./profile.service";
import { getUserIdentityFromAuthUser } from "../userIdentity";
import { en } from "@/app/messages/en";

export async function loadProfileFromDb(userId?: string): Promise<ProfileData | null> {
  const resolvedUserId = userId || getUserIdentityFromAuthUser(auth?.currentUser);
  if (!resolvedUserId) return null;

  const data = await db.profiles.get(resolvedUserId);
  return (data as ProfileData) || null;
}

export async function saveProfileToDb(
  profileData: Omit<ProfileData, "userId" | "updatedAt">,
  userId?: string
): Promise<ProfileData> {
  const resolvedUserId = userId || getUserIdentityFromAuthUser(auth?.currentUser);
  if (!resolvedUserId) throw new Error(en.profile.signInRequired);

  const fullData: ProfileData = {
    ...profileData,
    userId: resolvedUserId,
    updatedAt: new Date().toISOString(),
  };

  await db.profiles.put(fullData);
  return fullData;
}

export async function deleteProfileFromDb(userId?: string): Promise<void> {
  const resolvedUserId = userId || getUserIdentityFromAuthUser(auth?.currentUser);
  if (!resolvedUserId) throw new Error(en.profile.signInRequired);

  await db.profiles.delete(resolvedUserId);
}
