"use server";

import connectToDatabase from "@/lib/mongodb";
import { Student } from "@/models/Student";
import { Instructor } from "@/models/Instructor";
import { Attendance } from "@/models/Attendance";
import { Payment } from "@/models/Payment";
import { Membership } from "@/models/Membership";
import { Class } from "@/models/Class";
import { requirePermission } from "@/lib/actions/helpers";

function startOfMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export interface StudentReport {
  total: number;
  active: number;
  inactive: number;
  newThisMonth: number;
}

export async function getStudentReport(): Promise<StudentReport> {
  await requirePermission("REPORTS_VIEW");
  await connectToDatabase();
  const [total, active, newThisMonth] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ isActive: true }),
    Student.countDocuments({ joinDate: { $gte: startOfMonth() } }),
  ]);
  return { total, active, inactive: total - active, newThisMonth };
}

export interface AttendanceReport {
  todayRate: number;
  weekRate: number;
  monthRate: number;
  byClass: { className: string; present: number; absent: number; rate: number }[];
}

export async function getAttendanceReport(): Promise<AttendanceReport> {
  await requirePermission("REPORTS_VIEW");
  await connectToDatabase();

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  async function rateSince(since: Date) {
    const [present, total] = await Promise.all([
      Attendance.countDocuments({ date: { $gte: since }, status: "PRESENT" }),
      Attendance.countDocuments({ date: { $gte: since } }),
    ]);
    return total === 0 ? 0 : Math.round((present / total) * 1000) / 10;
  }

  const [todayRate, weekRate, monthRate] = await Promise.all([rateSince(today), rateSince(weekAgo), rateSince(monthAgo)]);

  const byClassAgg = await Attendance.aggregate([
    { $match: { date: { $gte: monthAgo } } },
    {
      $group: {
        _id: { class: "$class", status: "$status" },
        count: { $sum: 1 },
      },
    },
    {
      $lookup: { from: "classes", localField: "_id.class", foreignField: "_id", as: "classDoc" },
    },
  ]);

  const byClassMap = new Map<string, { className: string; present: number; absent: number }>();
  for (const row of byClassAgg) {
    const classId = row._id.class.toString();
    const className = row.classDoc[0]?.name ?? "Unknown";
    const entry = byClassMap.get(classId) ?? { className, present: 0, absent: 0 };
    if (row._id.status === "PRESENT") entry.present += row.count;
    else entry.absent += row.count;
    byClassMap.set(classId, entry);
  }

  const byClass = Array.from(byClassMap.values()).map((e) => ({
    ...e,
    rate: e.present + e.absent === 0 ? 0 : Math.round((e.present / (e.present + e.absent)) * 1000) / 10,
  }));

  return { todayRate, weekRate, monthRate, byClass };
}

export interface PaymentReport {
  todayTotal: number;
  monthTotal: number;
  outstandingCount: number;
  outstandingAmount: number;
}

export async function getPaymentReport(): Promise<PaymentReport> {
  await requirePermission("REPORTS_VIEW");
  await connectToDatabase();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayAgg, monthAgg, outstanding] = await Promise.all([
    Payment.aggregate([{ $match: { paymentDate: { $gte: today } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Payment.aggregate([{ $match: { paymentDate: { $gte: startOfMonth() } } }, { $group: { _id: null, total: { $sum: "$amount" } } }]),
    Membership.aggregate([
      { $match: { paymentStatus: { $in: ["UNPAID", "PARTIAL"] }, status: "ACTIVE" } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]),
  ]);

  return {
    todayTotal: todayAgg[0]?.total ?? 0,
    monthTotal: monthAgg[0]?.total ?? 0,
    outstandingCount: outstanding[0]?.count ?? 0,
    outstandingAmount: outstanding[0]?.total ?? 0,
  };
}

export interface MembershipReport {
  active: number;
  expired: number;
  expiringSoon: number;
}

export async function getMembershipReport(): Promise<MembershipReport> {
  await requirePermission("REPORTS_VIEW");
  await connectToDatabase();
  const soon = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const [active, expired, expiringSoon] = await Promise.all([
    Membership.countDocuments({ status: "ACTIVE" }),
    Membership.countDocuments({ status: "EXPIRED" }),
    Membership.countDocuments({ status: "ACTIVE", endDate: { $lte: soon, $gte: new Date() } }),
  ]);
  return { active, expired, expiringSoon };
}

export interface ClassReport {
  className: string;
  instructorName: string;
  days: string[];
  enrolled: number;
  capacity: number;
}

export async function getClassReport(): Promise<ClassReport[]> {
  await requirePermission("REPORTS_VIEW");
  await connectToDatabase();
  const docs = await Class.find({ isActive: true }).populate("instructor", "firstName lastName");
  return docs.map((c) => ({
    className: c.name,
    instructorName: (c.instructor as unknown as { firstName: string; lastName: string })?.firstName
      ? `${(c.instructor as unknown as { firstName: string; lastName: string }).firstName} ${(c.instructor as unknown as { firstName: string; lastName: string }).lastName}`
      : "",
    days: c.trainingDays,
    enrolled: c.enrolledStudents.length,
    capacity: c.maxCapacity,
  }));
}

export async function getInstructorCount() {
  await requirePermission("REPORTS_VIEW");
  await connectToDatabase();
  return Instructor.countDocuments({ isActive: true });
}
