import { z } from "zod";

export const instructorSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  specialization: z.string().optional(),
  experienceYears: z.coerce.number().min(0).optional(),
  joiningDate: z.coerce.date().optional(),
});

export type InstructorInput = z.infer<typeof instructorSchema>;
