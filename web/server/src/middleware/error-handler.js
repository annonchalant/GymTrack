// Centralized error handling: operational ApiErrors are serialized as
// { detail } with their status; anything else is logged and masked as a 500.

import { ApiError } from "../errors/api-error.js";
import { logger } from "../lib/logger.js";

export function notFoundHandler(_req, res) {
  res.status(404).json({ detail: "Not found" });
}

// eslint-disable-next-line no-unused-vars -- Express identifies error middleware by arity
export function errorHandler(err, req, res, _next) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ detail: err.detail });
  }

  // Malformed JSON body from express.json().
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ detail: "Malformed JSON body" });
  }

  logger.error("Unhandled error", {
    method: req.method,
    path: req.originalUrl,
    error: err?.stack ?? String(err),
  });
  res.status(500).json({ detail: "Internal server error" });
}
