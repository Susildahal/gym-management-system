import type { Role } from "@/types";
import {
  LayoutDashboard,
  Users,
  UserSquare2,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Wallet,
  Megaphone,
  MessageSquareText,
  BarChart3,
  Bell,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["ADMIN", "INSTRUCTOR", "STUDENT"] },
  { label: "Students", href: "/students", icon: Users, roles: ["ADMIN", "INSTRUCTOR"] },
  { label: "Instructors", href: "/instructors", icon: UserSquare2, roles: ["ADMIN"] },
  { label: "Classes", href: "/classes", icon: CalendarDays, roles: ["ADMIN", "INSTRUCTOR", "STUDENT"] },
  { label: "Attendance", href: "/attendance", icon: ClipboardCheck, roles: ["ADMIN", "INSTRUCTOR", "STUDENT"] },
  { label: "Memberships", href: "/memberships", icon: CreditCard, roles: ["ADMIN", "STUDENT"] },
  { label: "Payments", href: "/payments", icon: Wallet, roles: ["ADMIN", "STUDENT"] },
  { label: "Notices", href: "/notices", icon: Megaphone, roles: ["ADMIN", "INSTRUCTOR", "STUDENT"] },
  { label: "Coach Feedback", href: "/coach-feedback", icon: MessageSquareText, roles: ["ADMIN", "INSTRUCTOR", "STUDENT"] },
  { label: "Reports", href: "/reports", icon: BarChart3, roles: ["ADMIN", "INSTRUCTOR"] },
  { label: "Notifications", href: "/notifications", icon: Bell, roles: ["ADMIN", "INSTRUCTOR", "STUDENT"] },
  { label: "Settings", href: "/settings", icon: Settings, roles: ["ADMIN"] },
];
