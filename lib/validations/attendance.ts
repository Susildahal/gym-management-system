import { z } from "zod";

export const attendanceEntrySchema = z.object({
  student: z.string().min(1),
  status: z.enum(["PRESENT", "ABSENT"]),
  remarks: z.string().optional(),
});

export const markAttendanceSchema = z.object({
  class: z.string().min(1, "Class is required"),
  date: z.coerce.date(),
  entries: z.array(attendanceEntrySchema).min(1, "At least one student is required"),
});

export type MarkAttendanceInput = z.infer<typeof markAttendanceSchema>;
