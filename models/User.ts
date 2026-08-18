import { Schema, model, models, type Model, type Document } from "mongoose";
import type { Role } from "@/types";

export interface IUser extends Document {
  username: string;
  email: string;
  passwordHash: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
  profileImage?: string;
  isActive: boolean;
  requiresPasswordChange: boolean;
  tempPassword?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ["ADMIN", "INSTRUCTOR", "STUDENT"], required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    profileImage: { type: String },
    isActive: { type: Boolean, default: true },
    requiresPasswordChange: { type: Boolean, default: false },
    tempPassword: { type: String },
    lastLogin: { type: Date },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });

export const User: Model<IUser> = models.User || model<IUser>("User", UserSchema);
