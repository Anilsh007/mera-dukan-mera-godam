"use client"

import { useCallback, useEffect, useState } from "react"
import { liveQuery } from "dexie"
import { auth } from "@/app/lib/firebase"
import { loadProfileFromDb, saveProfileToDb } from "@/app/lib/profile/profileDb.service"
import { loadProfileFromSupabase } from "@/app/lib/profile/profileSupabase.service"
import { saveProfileWithSync, deleteProfileWithSync } from "@/app/lib/profile/profilePersistence.service"
import { stripProfileMeta } from "@/app/lib/profile/profileSync.utils"
import { migrateLocalUserData } from "@/app/lib/userDataMigration"
import type { AuthUser } from "@/app/lib/firebase"
import { requireUserIdentityFromAuthUser } from "@/app/lib/userIdentity"
import { notify as toast } from "@/app/lib/notifications"
import { en } from "@/app/messages/en"

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
    businessType: "",
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
  const [loading, setLoading] = useState(Boolean(auth))
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let isMounted = true
    let unsubscribeLocalProfile: { unsubscribe: () => void } | null = null

    if (!auth) {
      return () => {
        isMounted = false
      }
    }

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!isMounted) return
      unsubscribeLocalProfile?.unsubscribe()
      unsubscribeLocalProfile = null

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
          await saveProfileToDb(stripProfileMeta(mergedLatest), userId)
        }

        if (!isMounted) return
        unsubscribeLocalProfile = liveQuery(() => loadProfileFromDb(userId)).subscribe({
          next: (nextLocalProfile) => {
            if (!isMounted || !nextLocalProfile) return
            setProfile(mergeWithFirebaseProfile(nextLocalProfile, user))
          },
          error: () => {
            if (isMounted) toast.error(en.profile.loadFailed)
          },
        })
      } catch {
        toast.error(en.profile.loadFailed)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      unsubscribeLocalProfile?.unsubscribe()
      unsubscribe()
    }
  }, [])

  const saveProfile = useCallback(async (newData: ProfileState): Promise<ProfileSaveResult> => {
    const user = auth?.currentUser
    if (!user) throw new Error(en.profile.signInRequired)
    const userId = requireUserIdentityFromAuthUser(user)

    setSaving(true)

    try {
      const mergedProfile = mergeWithFirebaseProfile(newData, user)
      const { profile: savedProfile, cloudSyncSkipped } = await saveProfileWithSync(mergedProfile, userId)
      setProfile(savedProfile)
      return { profile: savedProfile, cloudSyncSkipped }
    } catch (error) {
      throw error
    } finally {
      setSaving(false)
    }
  }, [])

  const deleteProfile = useCallback(async () => {
    const user = auth?.currentUser
    if (!user) throw new Error(en.profile.signInRequired)
    const userId = requireUserIdentityFromAuthUser(user)

    setSaving(true)

    try {
      const { cloudSyncSkipped } = await deleteProfileWithSync(userId)
      setProfile(buildFirebaseProfile(user))
      return { cloudSyncSkipped }
    } finally {
      setSaving(false)
    }
  }, [])

  return {
    profile,
    loading,
    saving,
    saveProfile,
    deleteProfile,
    setProfile,
  }
}

function buildFirebaseProfile(user: AuthUser): ProfileState {
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
  user: AuthUser
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
