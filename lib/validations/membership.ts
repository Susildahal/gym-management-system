import { z } from "zod";

export const membershipPlanSchema = z.object({
  planName: z.string().min(1, "Plan name is required"),
  durationMonths: z.coerce.number().min(1),
  price: z.coerce.number().min(0),
  description: z.string().optional(),
});

export const membershipSchema = z.object({
  student: z.string().min(1, "Student is required"),
  plan: z.string().min(1, "Membership plan is required"),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  amount: z.coerce.number().min(0),
  paymentStatus: z.enum(["PAID", "PARTIAL", "UNPAID"]),
});

export type MembershipPlanInput = z.infer<typeof membershipPlanSchema>;
export type MembershipInput = z.infer<typeof membershipSchema>;
