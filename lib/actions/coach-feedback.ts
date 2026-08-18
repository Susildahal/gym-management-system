"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import { CoachFeedback } from "@/models/CoachFeedback";
import { Instructor } from "@/models/Instructor";
import { Student } from "@/models/Student";
import { Class } from "@/models/Class";
import { coachFeedbackSchema, type CoachFeedbackInput } from "@/lib/validations/coach-feedback";
import { requirePermission, requireSession, ActionError, runAction } from "@/lib/actions/helpers";
import { parsePageParams, type PagedResult } from "@/lib/pagination";
import { createNotification } from "@/lib/actions/notifications";

export interface CoachFeedbackDTO {
  id: string;
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  date: string;
  comment: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(doc: any): CoachFeedbackDTO {
  return {
    id: doc._id.toString(),
    studentId: doc.student?._id?.toString() ?? doc.student?.toString(),
    studentName: doc.student?.firstName ? `${doc.student.firstName} ${doc.student.lastName}` : "",
    instructorId: doc.instructor?._id?.toString() ?? doc.instructor?.toString(),
    instructorName: doc.instructor?.firstName ? `${doc.instructor.firstName} ${doc.instructor.lastName}` : "",
    date: doc.date.toISOString(),
    comment: doc.comment,
  };
}

async function resolveOwnInstructor(userId: string) {
  await connectToDatabase();
  return Instructor.findOne({ user: userId });
}

async function resolveOwnStudent(userId: string) {
  await connectToDatabase();
  return Student.findOne({ user: userId });
}

export async function listCoachFeedback(
  searchParams: Record<string, string | string[] | undefined>
): Promise<PagedResult<CoachFeedbackDTO>> {
  const session = await requireSession();
  await connectToDatabase();

  const { page, limit, skip } = parsePageParams(searchParams);
  const query: Record<string, unknown> = {};

  if (session.user.role === "STUDENT") {
    const self = await resolveOwnStudent(session.user.id);
    query.student = self?._id ?? null;
  } else if (session.user.role === "INSTRUCTOR") {
    const self = await resolveOwnInstructor(session.user.id);
    // Instructors see feedback they've given, plus feedback for their assigned students.
    const assignedClasses = await Class.find({ instructor: self?._id }).select("enrolledStudents");
    const assignedStudentIds = assignedClasses.flatMap((c) => c.enrolledStudents.map((s) => s.toString()));
    query.$or = [{ instructor: self?._id }, { student: { $in: assignedStudentIds } }];
  }

  const [docs, total] = await Promise.all([
    CoachFeedback.find(query)
      .populate("student", "firstName lastName")
      .populate("instructor", "firstName lastName")
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit),
    CoachFeedback.countDocuments(query),
  ]);

  return { items: docs.map(toDTO), total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function listFeedbackForStudent(studentId: string) {
  const session = await requireSession();
  if (session.user.role === "STUDENT") {
    const self = await resolveOwnStudent(session.user.id);
    if (!self || self._id.toString() !== studentId) throw new ActionError("You can only view your own feedback.");
  }
  await connectToDatabase();
  const docs = await CoachFeedback.find({ student: studentId })
    .populate("student", "firstName lastName")
    .populate("instructor", "firstName lastName")
    .sort({ date: -1 });
  return docs.map(toDTO);
}

export async function createCoachFeedback(input: CoachFeedbackInput) {
  return runAction(async () => {
    const session = await requirePermission("FEEDBACK_CREATE");
    const parsed = coachFeedbackSchema.parse(input);
    await connectToDatabase();

    let instructorId: string;
    if (session.user.role === "ADMIN") {
      const anyInstructor = await Instructor.findOne();
      if (!anyInstructor) throw new ActionError("No instructor profile exists to attribute this feedback to.");
      instructorId = anyInstructor._id.toString();
    } else {
      const self = await resolveOwnInstructor(session.user.id);
      if (!self) throw new ActionError("Your account isn't linked to an instructor profile.");
      instructorId = self._id.toString();
    }

    const doc = await CoachFeedback.create({
      student: parsed.student,
      instructor: instructorId,
      date: parsed.date ?? new Date(),
      comment: parsed.comment,
    });

    const studentDoc = await Student.findById(parsed.student).select("user firstName");
    if (studentDoc?.user) {
      await createNotification({
        userId: studentDoc.user.toString(),
        type: "GENERAL",
        title: "New coach feedback",
        message: parsed.comment.slice(0, 140),
        link: "/coach-feedback",
      });
    }

    revalidatePath("/coach-feedback");
    revalidatePath("/notifications");
    return toDTO(await doc.populate(["student", "instructor"]));
  });
}

export async function updateCoachFeedback(id: string, input: CoachFeedbackInput) {
  return runAction(async () => {
    await requirePermission("FEEDBACK_CREATE");
    const parsed = coachFeedbackSchema.parse(input);
    await connectToDatabase();
    const doc = await CoachFeedback.findByIdAndUpdate(
      id,
      { student: parsed.student, comment: parsed.comment, date: parsed.date },
      { new: true }
    ).populate(["student", "instructor"]);
    if (!doc) throw new ActionError("Feedback not found.");
    revalidatePath("/coach-feedback");
    return toDTO(doc);
  });
}

export async function deleteCoachFeedback(id: string) {
  return runAction(async () => {
    await requirePermission("FEEDBACK_CREATE");
    await connectToDatabase();
    const doc = await CoachFeedback.findByIdAndDelete(id);
    if (!doc) throw new ActionError("Feedback not found.");
    revalidatePath("/coach-feedback");
    return { id };
  });
}
