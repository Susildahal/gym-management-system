import { z } from "zod";

export const noticeSchema = z.object({
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]),
  targetAudience: z.enum(["EVERYONE", "STUDENTS", "INSTRUCTORS"]),
  publishedDate: z.coerce.date().optional(),
  expiryDate: z.coerce.date().optional(),
});

export type NoticeInput = z.infer<typeof noticeSchema>;
