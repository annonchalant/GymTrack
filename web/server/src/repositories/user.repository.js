// Data access for users — the only place user rows are read or written.
// Services depend on this interface, never on Prisma directly.

import { prisma } from "../lib/prisma.js";

export const userRepository = {
  findByUsername(username) {
    return prisma.user.findUnique({ where: { username } });
  },

  create({ username, passwordHash }) {
    return prisma.user.create({ data: { username, passwordHash } });
  },
};
