"use client"

import { useCallback, useEffect, useState } from "react"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/app/lib/firebase"
import { loadProfileFromDb, saveProfileToDb } from "@/app/lib/profile/profileDb.service"
import { loadProfileFromSupabase, saveProfileToSupabase } from "@/app/lib/profile/profileSupabase.service"
import { scheduleProfileSync } from "@/app/lib/profile/profileSyncManager"
import { migrateLocalUserData } from "@/app/lib/userDataMigration"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"

export type ProfileState = {
  personal: {
    displayName: string
    email: string
    photoURL: string
    phone: string
    alternateEmail: string
  }
  business: {
    shopName: string
    gstNumber: string
    businessType: string
    upiId: string
    invoicePrefix: string
    logoUrl?: string
  }
  address: {
    address: string
    district: string
    state: string
    pincode: string
  }
  banking: {
    accountHolderName: string
    accountNumber: string
    ifscCode: string
    bankName: string
  }
  settings: {
    termsAndConditions: string
  }
  userId?: string
  updatedAt?: string
}

export type ProfileSaveResult = {
  profile: ProfileState
  cloudSyncSkipped?: boolean
}

const defaultState: ProfileState = {
  personal: {
    displayName: "",
    email: "",
    photoURL: "",
    phone: "",
    alternateEmail: "",
  },
  business: {
    shopName: "",
    gstNumber: "",
    businessType: "retail",
    upiId: "",
    invoicePrefix: "INV",
    logoUrl: "",
  },
  address: {
    address: "",
    district: "",
    state: "",
    pincode: "",
  },
  banking: {
    accountHolderName: "",
    accountNumber: "",
    ifscCode: "",
    bankName: "",
  },
  settings: {
    termsAndConditions: "Goods once sold will not be taken back or exchanged.",
  },
}

export default function useProfile() {
  const [profile, setProfile] = useState<ProfileState>(defaultState)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let isMounted = true

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!isMounted) return

      if (!user) {
        setProfile(defaultState)
        setLoading(false)
        return
      }

      const userId = requireUserIdentityFromAuthUser(user)
      await migrateLocalUserData(user)

      const firebaseProfile = buildFirebaseProfile(user)
      setProfile(firebaseProfile)

      try {
        const localProfile = await loadProfileFromDb(userId)
        const localMerged = localProfile ? mergeWithFirebaseProfile(localProfile, user) : firebaseProfile

        if (isMounted) {
          setProfile(localMerged)
        }

        const cloudProfile = await loadProfileFromSupabase();

        const latestProfile = getLatestProfile(localProfile, cloudProfile);

        const mergedLatest = mergeWithFirebaseProfile(latestProfile, user);

        if (isMounted) {
          setProfile(mergedLatest);
        }

        if (!localProfile || latestProfile?.updatedAt !== localProfile?.updatedAt) {
          await persistProfileLocally(mergedLatest, userId);
        }
      } catch (error) {
        console.error("Failed to initialize profile:", error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribe()
    }
  }, [])

  const saveProfile = useCallback(async (newData: ProfileState): Promise<ProfileSaveResult> => {
    const user = auth.currentUser
    if (!user) throw new Error("User not authenticated")
    const userId = requireUserIdentityFromAuthUser(user)

    setSaving(true)

    try {
      const mergedProfile = mergeWithFirebaseProfile(newData, user)

      // 1. Save locally
      const savedProfile = await persistProfileLocally(mergedProfile, userId)
      setProfile(savedProfile)

      // 2. Save to Supabase
      try {
        await saveProfileToSupabase(stripProfileMeta(savedProfile))
        return { profile: savedProfile }
      } catch (error) {
        if (isSupabaseRlsError(error)) {
          console.warn("Profile saved locally, but cloud sync is blocked by Supabase RLS.", error)
          return {
            profile: savedProfile,
            cloudSyncSkipped: true,
          }
        }

        throw error
      }
    } catch (error) {
      console.error("Save failed:", error)
      throw error
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    profile,
    loading,
    saving,
    saveProfile,
    setProfile,
  }
}

function buildFirebaseProfile(user: NonNullable<typeof auth.currentUser>): ProfileState {
  const userId = requireUserIdentityFromAuthUser(user)

  return {
    ...defaultState,
    userId,
    personal: {
      ...defaultState.personal,
      displayName: user.displayName || "",
      email: user.email || "",
      photoURL: user.photoURL || "",
    },
  }
}

function mergeWithFirebaseProfile(
  profileData: ProfileState,
  user: NonNullable<typeof auth.currentUser>
): ProfileState {
  const userId = requireUserIdentityFromAuthUser(user)

  return {
    ...defaultState,
    ...profileData,
    userId,
    personal: {
      ...defaultState.personal,
      ...profileData.personal,
      displayName: user.displayName || profileData.personal?.displayName || "",
      email: user.email || profileData.personal?.email || "",
      photoURL: user.photoURL || profileData.personal?.photoURL || "",
    },
  }
}

function getLatestProfile(localProfile: ProfileState | null, cloudProfile: ProfileState | null): ProfileState {
  if (!localProfile && !cloudProfile) return defaultState;

  if (!localProfile) return cloudProfile!;
  if (!cloudProfile) return localProfile;

  const localTime = localProfile.updatedAt ? new Date(localProfile.updatedAt).getTime() : 0;
  const cloudTime = cloudProfile.updatedAt ? new Date(cloudProfile.updatedAt).getTime() : 0;

  return cloudTime >= localTime ? cloudProfile : localProfile;
}

function stripProfileMeta(profile: ProfileState): Omit<ProfileState, "userId" | "updatedAt"> {
  const { userId, updatedAt, ...rest } = profile
  return rest
}

async function persistProfileLocally(profile: ProfileState, userId: string): Promise<ProfileState> {
  return saveProfileToDb(stripProfileMeta(profile), userId)
}

function isSupabaseRlsError(error: unknown) {
  if (!error || typeof error !== "object") return false

  const code = "code" in error ? error.code : undefined
  const message = "message" in error ? error.message : undefined

  return code === "42501" || message === "new row violates row-level security policy for table \"profiles\""
}
