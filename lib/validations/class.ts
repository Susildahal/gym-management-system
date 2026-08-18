import { z } from "zod";

export const classSchema = z.object({
  name: z.string().min(1, "Class name is required"),
  classType: z.string().min(1, "Class type is required"),
  trainingLevel: z.enum(["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"]),
  instructor: z.string().min(1, "Instructor is required"),
  trainingDays: z
    .array(z.enum(["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]))
    .min(1, "Select at least one training day"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  endTime: z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  location: z.string().min(1, "Location is required"),
  maxCapacity: z.coerce.number().min(1),
  description: z.string().optional(),
});

export type ClassInput = z.infer<typeof classSchema>;
