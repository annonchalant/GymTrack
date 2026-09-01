// Singleton Prisma client wired to Neon Postgres through the pg driver
// adapter (Prisma 7 is engine-less: the adapter owns the connections).
// All data access goes through the repositories, which import from here.

import { PrismaPg } from "@prisma/adapter-pg";

import { env } from "../config/env.js";
import prismaPkg from "../generated/prisma/index.js";

const { PrismaClient } = prismaPkg;

const adapter = new PrismaPg({ connectionString: env.databaseUrl });

export const prisma = new PrismaClient({ adapter });

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
