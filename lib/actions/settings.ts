"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import { Settings } from "@/models/Settings";
import { settingsSchema, type SettingsInput } from "@/lib/validations/settings";
import { requirePermission, runAction } from "@/lib/actions/helpers";

export interface SettingsDTO {
  academyName: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency: string;
  timezone: string;
}

export async function getSettings(): Promise<SettingsDTO> {
  await connectToDatabase();
  let doc = await Settings.findOne();
  if (!doc) doc = await Settings.create({});
  return {
    academyName: doc.academyName,
    logo: doc.logo,
    address: doc.address,
    phone: doc.phone,
    email: doc.email,
    website: doc.website,
    currency: doc.currency,
    timezone: doc.timezone,
  };
}

export async function updateSettings(input: SettingsInput) {
  return runAction(async () => {
    await requirePermission("SETTINGS_MANAGE");
    const parsed = settingsSchema.parse(input);
    await connectToDatabase();
    let doc = await Settings.findOne();
    if (!doc) {
      doc = await Settings.create(parsed);
    } else {
      Object.assign(doc, parsed);
      await doc.save();
    }
    revalidatePath("/settings");
    return { success: true };
  });
}
