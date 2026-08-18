"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import { MembershipPlan, type IMembershipPlan } from "@/models/MembershipPlan";
import { Membership, type IMembership } from "@/models/Membership";
import { Student } from "@/models/Student";
import { membershipPlanSchema, membershipSchema, type MembershipPlanInput, type MembershipInput } from "@/lib/validations/membership";
import { requirePermission, requireSession, ActionError, runAction } from "@/lib/actions/helpers";
import { parsePageParams, type PagedResult } from "@/lib/pagination";

// ---------- Membership Plans ----------

export interface MembershipPlanDTO {
  id: string;
  planName: string;
  durationMonths: number;
  price: number;
  description?: string;
  isActive: boolean;
}

function planToDTO(doc: IMembershipPlan): MembershipPlanDTO {
  return {
    id: doc._id.toString(),
    planName: doc.planName,
    durationMonths: doc.durationMonths,
    price: doc.price,
    description: doc.description,
    isActive: doc.isActive,
  };
}

export async function listMembershipPlans(): Promise<MembershipPlanDTO[]> {
  await requireSession();
  await connectToDatabase();
  const docs = await MembershipPlan.find().sort({ price: 1 });
  return docs.map(planToDTO);
}

export async function createMembershipPlan(input: MembershipPlanInput) {
  return runAction(async () => {
    await requirePermission("MEMBERSHIP_MANAGE");
    const parsed = membershipPlanSchema.parse(input);
    await connectToDatabase();
    const doc = await MembershipPlan.create(parsed);
    revalidatePath("/memberships");
    return planToDTO(doc);
  });
}

export async function updateMembershipPlan(id: string, input: MembershipPlanInput) {
  return runAction(async () => {
    await requirePermission("MEMBERSHIP_MANAGE");
    const parsed = membershipPlanSchema.parse(input);
    await connectToDatabase();
    const doc = await MembershipPlan.findByIdAndUpdate(id, parsed, { new: true });
    if (!doc) throw new ActionError("Membership plan not found.");
    revalidatePath("/memberships");
    return planToDTO(doc);
  });
}

export async function togglePlanActive(id: string) {
  return runAction(async () => {
    await requirePermission("MEMBERSHIP_MANAGE");
    await connectToDatabase();
    const doc = await MembershipPlan.findById(id);
    if (!doc) throw new ActionError("Membership plan not found.");
    doc.isActive = !doc.isActive;
    await doc.save();
    revalidatePath("/memberships");
    return { id };
  });
}

// ---------- Student Memberships ----------

export interface MembershipDTO {
  id: string;
  studentId: string;
  studentName: string;
  planName: string;
  startDate: string;
  endDate: string;
  amount: number;
  paymentStatus: string;
  status: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function membershipToDTO(doc: any): MembershipDTO {
  return {
    id: doc._id.toString(),
    studentId: doc.student?._id?.toString() ?? doc.student?.toString(),
    studentName: doc.student?.firstName ? `${doc.student.firstName} ${doc.student.lastName}` : "",
    planName: doc.plan?.planName ?? "",
    startDate: doc.startDate.toISOString(),
    endDate: doc.endDate.toISOString(),
    amount: doc.amount,
    paymentStatus: doc.paymentStatus,
    status: doc.status,
  };
}

/** Recompute EXPIRED status for any membership whose end date has passed. */
async function syncExpiredMemberships() {
  await Membership.updateMany(
    { status: "ACTIVE", endDate: { $lt: new Date() } },
    { $set: { status: "EXPIRED" } }
  );
}

export async function listMemberships(
  searchParams: Record<string, string | string[] | undefined>
): Promise<PagedResult<MembershipDTO>> {
  await requirePermission("MEMBERSHIP_MANAGE");
  await connectToDatabase();
  await syncExpiredMemberships();

  const { page, limit, skip } = parsePageParams(searchParams);
  const status = Array.isArray(searchParams.status) ? searchParams.status[0] : searchParams.status;

  const query: Record<string, unknown> = {};
  if (status) query.status = status;

  const [docs, total] = await Promise.all([
    Membership.find(query)
      .populate("student", "firstName lastName")
      .populate("plan", "planName")
      .sort({ endDate: 1 })
      .skip(skip)
      .limit(limit),
    Membership.countDocuments(query),
  ]);

  return { items: docs.map(membershipToDTO), total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function getStudentMembership(studentId: string) {
  const session = await requireSession();
  if (session.user.role === "STUDENT") {
    const self = await Student.findOne({ user: session.user.id });
    if (!self || self._id.toString() !== studentId) throw new ActionError("You can only view your own membership.");
  }
  await connectToDatabase();
  await syncExpiredMemberships();
  const doc = await Membership.findOne({ student: studentId })
    .populate("student", "firstName lastName")
    .populate("plan", "planName")
    .sort({ endDate: -1 });
  return doc ? membershipToDTO(doc) : null;
}

export async function createMembership(input: MembershipInput) {
  return runAction(async () => {
    await requirePermission("MEMBERSHIP_MANAGE");
    const parsed = membershipSchema.parse(input);
    await connectToDatabase();

    const doc = await Membership.create({
      ...parsed,
      status: "ACTIVE",
    });
    await Student.findByIdAndUpdate(parsed.student, { membershipStatus: "ACTIVE" });

    revalidatePath("/memberships");
    return membershipToDTO(await doc.populate(["student", "plan"]));
  });
}

export async function updateMembershipStatus(id: string, status: IMembership["status"]) {
  return runAction(async () => {
    await requirePermission("MEMBERSHIP_MANAGE");
    await connectToDatabase();
    const doc = await Membership.findByIdAndUpdate(id, { status }, { new: true });
    if (!doc) throw new ActionError("Membership not found.");
    if (status !== "ACTIVE") {
      await Student.findByIdAndUpdate(doc.student, { membershipStatus: status === "EXPIRED" ? "EXPIRED" : "NONE" });
    } else {
      await Student.findByIdAndUpdate(doc.student, { membershipStatus: "ACTIVE" });
    }
    revalidatePath("/memberships");
    return { id };
  });
}

export async function deleteMembership(id: string) {
  return runAction(async () => {
    await requirePermission("MEMBERSHIP_MANAGE");
    await connectToDatabase();
    const doc = await Membership.findByIdAndDelete(id);
    if (!doc) throw new ActionError("Membership not found.");
    revalidatePath("/memberships");
    return { id };
  });
}
