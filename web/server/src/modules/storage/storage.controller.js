// HTTP layer for storage — translates requests/responses, no business logic.

import { asyncHandler } from "../../middleware/async-handler.js";
import { storageService } from "./storage.service.js";

export const storageController = {
  list: asyncHandler(async (req, res) => {
    res.json(await storageService.list(req.username));
  }),

  set: asyncHandler(async (req, res) => {
    res.json(await storageService.set(req.username, req.body));
  }),

  remove: asyncHandler(async (req, res) => {
    res.json(await storageService.remove(req.username, req.params.key));
  }),
};
