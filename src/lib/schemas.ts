import { z } from "zod";

export const userSearchSchema = z.object({
  query: z.string().min(1, "Query is required"),
});

export const chatParamsSchema = z.object({
  // enforce Prisma CUID v2 format
  chatId: z.string().cuid2("Invalid chatId"),
});

export const chatSelectSchema = z.object({
  userId: z.string().cuid("Invalid userId"),
});

export const messageCreateSchema = z.object({
  content: z.string().min(1, "Cannot send empty message"),
});
