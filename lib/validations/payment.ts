import { z } from "zod";

export const paymentSchema = z.object({
  student: z.string().min(1, "Student is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  paymentDate: z.coerce.date(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "ONLINE", "CARD", "OTHER"]),
  paymentFor: z.string().min(1, "Payment reason is required"),
  membership: z.string().optional(),
  remarks: z.string().optional(),
});

export type PaymentInput = z.infer<typeof paymentSchema>;
