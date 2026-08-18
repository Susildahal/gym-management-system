"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import { Instructor, type IInstructor } from "@/models/Instructor";
import { instructorSchema, type InstructorInput } from "@/lib/validations/instructor";
import { requirePermission, requireSession, ActionError, runAction } from "@/lib/actions/helpers";
import { parsePageParams, type PagedResult } from "@/lib/pagination";
import { genId } from "@/lib/utils";
import { createLinkedUserAccount, type GeneratedCredentials } from "@/lib/actions/user-accounts";

export interface InstructorDTO {
  id: string;
  instructorId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  specialization?: string;
  experienceYears?: number;
  joiningDate: string;
  isActive: boolean;
  hasAccount: boolean;
  tempPassword?: string;
  username?: string;
}

function toDTO(doc: IInstructor): InstructorDTO {
  const userDoc = doc.user && typeof doc.user !== "string" && "tempPassword" in doc.user ? doc.user : null;
  return {
    id: doc._id.toString(),
    instructorId: doc.instructorId,
    firstName: doc.firstName,
    lastName: doc.lastName,
    email: doc.email,
    phone: doc.phone,
    specialization: doc.specialization,
    experienceYears: doc.experienceYears,
    joiningDate: doc.joiningDate.toISOString(),
    isActive: doc.isActive,
    hasAccount: !!doc.user,
    tempPassword: userDoc ? (userDoc as any).tempPassword : undefined,
    username: userDoc ? (userDoc as any).username : undefined,
  };
}

export async function listInstructors(
  searchParams: Record<string, string | string[] | undefined>
): Promise<PagedResult<InstructorDTO>> {
  await requireSession();
  await connectToDatabase();

  const { page, limit, skip } = parsePageParams(searchParams);
  const search = Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search;

  const query: Record<string, unknown> = {};
  if (search) {
    const re = new RegExp(search, "i");
    query.$or = [{ firstName: re }, { lastName: re }, { instructorId: re }, { phone: re }, { email: re }];
  }

  const [docs, total] = await Promise.all([
    Instructor.find(query).populate("user").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Instructor.countDocuments(query),
  ]);

  return { items: docs.map(toDTO), total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function createInstructor(input: InstructorInput) {
  return runAction(async () => {
    await requirePermission("INSTRUCTOR_MANAGE");
    const parsed = instructorSchema.parse(input);
    await connectToDatabase();

    let instructorId = genId("INS");
    // eslint-disable-next-line no-await-in-loop
    while (await Instructor.exists({ instructorId })) instructorId = genId("INS");

    const { user, credentials } = await createLinkedUserAccount({
      role: "INSTRUCTOR",
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
    });

    const doc = await Instructor.create({
      ...parsed,
      instructorId,
      joiningDate: parsed.joiningDate ?? new Date(),
      user: user._id,
    });
    revalidatePath("/instructors");
    return { ...toDTO(doc), credentials };
  });
}

/** For instructors created before login accounts existed, or if one needs a fresh login. */
export async function createLoginForInstructor(id: string) {
  return runAction(async () => {
    await requirePermission("INSTRUCTOR_MANAGE");
    await connectToDatabase();
    const doc = await Instructor.findById(id);
    if (!doc) throw new ActionError("Instructor not found.");
    if (doc.user) throw new ActionError("This instructor already has a login.");

    const { user, credentials } = await createLinkedUserAccount({
      role: "INSTRUCTOR",
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      phone: doc.phone,
    });
    doc.user = user._id;
    await doc.save();

    revalidatePath("/instructors");
    return { credentials } as { credentials: GeneratedCredentials };
  });
}

export async function updateInstructor(id: string, input: InstructorInput) {
  return runAction(async () => {
    await requirePermission("INSTRUCTOR_MANAGE");
    const parsed = instructorSchema.parse(input);
    await connectToDatabase();
    const doc = await Instructor.findByIdAndUpdate(id, parsed, { new: true });
    if (!doc) throw new ActionError("Instructor not found.");
    revalidatePath("/instructors");
    return toDTO(doc);
  });
}

export async function toggleInstructorActive(id: string) {
  return runAction(async () => {
    await requirePermission("INSTRUCTOR_MANAGE");
    await connectToDatabase();
    const doc = await Instructor.findById(id);
    if (!doc) throw new ActionError("Instructor not found.");
    doc.isActive = !doc.isActive;
    await doc.save();
    revalidatePath("/instructors");
    return toDTO(doc);
  });
}

export async function deleteInstructor(id: string) {
  return runAction(async () => {
    await requirePermission("INSTRUCTOR_MANAGE");
    await connectToDatabase();
    const doc = await Instructor.findByIdAndDelete(id);
    if (!doc) throw new ActionError("Instructor not found.");
    revalidatePath("/instructors");
    return { id };
  });
}

/** Used by Classes module to populate the instructor select dropdown. */
export async function listAllActiveInstructors() {
  await requireSession();
  await connectToDatabase();
  const docs = await Instructor.find({ isActive: true }).sort({ firstName: 1 }).limit(500);
  return docs.map(toDTO);
}
