"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";
import { profileUpdateSchema, changePasswordSchema, type ProfileUpdateInput, type ChangePasswordInput } from "@/lib/validations/profile";
import { requireSession, ActionError, runAction } from "@/lib/actions/helpers";

export interface ProfileDTO {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  profileImage?: string;
  role: string;
}

export async function getOwnProfile(): Promise<ProfileDTO> {
  const session = await requireSession();
  await connectToDatabase();
  const doc = await User.findById(session.user.id);
  if (!doc) throw new ActionError("User not found.");
  return {
    id: doc._id.toString(),
    username: doc.username,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    profileImage: doc.profileImage,
    role: doc.role,
  };
}

export async function updateOwnProfile(input: ProfileUpdateInput) {
  return runAction(async () => {
    const session = await requireSession();
    const parsed = profileUpdateSchema.parse(input);
    await connectToDatabase();
    // Role is intentionally excluded from the update payload — users cannot change their own role.
    const doc = await User.findByIdAndUpdate(session.user.id, parsed, { new: true });
    if (!doc) throw new ActionError("User not found.");
    revalidatePath("/profile");
    return { id: doc._id.toString() };
  });
}

export async function changeOwnPassword(input: ChangePasswordInput) {
  return runAction(async () => {
    const session = await requireSession();
    const parsed = changePasswordSchema.parse(input);
    await connectToDatabase();
    const doc = await User.findById(session.user.id).select("+passwordHash");
    if (!doc) throw new ActionError("User not found.");

    const matches = await bcrypt.compare(parsed.currentPassword, doc.passwordHash);
    if (!matches) throw new ActionError("Current password is incorrect.");

    doc.passwordHash = await bcrypt.hash(parsed.newPassword, 10);
    await doc.save();
    return { success: true };
  });
}
