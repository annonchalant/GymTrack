// Storage business logic — per-user key-value sync used by the client to
// mirror its local fit.* keys.

import { storageRepository } from "../../repositories/storage.repository.js";

export const storageService = {
  list(userId) {
    return storageRepository.findAllByUser(userId);
  },

  async set(userId, { key, value }) {
    await storageRepository.upsert(userId, key, value);
    return { status: "success" };
  },

  async remove(userId, key) {
    await storageRepository.deleteByKey(userId, key);
    return { status: "success" };
  },
};
