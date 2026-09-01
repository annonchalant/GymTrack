// Express app assembly — middleware stack, module routers, error pipeline.
// Kept separate from the bootstrap (index.js) so tests can import the app
// without binding a port, and exported as default so serverless platforms
// (Vercel) can invoke the app directly no matter which module they load.

import cors from "cors";
import express from "express";
import helmet from "helmet";

import { errorHandler, notFoundHandler } from "./middleware/error-handler.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { storageRouter } from "./modules/storage/storage.routes.js";

export function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/api/", (_req, res) => res.json({ message: "Hello World" }));
  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRouter);
  app.use("/api/storage", storageRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

// Shared singleton — used by src/index.js (local server) and api/index.js
// (Vercel serverless entry) so both run the same instance.
const app = createApp();
export default app;
