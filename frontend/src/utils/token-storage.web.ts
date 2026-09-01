// Web token storage — no Keychain on web, falls back to AsyncStorage
// (mirrors how storage-base.ts treats secure* keys on web).

import AsyncStorage from "@react-native-async-storage/async-storage";

export async function getToken(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setToken(key: string, value: string): Promise<void> {
  await AsyncStorage.setItem(key, value);
}

export async function removeToken(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
