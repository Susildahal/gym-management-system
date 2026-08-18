"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import { Class, type IClass } from "@/models/Class";
import { classSchema, type ClassInput } from "@/lib/validations/class";
import { requirePermission, requireSession, ActionError, runAction } from "@/lib/actions/helpers";
import { parsePageParams, type PagedResult } from "@/lib/pagination";

export interface ClassDTO {
  id: string;
  name: string;
  classType: string;
  trainingLevel: string;
  instructorId: string;
  instructorName: string;
  trainingDays: string[];
  startTime: string;
  endTime: string;
  location: string;
  maxCapacity: number;
  enrolledCount: number;
  enrolledStudentIds: string[];
  description?: string;
  isActive: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(doc: any): ClassDTO {
  return {
    id: doc._id.toString(),
    name: doc.name,
    classType: doc.classType,
    trainingLevel: doc.trainingLevel,
    instructorId: doc.instructor?._id?.toString() ?? doc.instructor?.toString() ?? "",
    instructorName: doc.instructor?.firstName ? `${doc.instructor.firstName} ${doc.instructor.lastName}` : "",
    trainingDays: doc.trainingDays,
    startTime: doc.startTime,
    endTime: doc.endTime,
    location: doc.location,
    maxCapacity: doc.maxCapacity,
    enrolledCount: doc.enrolledStudents?.length ?? 0,
    enrolledStudentIds: (doc.enrolledStudents ?? []).map((s: unknown) => String(s)),
    description: doc.description,
    isActive: doc.isActive,
  };
}

export async function listClasses(
  searchParams: Record<string, string | string[] | undefined>
): Promise<PagedResult<ClassDTO>> {
  await requireSession();
  await connectToDatabase();

  const { page, limit, skip } = parsePageParams(searchParams);
  const search = Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search;

  const query: Record<string, unknown> = {};
  if (search) {
    const re = new RegExp(search, "i");
    query.$or = [{ name: re }, { classType: re }, { location: re }];
  }

  const [docs, total] = await Promise.all([
    Class.find(query).populate("instructor", "firstName lastName").sort({ createdAt: -1 }).skip(skip).limit(limit),
    Class.countDocuments(query),
  ]);

  return { items: docs.map(toDTO), total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

/** All active classes, unpaginated — used for schedule views and the attendance class picker. */
const DEFAULT_CLASS_TYPES = [
  "Beginner Sanda",
  "Intermediate Sanda",
  "Advanced Sanda",
  "Wushu Training",
  "Taichi Training",
  "Kids Training",
  "Fitness Training",
];

/** Distinct class types currently in use, merged with sensible defaults — powers the Class Type field's suggestions. */
export async function listClassTypes(): Promise<string[]> {
  await requireSession();
  await connectToDatabase();
  const distinct = await Class.distinct("classType");
  const merged = Array.from(new Set([...distinct, ...DEFAULT_CLASS_TYPES])).sort();
  return merged;
}

export async function listAllActiveClasses() {
  await requireSession();
  await connectToDatabase();
  const docs = await Class.find({ isActive: true }).populate("instructor", "firstName lastName").sort({ name: 1 });
  return docs.map(toDTO);
}

function hasScheduleConflict(existing: IClass[], input: ClassInput, excludeId?: string) {
  const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) => aStart < bEnd && bStart < aEnd;
  return existing.some((c) => {
    if (excludeId && c._id.toString() === excludeId) return false;
    if (c.instructor.toString() !== input.instructor) return false;
    if (c.location !== input.location && c.instructor.toString() !== input.instructor) return false;
    const sameDay = c.trainingDays.some((d) => (input.trainingDays as string[]).includes(d));
    if (!sameDay) return false;
    return overlaps(c.startTime, c.endTime, input.startTime, input.endTime);
  });
}

export async function createClass(input: ClassInput) {
  return runAction(async () => {
    await requirePermission("CLASS_MANAGE");
    const parsed = classSchema.parse(input);
    await connectToDatabase();

    const instructorClasses = await Class.find({ instructor: parsed.instructor, isActive: true });
    if (hasScheduleConflict(instructorClasses, parsed)) {
      throw new ActionError("This instructor already has a class scheduled at an overlapping time.");
    }

    const doc = await Class.create(parsed);
    revalidatePath("/classes");
    return toDTO(await doc.populate("instructor", "firstName lastName"));
  });
}

export async function updateClass(id: string, input: ClassInput) {
  return runAction(async () => {
    await requirePermission("CLASS_MANAGE");
    const parsed = classSchema.parse(input);
    await connectToDatabase();

    const instructorClasses = await Class.find({ instructor: parsed.instructor, isActive: true });
    if (hasScheduleConflict(instructorClasses, parsed, id)) {
      throw new ActionError("This instructor already has a class scheduled at an overlapping time.");
    }

    const doc = await Class.findByIdAndUpdate(id, parsed, { new: true }).populate("instructor", "firstName lastName");
    if (!doc) throw new ActionError("Class not found.");
    revalidatePath("/classes");
    return toDTO(doc);
  });
}

export async function toggleClassActive(id: string) {
  return runAction(async () => {
    await requirePermission("CLASS_MANAGE");
    await connectToDatabase();
    const doc = await Class.findById(id);
    if (!doc) throw new ActionError("Class not found.");
    doc.isActive = !doc.isActive;
    await doc.save();
    revalidatePath("/classes");
    return { id };
  });
}

export async function deleteClass(id: string) {
  return runAction(async () => {
    await requirePermission("CLASS_MANAGE");
    await connectToDatabase();
    const doc = await Class.findByIdAndDelete(id);
    if (!doc) throw new ActionError("Class not found.");
    revalidatePath("/classes");
    return { id };
  });
}

export async function assignStudentsToClass(classId: string, studentIds: string[]) {
  return runAction(async () => {
    await requirePermission("CLASS_MANAGE");
    await connectToDatabase();
    const doc = await Class.findById(classId);
    if (!doc) throw new ActionError("Class not found.");
    if (studentIds.length > doc.maxCapacity) {
      throw new ActionError(`This class's capacity is ${doc.maxCapacity} students.`);
    }
    doc.enrolledStudents = studentIds as unknown as IClass["enrolledStudents"];
    await doc.save();
    revalidatePath("/classes");
    return { id: classId };
  });
}
