// Storage service — localStorage locally, mirrored to the backend per key.
// HTTP concerns live in src/api/storage-api.ts; this module owns the sync
// policy: values are JSON-encoded on write and JSON-parsed on read, every
// set/remove is fire-and-forgotten to the backend while logged in, and
// syncWithBackend() reconciles on login (upload local-only keys, then let the
// server win for every key it has).

import * as storageApi from "@/api/storage-api";
import { AUTH_TOKEN_KEY, USER_DATA_PREFIXES } from "@/constants/storage-keys";
import { getToken } from "@/utils/token-storage";

export type StorageItemValue = string | number | boolean | null;

async function isLoggedIn(): Promise<boolean> {
  try {
    return Boolean(await getToken(AUTH_TOKEN_KEY));
  } catch {
    return false;
  }
}

function localUserDataKeys(): string[] {
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && USER_DATA_PREFIXES.some((prefix) => k.startsWith(prefix))) {
      keys.push(k);
    }
  }
  return keys;
}

class StorageService {
  private warn(op: string, key: string, e: unknown) {
    console.warn(`[storage] ${op}(${key}) failed`, e);
  }

  private async syncSet(key: string, valueStr: string): Promise<void> {
    try {
      if (!(await isLoggedIn())) return; // skip sync if not logged in
      await storageApi.setItem(key, valueStr);
    } catch (e) {
      this.warn("syncSet", key, e);
    }
  }

  private async syncRemove(key: string): Promise<void> {
    try {
      if (!(await isLoggedIn())) return;
      await storageApi.removeItem(key);
    } catch (e) {
      this.warn("syncRemove", key, e);
    }
  }

  async syncWithBackend(): Promise<void> {
    try {
      if (!(await isLoggedIn())) return; // no token — skip

      const dbItems = await storageApi.fetchAllItems();
      const dbMap = new Map(dbItems.map((item) => [item.key, item.value]));

      // 1. Upload local user-data keys that are not in DB yet.
      for (const key of localUserDataKeys()) {
        if (!dbMap.has(key)) {
          const localVal = localStorage.getItem(key);
          if (localVal !== null) await this.syncSet(key, localVal);
        }
      }

      // 2. Download from DB into local storage (server wins).
      for (const [key, dbVal] of dbMap.entries()) {
        localStorage.setItem(key, dbVal);
      }
    } catch (e) {
      console.warn("[storage] syncWithBackend failed", e);
    }
  }

  async getItem<Fallback extends StorageItemValue>(
    key: string,
    fallback: Fallback,
  ): Promise<Fallback | null> {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      try {
        return JSON.parse(raw) as Fallback;
      } catch {
        return fallback;
      }
    } catch (e) {
      this.warn("getItem", key, e);
      return fallback;
    }
  }

  async setItem<Value extends StorageItemValue>(
    key: string,
    value: Value,
  ): Promise<boolean> {
    try {
      const encoded = JSON.stringify(value);
      localStorage.setItem(key, encoded);
      void this.syncSet(key, encoded);
      return true;
    } catch (e) {
      this.warn("setItem", key, e);
      return false;
    }
  }

  async removeItem(key: string): Promise<boolean> {
    try {
      localStorage.removeItem(key);
      void this.syncRemove(key);
      return true;
    } catch (e) {
      this.warn("removeItem", key, e);
      return false;
    }
  }
}

export const storage = new StorageService();
