// Abstract base for the storage wrapper — shared types + helpers.
// Concrete implementations live in index.ts (native) and index.web.ts (web).

import AsyncStorage from "@react-native-async-storage/async-storage";

export type StorageItemKey = string;
export type StorageItemValue = string | number | boolean | null;

// Helper for subclasses to enforce that they don't declare methods beyond
// StorageBase. Use as: type _ = AssertNoExtras<Exclude<keyof Storage, keyof StorageBase>>;
export type AssertNoExtras<T extends never> = T;

export const getApiUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined" && window.location) {
    return `http://${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
};

export const API_URL = getApiUrl();

export abstract class StorageBase {
  protected warn(op: string, key: StorageItemKey, e: unknown) {
    console.warn(`[storage] ${op}(${key}) failed`, e);
  }

  protected async syncSet(key: string, valueStr: string): Promise<void> {
    try {
      await fetch(`${API_URL}/api/storage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value: valueStr }),
      });
    } catch (e) {
      console.warn(`[storage] syncSet(${key}) failed`, e);
    }
  }

  protected async syncRemove(key: string): Promise<void> {
    try {
      await fetch(`${API_URL}/api/storage/${key}`, {
        method: "DELETE",
      });
    } catch (e) {
      console.warn(`[storage] syncRemove(${key}) failed`, e);
    }
  }

  async syncWithBackend(): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/api/storage`);
      if (!response.ok) return;
      const dbItems: { key: string; value: string }[] = await response.json();
      const dbMap = new Map(dbItems.map((item) => [item.key, item.value]));

      // 1. Upload local keys that are not in DB
      const KNOWN_KEYS = [
        "fit.workouts.v1",
        "fit.custom_exercises.v1",
        "fit.planned.v1",
        "fit.profile.v1",
        "fit.weekly_split.v1",
        "fit.cycle.prefs.v1",
        "fit.onboarding.complete.v1"
      ];

      const localKeys = await AsyncStorage.getAllKeys();
      const fitKeys = new Set([...localKeys.filter(k => k.startsWith("fit.")), ...KNOWN_KEYS]);

      for (const key of fitKeys) {
        if (!dbMap.has(key)) {
          let localVal = await AsyncStorage.getItem(key);
          if (localVal === null) {
            try {
              const val = await this.secureGet(key, null);
              if (val !== null) {
                localVal = JSON.stringify(val);
              }
            } catch {}
          }
          if (localVal !== null) {
            await this.syncSet(key, localVal);
          }
        }
      }

      // 2. Download from DB to local storage
      for (const [key, dbVal] of dbMap.entries()) {
        await AsyncStorage.setItem(key, dbVal);
        
        // Also write to SecureStore if it's a secure key
        if (key === "fit.profile.v1") {
          try {
            const parsed = JSON.parse(dbVal);
            await this.secureSet(key, parsed);
          } catch {}
        }
      }
    } catch (e) {
      console.warn("[storage] syncWithBackend failed", e);
    }
  }

  // raw is whatever AsyncStorage / SecureStore returned: a JSON-encoded string
  // (because setItem always JSON.stringifies) or null if the key was missing.
  // We always JSON.parse so values round-trip correctly across types.
  protected retrieve<Fallback extends StorageItemValue>(
    raw: string | null,
    fallback: Fallback,
  ): Fallback | null {
    if (raw === null) return fallback;
    try {
      return JSON.parse(raw) as Fallback;
    } catch (e) {
      this.warn("retrieve", "parse error", e);
      return fallback;
    }
  }

  abstract getItem<Fallback extends StorageItemValue>(
    key: string,
    fallback: Fallback,
  ): Promise<Fallback | null>;
  abstract setItem<Value extends StorageItemValue>(
    key: string,
    value: Value,
  ): Promise<boolean>;
  abstract removeItem(key: string): Promise<boolean>;
  abstract secureGet<Fallback extends StorageItemValue>(
    key: string,
    fallback: Fallback,
  ): Promise<Fallback | null>;
  abstract secureSet<Value extends StorageItemValue>(
    key: string,
    value: Value,
  ): Promise<boolean>;
  abstract secureRemove(key: string): Promise<boolean>;
}
