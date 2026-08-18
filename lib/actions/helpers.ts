import "server-only";
import { auth } from "@/lib/auth";
import { hasPermission, type Permission } from "@/lib/permissions";
import type { ActionResult } from "@/types";
import type { Role } from "@/types";

export class ActionError extends Error {}

/** Resolve the current session and throw a clear error if it's missing. */
export async function requireSession() {
  const session = await auth();
  if (!session?.user) throw new ActionError("You must be signed in.");
  return session;
}

/** Resolve the session and assert it holds one of the given permissions. */
export async function requirePermission(permission: Permission) {
  const session = await requireSession();
  if (!hasPermission(session.user.role, permission)) {
    throw new ActionError("You don't have permission to do that.");
  }
  return session;
}

/** Resolve the session and assert its role is in the allow-list. */
export async function requireRole(...roles: Role[]) {
  const session = await requireSession();
  if (!roles.includes(session.user.role)) {
    throw new ActionError("You don't have permission to do that.");
  }
  return session;
}

/**
 * Wrap a Server Action body so every action returns the same
 * { success, data } / { success, error } shape and never leaks internal
 * stack traces or Mongo error details to the client.
 */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    const data = await fn();
    return { success: true, data };
  } catch (err) {
    if (err instanceof ActionError) {
      return { success: false, error: err.message };
    }
    if (err && typeof err === "object" && "code" in err && (err as { code?: number }).code === 11000) {
      return { success: false, error: "A record with that value already exists." };
    }
    console.error(err);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
