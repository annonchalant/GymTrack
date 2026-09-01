// GymTrack web API — bootstrap.
// Loads validated config, starts the HTTP server, and shuts down cleanly
// (drain HTTP, then disconnect Prisma) on SIGINT/SIGTERM.
//
// API surface (unchanged from the original backend):
//   POST   /api/auth/register   { username, password } -> 201 { status, username }
//   POST   /api/auth/login      { username, password } -> { access_token, token_type, username }
//   GET    /api/storage         (auth) -> [{ key, value }]
//   POST   /api/storage         (auth) { key, value } -> { status }
//   DELETE /api/storage/:key    (auth) -> { status }

import app from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { disconnectPrisma } from "./lib/prisma.js";

const server = app.listen(env.port, () => {
  logger.info(`GymTrack API listening on http://localhost:${env.port}`, {
    env: env.nodeEnv,
  });
});

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info(`Received ${signal} — shutting down`);
  server.close(async () => {
    try {
      await disconnectPrisma();
    } finally {
      process.exit(0);
    }
  });
  // Force-exit if connections refuse to drain.
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
