// HTTP layer for auth — translates requests/responses, no business logic.

import { asyncHandler } from "../../middleware/async-handler.js";
import { authService } from "./auth.service.js";

export const authController = {
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  }),

  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  }),
};
