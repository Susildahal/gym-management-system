"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import { Student, type IStudent } from "@/models/Student";
import { studentSchema, type StudentInput } from "@/lib/validations/student";
import { requirePermission, requireSession, ActionError, runAction } from "@/lib/actions/helpers";
import { parsePageParams, type PagedResult } from "@/lib/pagination";
import { genId } from "@/lib/utils";
import { createLinkedUserAccount, type GeneratedCredentials } from "@/lib/actions/user-accounts";

export interface StudentDTO {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  gender?: string;
  guardianName?: string;
  guardianPhone?: string;
  joinDate: string;
  membershipStatus: string;
  isActive: boolean;
  hasAccount: boolean;
  tempPassword?: string;
  username?: string;
}

function toDTO(doc: IStudent): StudentDTO {
  const userDoc = doc.user && typeof doc.user !== "string" && "tempPassword" in doc.user ? doc.user : null;
  return {
    id: doc._id.toString(),
    studentId: doc.studentId,
    firstName: doc.firstName,
    lastName: doc.lastName,
    phone: doc.phone,
    email: doc.email,
    gender: doc.gender,
    guardianName: doc.guardianName,
    guardianPhone: doc.guardianPhone,
    joinDate: doc.joinDate.toISOString(),
    membershipStatus: doc.membershipStatus,
    isActive: doc.isActive,
    hasAccount: !!doc.user,
    tempPassword: userDoc ? (userDoc as any).tempPassword : undefined,
    username: userDoc ? (userDoc as any).username : undefined,
  };
}

export async function listStudents(
  searchParams: Record<string, string | string[] | undefined>
): Promise<PagedResult<StudentDTO>> {
  await requirePermission("STUDENT_VIEW_ALL");
  await connectToDatabase();

  const { page, limit, skip } = parsePageParams(searchParams);
  const search = Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search;
  const status = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;

  const query: Record<string, unknown> = {};
  if (search) {
    const re = new RegExp(search, "i");
    query.$or = [{ firstName: re }, { lastName: re }, { studentId: re }, { phone: re }, { email: re }];
  }
  if (status === "active") query.isActive = true;
  if (status === "inactive") query.isActive = false;

  const [docs, total] = await Promise.all([
    Student.find(query).populate("user").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Student.countDocuments(query),
  ]);

  return { items: docs.map(toDTO), total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getStudent(id: string) {
  await requirePermission("STUDENT_VIEW_ALL");
  await connectToDatabase();
  const doc = await Student.findById(id);
  if (!doc) throw new ActionError("Student not found.");
  return toDTO(doc);
}

export async function createStudent(input: StudentInput) {
  return runAction(async () => {
    await requirePermission("STUDENT_MANAGE");
    const parsed = studentSchema.parse(input);
    await connectToDatabase();

    let studentId = genId("STU");
    // eslint-disable-next-line no-await-in-loop
    while (await Student.exists({ studentId })) studentId = genId("STU");

    const { user, credentials } = await createLinkedUserAccount({
      role: "STUDENT",
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
    });

    const doc = await Student.create({
      ...parsed,
      studentId,
      joinDate: parsed.joinDate ?? new Date(),
      user: user._id,
    });
    revalidatePath("/students");
    return { ...toDTO(doc), credentials };
  });
}

/** For students created before login accounts existed, or if one needs a fresh login. */
export async function createLoginForStudent(id: string) {
  return runAction(async () => {
    await requirePermission("STUDENT_MANAGE");
    await connectToDatabase();
    const doc = await Student.findById(id);
    if (!doc) throw new ActionError("Student not found.");
    if (doc.user) throw new ActionError("This student already has a login.");

    const { user, credentials } = await createLinkedUserAccount({
      role: "STUDENT",
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phone: doc.phone,
    });
    doc.user = user._id;
    await doc.save();

    revalidatePath("/students");
    return { credentials } as { credentials: GeneratedCredentials };
  });
}

export async function updateStudent(id: string, input: StudentInput) {
  return runAction(async () => {
    await requirePermission("STUDENT_MANAGE");
    const parsed = studentSchema.parse(input);
    await connectToDatabase();
    const doc = await Student.findByIdAndUpdate(id, parsed, { new: true });
    if (!doc) throw new ActionError("Student not found.");
    revalidatePath("/students");
    return toDTO(doc);
  });
}

export async function toggleStudentActive(id: string) {
  return runAction(async () => {
    await requirePermission("STUDENT_MANAGE");
    await connectToDatabase();
    const doc = await Student.findById(id);
    if (!doc) throw new ActionError("Student not found.");
    doc.isActive = !doc.isActive;
    await doc.save();
    revalidatePath("/students");
    return toDTO(doc);
  });
}

export async function deleteStudent(id: string) {
  return runAction(async () => {
    await requirePermission("STUDENT_MANAGE");
    await connectToDatabase();
    const doc = await Student.findByIdAndDelete(id);
    if (!doc) throw new ActionError("Student not found.");
    revalidatePath("/students");
    return { id };
  });
}

/** Used by other modules (classes, attendance, payments) to populate select dropdowns. */
export async function listAllActiveStudents() {
  await requireSession();
  await connectToDatabase();
  const docs = await Student.find({ isActive: true }).sort({ firstName: 1 }).limit(500);
  return docs.map(toDTO);
}
