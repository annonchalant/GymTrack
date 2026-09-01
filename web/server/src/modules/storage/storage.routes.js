import { Router } from "express";

import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import { storageController } from "./storage.controller.js";
import { storageItemSchema } from "./storage.schemas.js";

export const storageRouter = Router();

storageRouter.use(requireAuth);
storageRouter.get("/", storageController.list);
storageRouter.post("/", validateBody(storageItemSchema), storageController.set);
storageRouter.delete("/:key", storageController.remove);
