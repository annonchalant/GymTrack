// Request validation middleware backed by zod schemas.
// On success the parsed (trimmed/normalized) value replaces req.body; on
// failure the first issue's message is surfaced as a 400 { detail }.

import { ApiError } from "../errors/api-error.js";

export function validateBody(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const first = result.error.issues[0];
      return next(ApiError.badRequest(first?.message ?? "Invalid request body"));
    }
    req.body = result.data;
    next();
  };
}
