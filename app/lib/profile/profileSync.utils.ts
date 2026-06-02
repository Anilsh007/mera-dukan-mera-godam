import type { ProfileState } from "@/app/dashboard/profile/useProfile"

export function stripProfileMeta(profile: ProfileState): Omit<ProfileState, "userId" | "updatedAt"> {
  const { userId: _userId, updatedAt: _updatedAt, ...profileData } = profile
  return profileData
}
