"use client";

import { auth } from "../firebase";
import type { ProfileData } from "./profile.service";

export async function loadProfileFromSupabase(): Promise<ProfileData | null> {
  const token = await getFirebaseIdToken();
  if (!token) return null;

  const response = await fetch("/api/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await readApiError(response);
    console.error("Profile load error:", error);
    return null;
  }

  return (await response.json()) as ProfileData;
}

export async function saveProfileToSupabase(
  profile: Omit<ProfileData, "userId" | "updatedAt">
): Promise<ProfileData> {
  const token = await getFirebaseIdToken();
  if (!token) throw new Error("User not logged in");

  const response = await fetch("/api/profile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const error = await readApiError(response);
    console.error("Profile save error:", error);
    throw error;
  }

  return (await response.json()) as ProfileData;
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
    return {
      message: `Profile API request failed with status ${response.status}`,
    };
  }
}
