import { z } from "zod";

export const coachFeedbackSchema = z.object({
  student: z.string().min(1, "Student is required"),
  date: z.coerce.date().optional(),
  comment: z.string().min(1, "Comment is required"),
});

export type CoachFeedbackInput = z.infer<typeof coachFeedbackSchema>;
