// Bearer-token authentication middleware. Verifies the JWT and confirms the
// user still exists, then exposes the username as req.username.

import { ApiError } from "../errors/api-error.js";
import { verifyAccessToken } from "../lib/jwt.js";
import { userRepository } from "../repositories/user.repository.js";
import { asyncHandler } from "./async-handler.js";

export const requireAuth = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization ?? "";
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    throw ApiError.unauthorized("Authorization token required");
  }

  const payload = verifyAccessToken(token);
  if (!payload) {
    throw ApiError.unauthorized("Invalid or expired token");
  }

  const username = payload.sub;
  if (!username) {
    throw ApiError.unauthorized("Invalid token payload");
  }

  const user = await userRepository.findByUsername(username);
  if (!user) {
    throw ApiError.unauthorized("User not found");
  }

  req.username = user.username;
  next();
});
