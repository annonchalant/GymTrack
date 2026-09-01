// Data access for per-user key-value storage items.
// Services depend on this interface, never on Prisma directly.

import { prisma } from "../lib/prisma.js";

export const storageRepository = {
  findAllByUser(userId) {
    return prisma.storageItem.findMany({
      where: { userId },
      select: { key: true, value: true },
    });
  },

  upsert(userId, key, value) {
    return prisma.storageItem.upsert({
      where: { userId_key: { userId, key } },
      update: { value },
      create: { userId, key, value },
    });
  },

  // deleteMany so removing a missing key is a no-op, matching the original API.
  deleteByKey(userId, key) {
    return prisma.storageItem.deleteMany({ where: { userId, key } });
  },
};
