// Native token storage — backed by Keychain (iOS) / EncryptedSharedPreferences (Android)
// via expo-secure-store. Metro picks token-storage.web.ts on web.

import * as SecureStore from "expo-secure-store";

export async function getToken(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

export async function setToken(key: string, value: string): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function removeToken(key: string): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}
