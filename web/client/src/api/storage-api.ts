// Storage-sync endpoints — typed wrappers over the API's storage module.
// All calls are authenticated; the storage service decides when to invoke them.

import { apiFetch } from "@/api/http";

export type RemoteStorageItem = { key: string; value: string };

export function fetchAllItems(): Promise<RemoteStorageItem[]> {
  return apiFetch<RemoteStorageItem[]>("/api/storage", { auth: true });
}

export async function setItem(key: string, value: string): Promise<void> {
  await apiFetch("/api/storage", { method: "POST", auth: true, body: { key, value } });
}

export async function removeItem(key: string): Promise<void> {
  await apiFetch(`/api/storage/${encodeURIComponent(key)}`, {
    method: "DELETE",
    auth: true,
  });
}
