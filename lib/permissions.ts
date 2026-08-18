import type { Role } from "@/types";

/**
 * Central permission table. Every protected Server Action / Route Handler
 * should check against this rather than re-implementing role checks inline,
 * so authorization rules live in exactly one place.
 */
export const PERMISSIONS = {
  STUDENT_MANAGE: ["ADMIN"],
  STUDENT_VIEW_ALL: ["ADMIN", "INSTRUCTOR"],
  INSTRUCTOR_MANAGE: ["ADMIN"],
  CLASS_MANAGE: ["ADMIN"],
  ATTENDANCE_MARK: ["ADMIN", "INSTRUCTOR"],
  ATTENDANCE_VIEW_ALL: ["ADMIN", "INSTRUCTOR"],
  MEMBERSHIP_MANAGE: ["ADMIN"],
  PAYMENT_MANAGE: ["ADMIN"],
  NOTICE_MANAGE: ["ADMIN"],
  FEEDBACK_CREATE: ["ADMIN", "INSTRUCTOR"],
  REPORTS_VIEW: ["ADMIN", "INSTRUCTOR"],
  SETTINGS_MANAGE: ["ADMIN"],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function hasPermission(role: Role | undefined | null, permission: Permission) {
  if (!role) return false;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function assertPermission(role: Role | undefined | null, permission: Permission) {
  if (!hasPermission(role, permission)) {
    throw new Error("FORBIDDEN");
  }
}

/** Route-prefix -> roles allowed to view that section, used by middleware.ts. */
export const ROUTE_ROLES: Record<string, Role[]> = {
  "/students": ["ADMIN", "INSTRUCTOR"],
  "/instructors": ["ADMIN"],
  "/classes": ["ADMIN", "INSTRUCTOR", "STUDENT"],
  "/attendance": ["ADMIN", "INSTRUCTOR", "STUDENT"],
  "/memberships": ["ADMIN", "STUDENT"],
  "/payments": ["ADMIN", "STUDENT"],
  "/notices": ["ADMIN", "INSTRUCTOR", "STUDENT"],
  "/coach-feedback": ["ADMIN", "INSTRUCTOR", "STUDENT"],
  "/reports": ["ADMIN", "INSTRUCTOR"],
  "/notifications": ["ADMIN", "INSTRUCTOR", "STUDENT"],
  "/settings": ["ADMIN"],
  "/dashboard": ["ADMIN", "INSTRUCTOR", "STUDENT"],
  "/profile": ["ADMIN", "INSTRUCTOR", "STUDENT"],
};
