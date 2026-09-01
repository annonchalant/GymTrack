// JWT signing/verification — the only module that touches jsonwebtoken.
// Mirrors the original backend contract: HS256, 30-day expiry, `sub` = username.

import jwt from "jsonwebtoken";

import { env } from "../config/env.js";

const ALGORITHM = "HS256";
const EXPIRE_DAYS = 30;

export function signAccessToken(username) {
  return jwt.sign({ sub: username }, env.jwtSecret, {
    algorithm: ALGORITHM,
    expiresIn: `${EXPIRE_DAYS}d`,
  });
}

// Returns the payload, or null for any invalid/expired token.
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwtSecret, { algorithms: [ALGORITHM] });
  } catch {
    return null;
  }
}
