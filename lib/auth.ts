import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import connectToDatabase from "@/lib/mongodb";
import { User } from "@/models/User";
import type { Role } from "@/types";

const credentialsSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

/** Escape a string for safe use inside a RegExp — treats every character literally. */
function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Required for self-hosted deployments (Docker, VPS, etc). Without this, Auth.js
  // rejects the request as coming from an "untrusted host" whenever AUTH_URL/
  // NEXTAUTH_URL doesn't exactly match the request's Host header — which surfaces
  // to the user as a generic, misleading "invalid credentials" error.
  trustHost: true,
  session: { strategy: "jwt", maxAge: 60 * 60 * 8 }, // 8 hour session
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);
        if (!parsed.success) return null;
        // Trim whitespace (easy to introduce via copy-paste) and match the username
        // case-insensitively — usernames aren't meant to be case-sensitive, and a
        // mismatch here used to silently fail the whole login with no explanation.
        const username = parsed.data.username.trim();
        const password = parsed.data.password;

        await connectToDatabase();

        const user = await User.findOne({
          $or: [{ username: new RegExp(`^${escapeRegex(username)}$`, "i") }, { email: username.toLowerCase() }],
        }).select("+passwordHash");

        if (!user) {
          console.error(`[auth] No user found for "${username}"`);
          return null;
        }
        if (!user.isActive) {
          console.error(`[auth] User "${username}" is deactivated`);
          return null;
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);
        if (!passwordMatches) {
          console.error(`[auth] Password mismatch for "${username}"`);
          return null;
        }

        user.lastLogin = new Date();
        await user.save();

        return {
          id: user._id.toString(),
          name: `${user.firstName} ${user.lastName}`,
          email: user.email,
          role: user.role as Role,
          username: user.username,
          requiresPasswordChange: user.requiresPasswordChange,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.username = (user as { username?: string }).username;
        token.id = user.id;
        token.requiresPasswordChange = (user as any).requiresPasswordChange;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.username = token.username as string;
        session.user.requiresPasswordChange = token.requiresPasswordChange as boolean;
      }
      return session;
    },
  },
});