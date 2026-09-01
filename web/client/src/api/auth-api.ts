// Auth endpoints — typed wrappers over the API's auth module.

import { apiFetch } from "@/api/http";

export type AuthResponse = {
  access_token: string;
  token_type: "bearer";
  username: string;
};

export type RegisterResponse = {
  status: "created";
  username: string;
};

export function register(
  username: string,
  password: string,
): Promise<RegisterResponse> {
  return apiFetch<RegisterResponse>("/api/auth/register", {
    method: "POST",
    body: { username, password },
  });
}

export function login(
  username: string,
  password: string,
): Promise<AuthResponse> {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: { username, password },
  });
}
