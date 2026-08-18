"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import { Attendance } from "@/models/Attendance";
import { Class } from "@/models/Class";
import { Student } from "@/models/Student";
import { markAttendanceSchema, type MarkAttendanceInput } from "@/lib/validations/attendance";
import { requirePermission, requireSession, ActionError, runAction } from "@/lib/actions/helpers";
import { parsePageParams, type PagedResult } from "@/lib/pagination";
import type { AttendanceStatus } from "@/types";

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export interface RosterEntry {
  studentId: string;
  studentName: string;
  status: AttendanceStatus | null;
  remarks?: string;
}

export async function getClassRoster(classId: string, date: string): Promise<RosterEntry[]> {
  await requirePermission("ATTENDANCE_MARK");
  await connectToDatabase();

  const cls = await Class.findById(classId).populate("enrolledStudents", "firstName lastName");
  if (!cls) throw new ActionError("Class not found.");

  const day = new Date(date);
  const existing = await Attendance.find({
    class: classId,
    date: { $gte: startOfDay(day), $lte: endOfDay(day) },
  });
  const byStudent = new Map(existing.map((a) => [a.student.toString(), a]));

  return (cls.enrolledStudents as unknown as { _id: string; firstName: string; lastName: string }[]).map((s) => {
    const rec = byStudent.get(s._id.toString());
    return {
      studentId: s._id.toString(),
      studentName: `${s.firstName} ${s.lastName}`,
      status: (rec?.status as AttendanceStatus) ?? null,
      remarks: rec?.remarks,
    };
  });
}

export async function markAttendance(input: MarkAttendanceInput) {
  return runAction(async () => {
    const session = await requirePermission("ATTENDANCE_MARK");
    const parsed = markAttendanceSchema.parse(input);
    await connectToDatabase();

    const day = startOfDay(parsed.date);

    await Promise.all(
      parsed.entries.map((entry) =>
        Attendance.findOneAndUpdate(
          { student: entry.student, class: parsed.class, date: day },
          {
            student: entry.student,
            class: parsed.class,
            date: day,
            status: entry.status,
            remarks: entry.remarks,
            markedBy: session.user.id,
          },
          { upsert: true, new: true }
        )
      )
    );

    revalidatePath("/attendance");
    return { count: parsed.entries.length };
  });
}

export interface AttendanceRecordDTO {
  id: string;
  date: string;
  className: string;
  status: AttendanceStatus;
  remarks?: string;
}

export async function listAttendanceForStudent(
  studentId: string,
  searchParams: Record<string, string | string[] | undefined>
): Promise<PagedResult<AttendanceRecordDTO>> {
  const session = await requireSession();
  // Students may only view their own attendance; admins/instructors can view anyone's.
  if (session.user.role === "STUDENT") {
    const self = await Student.findOne({ user: session.user.id });
    if (!self || self._id.toString() !== studentId) {
      throw new ActionError("You can only view your own attendance.");
    }
  }

  await connectToDatabase();
  const { page, limit, skip } = parsePageParams(searchParams);

  const [docs, total] = await Promise.all([
    Attendance.find({ student: studentId })
      .populate("class", "name")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    Attendance.countDocuments({ student: studentId }),
  ]);

  const items = docs.map((d) => ({
    id: d._id.toString(),
    date: d.date.toISOString(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    className: (d.class as any)?.name ?? "Class",
    status: d.status,
    remarks: d.remarks,
  }));

  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  rate: number;
}

export async function getStudentAttendanceStats(studentId: string): Promise<AttendanceStats> {
  await requireSession();
  await connectToDatabase();
  const [total, present] = await Promise.all([
    Attendance.countDocuments({ student: studentId }),
    Attendance.countDocuments({ student: studentId, status: "PRESENT" }),
  ]);
  const absent = total - present;
  const rate = total === 0 ? 0 : Math.round((present / total) * 1000) / 10;
  return { total, present, absent, rate };
}

/** Resolve the Student document linked to the current logged-in user (for STUDENT role pages). */
export async function getOwnStudentRecord() {
  const session = await requireSession();
  if (session.user.role !== "STUDENT") return null;
  await connectToDatabase();
  const doc = await Student.findOne({ user: session.user.id });
  return doc ? { id: doc._id.toString(), firstName: doc.firstName, lastName: doc.lastName } : null;
}
