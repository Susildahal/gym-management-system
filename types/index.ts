export const ROLES = ["ADMIN", "INSTRUCTOR", "STUDENT"] as const;
export type Role = (typeof ROLES)[number];

export const ATTENDANCE_STATUS = ["PRESENT", "ABSENT"] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[number];

export const MEMBERSHIP_STATUS = [
  "ACTIVE",
  "EXPIRED",
  "SUSPENDED",
  "CANCELLED",
] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUS)[number];

export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "ONLINE",
  "CARD",
  "OTHER",
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const NOTICE_AUDIENCE = ["EVERYONE", "STUDENTS", "INSTRUCTORS"] as const;
export type NoticeAudience = (typeof NOTICE_AUDIENCE)[number];

export const NOTICE_PRIORITY = ["LOW", "NORMAL", "HIGH", "URGENT"] as const;
export type NoticePriority = (typeof NOTICE_PRIORITY)[number];

/** Standard shape returned by every Server Action / API route. */
export type ActionResult<T = undefined> =
  | { success: true; data: T }
  | { success: false; error: string };
