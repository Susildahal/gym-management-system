import type { Role } from "@/types";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      username: string;
      requiresPasswordChange: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
    username: string;
    requiresPasswordChange: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    username: string;
    requiresPasswordChange: boolean;
  }
}
