"use client";

import { authHeaders, getFirebaseIdToken, readApiError } from "../apiClient";
import type { ProfileData } from "./profile.service";

export async function loadProfileFromSupabase(): Promise<ProfileData | null> {
  const token = await getFirebaseIdToken();
  if (!token) return null;

  const response = await fetch("/api/profile", {
    method: "GET",
    headers: authHeaders(token),
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const error = await readApiError(response, "Profile load request");
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
    headers: authHeaders(token, true),
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const error = await readApiError(response, "Profile save request");
    console.error("Profile save error:", error);
    throw error;
  }

  return (await response.json()) as ProfileData;
}
