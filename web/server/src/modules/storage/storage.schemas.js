// Request schemas for the storage module.

import { z } from "zod";

export const storageItemSchema = z.object({
  key: z.string({ message: "key and value must be strings" }),
  value: z.string({ message: "key and value must be strings" }),
});
