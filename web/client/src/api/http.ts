// Centralized HTTP client — the only module that calls fetch against the API.
// Adds the Bearer header when requested, parses JSON, and normalizes failures
// into ApiRequestError so callers can branch on status/detail.

import { AUTH_TOKEN_KEY } from "@/constants/storage-keys";
import { getToken } from "@/utils/token-storage";

// Same-origin in dev (Vite proxies /api to the Express server) and in prod
// when the client is served behind the API. Override with VITE_API_URL.
export const API_URL: string = import.meta.env.VITE_API_URL ?? "";

export class ApiRequestError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiRequestError";
    this.status = status;
    this.detail = detail;
  }
}

type ApiFetchOptions = Omit<RequestInit, "body"> & {
  auth?: boolean;
  body?: unknown;
};

export async function apiFetch<T>(
  path: string,
  { auth = false, body, headers, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const finalHeaders: Record<string, string> = {
    ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = await getToken(AUTH_TOKEN_KEY);
    if (token) finalHeaders.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: finalHeaders,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiRequestError(
      res.status,
      (data as { detail?: string } | null)?.detail ?? `Request failed (${res.status})`,
    );
  }
  return data as T;
}
