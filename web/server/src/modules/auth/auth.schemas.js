// Request schemas for the auth module. Username is normalized (trim +
// lowercase) before validation, matching the original backend's behavior and
// its exact error copy.
//
// Note: only register enforces length rules — the original backend let login
// fall through to a 401 for any non-matching credentials.

import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string({ message: "Username must be at least 3 characters" })
    .transform((v) => v.trim().toLowerCase())
    .refine((v) => v.length >= 3, {
      message: "Username must be at least 3 characters",
    }),
  password: z
    .string({ message: "Password must be at least 6 characters" })
    .refine((v) => v.length >= 6, {
      message: "Password must be at least 6 characters",
    }),
});

export const loginSchema = z.object({
  username: z
    .string()
    .catch("")
    .transform((v) => v.trim().toLowerCase()),
  password: z.string().catch(""),
});
