"use server";
import bcrypt from "bcryptjs";
import { User } from "@/models/User";
import type { Role } from "@/types";

export interface GeneratedCredentials {
  username: string;
  password: string;
}

function randomPassword(length = 10) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let out = "";
  for (let i = 0; i < length; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

async function uniqueUsername(first: string, last: string) {
  const base = `${first}.${last}`.toLowerCase().replace(/[^a-z0-9.]/g, "") || "user";
  let username = base;
  let n = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await User.exists({ username })) {
    n += 1;
    username = `${base}${n}`;
  }
  return username;
}

async function uniqueEmail(preferred: string | undefined, username: string, domainHint: string) {
  let email = preferred && preferred.length > 0 ? preferred : `${username}@${domainHint}`;
  let n = 0;
  // eslint-disable-next-line no-await-in-loop
  while (await User.exists({ email })) {
    n += 1;
    const [local, domain] = email.split("@");
    email = `${local}${n}@${domain}`;
  }
  return email;
}

/**
 * Create a User login for a newly created Student/Instructor and return the
 * one-time plaintext password. The password is saved as tempPassword so the
 * admin can view it until the user changes it.
 */
export async function createLinkedUserAccount(params: {
  role: Extract<Role, "STUDENT" | "INSTRUCTOR">;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}) {
  const username = await uniqueUsername(params.firstName, params.lastName);
  const domainHint = params.role === "STUDENT" ? "students.yinyangwushu.local" : "staff.yinyangwushu.local";
  const email = await uniqueEmail(params.email, username, domainHint);
  const password = randomPassword();
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    passwordHash,
    role: params.role,
    firstName: params.firstName,
    lastName: params.lastName,
    phone: params.phone,
    isActive: true,
    requiresPasswordChange: true,
    tempPassword: password,
  });

  return { user, credentials: { username, password } as GeneratedCredentials };
}

export async function changeTempPassword(userId: string, newPassword: string) {
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await User.findByIdAndUpdate(userId, {
    $set: { passwordHash, requiresPasswordChange: false },
    $unset: { tempPassword: "" }
  });
}
