import { Schema, model, models, type Model, type Document } from "mongoose";

export interface ISettings extends Document {
  academyName: string;
  logo?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  currency: string;
  timezone: string;
  attendanceSettings: {
    lateMarkAfterMinutes?: number;
  };
  membershipSettings: {
    expiringSoonDays: number;
  };
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettings>(
  {
    academyName: { type: String, required: true, default: "YinYang Wushu Sanda Center" },
    logo: { type: String },
    address: { type: String },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    currency: { type: String, default: "NPR" },
    timezone: { type: String, default: "Asia/Kathmandu" },
    attendanceSettings: {
      lateMarkAfterMinutes: { type: Number, default: 10 },
    },
    membershipSettings: {
      expiringSoonDays: { type: Number, default: 7 },
    },
  },
  { timestamps: true }
);

// Intended to hold a single document for the whole academy.
export const Settings: Model<ISettings> =
  models.Settings || model<ISettings>("Settings", SettingsSchema);
