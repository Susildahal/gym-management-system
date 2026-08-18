import { z } from "zod";

export const settingsSchema = z.object({
  academyName: z.string().min(1),
  logo: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  currency: z.string().min(1),
  timezone: z.string().min(1),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
