// User profile collected during onboarding. Ported unchanged from mobile.

import { STORAGE_KEYS } from "@/constants/storage-keys";
import { storage } from "@/utils/storage";

const KEY = STORAGE_KEYS.profile;

export type Profile = {
  name: string;
  dob: string | null; // ISO YYYY-MM-DD, optional
  contact: string; // email OR phone — single free-text field
};

export async function getProfile(): Promise<Profile | null> {
  const raw = await storage.getItem<string>(KEY, "");
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Profile;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveProfile(profile: Profile): Promise<void> {
  await storage.setItem(KEY, JSON.stringify(profile));
}
