// Auth business logic: registration and credential verification.
// Throws ApiError for every expected failure; controllers stay thin.

import bcrypt from "bcryptjs";

import { ApiError } from "../../errors/api-error.js";
import { signAccessToken } from "../../lib/jwt.js";
import { userRepository } from "../../repositories/user.repository.js";

const BCRYPT_ROUNDS = 10;

export const authService = {
  async register({ username, password }) {
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    try {
      await userRepository.create({ username, passwordHash });
    } catch (e) {
      // P2002 = unique constraint violation — the unique index is the source
      // of truth, which also covers two concurrent registrations racing.
      if (e?.code === "P2002") {
        throw ApiError.conflict("Username already taken");
      }
      throw e;
    }
    return { status: "created", username };
  },

  async login({ username, password }) {
    const user = await userRepository.findByUsername(username);
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) {
      throw ApiError.unauthorized("Incorrect username or password");
    }
    return {
      access_token: signAccessToken(user.username),
      token_type: "bearer",
      username: user.username,
    };
  },
};
