"use client";

import { authHeaders, getFirebaseIdToken, readApiError } from "../apiClient";
import type { ProfileData } from "./profile.service";
import { en } from "@/app/messages/en";

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
    throw error;
  }

  return (await response.json()) as ProfileData;
}

export async function saveProfileToSupabase(
  profile: Omit<ProfileData, "userId" | "updatedAt">
): Promise<ProfileData> {
  const token = await getFirebaseIdToken();
  if (!token) throw new Error(en.profile.signInRequired);

  const response = await fetch("/api/profile", {
    method: "POST",
    headers: authHeaders(token, true),
    body: JSON.stringify(profile),
  });

  if (!response.ok) {
    const error = await readApiError(response, "Profile save request");
    throw error;
  }

  return (await response.json()) as ProfileData;
}

export async function deleteProfileFromSupabase(): Promise<void> {
  const token = await getFirebaseIdToken();
  if (!token) throw new Error(en.profile.signInRequired);

  const response = await fetch("/api/profile", {
    method: "DELETE",
    headers: authHeaders(token),
  });

  if (response.status === 404) {
    return;
  }

  if (!response.ok) {
    const error = await readApiError(response, "Profile delete request");
    throw error;
  }
}
