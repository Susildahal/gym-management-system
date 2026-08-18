"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import { Payment } from "@/models/Payment";
import { Student } from "@/models/Student";
import { paymentSchema, type PaymentInput } from "@/lib/validations/payment";
import { requirePermission, requireSession, ActionError, runAction } from "@/lib/actions/helpers";
import { parsePageParams, type PagedResult } from "@/lib/pagination";
import { genId } from "@/lib/utils";
import { createNotification } from "@/lib/actions/notifications";

export interface PaymentDTO {
  id: string;
  receiptNumber: string;
  studentId: string;
  studentName: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  paymentFor: string;
  remarks?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(doc: any): PaymentDTO {
  return {
    id: doc._id.toString(),
    receiptNumber: doc.receiptNumber,
    studentId: doc.student?._id?.toString() ?? doc.student?.toString(),
    studentName: doc.student?.firstName ? `${doc.student.firstName} ${doc.student.lastName}` : "",
    amount: doc.amount,
    paymentDate: doc.paymentDate.toISOString(),
    paymentMethod: doc.paymentMethod,
    paymentFor: doc.paymentFor,
    remarks: doc.remarks,
  };
}

export async function listPayments(
  searchParams: Record<string, string | string[] | undefined>
): Promise<PagedResult<PaymentDTO>> {
  const session = await requireSession();
  await connectToDatabase();

  const { page, limit, skip } = parsePageParams(searchParams);
  const search = Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search;

  const query: Record<string, unknown> = {};

  if (session.user.role === "STUDENT") {
    const self = await Student.findOne({ user: session.user.id });
    query.student = self?._id ?? null;
  }

  if (search) {
    query.receiptNumber = new RegExp(search, "i");
  }

  const [docs, total] = await Promise.all([
    Payment.find(query).populate("student", "firstName lastName").sort({ paymentDate: -1 }).skip(skip).limit(limit),
    Payment.countDocuments(query),
  ]);

  return { items: docs.map(toDTO), total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

export async function createPayment(input: PaymentInput) {
  return runAction(async () => {
    const session = await requirePermission("PAYMENT_MANAGE");
    const parsed = paymentSchema.parse(input);
    await connectToDatabase();

    let receiptNumber = genId("RCPT");
    // eslint-disable-next-line no-await-in-loop
    while (await Payment.exists({ receiptNumber })) receiptNumber = genId("RCPT");

    const doc = await Payment.create({
      ...parsed,
      receiptNumber,
      recordedBy: session.user.id,
      membership: parsed.membership || undefined,
    });

    const studentDoc = await Student.findById(parsed.student).select("user");
    if (studentDoc?.user) {
      await createNotification({
        userId: studentDoc.user.toString(),
        type: "GENERAL",
        title: "Payment recorded",
        message: `Receipt ${receiptNumber} — Rs. ${parsed.amount.toLocaleString()} for ${parsed.paymentFor}`,
        link: "/payments",
      });
    }

    revalidatePath("/payments");
    revalidatePath("/notifications");
    return toDTO(await doc.populate("student", "firstName lastName"));
  });
}

export async function updatePayment(id: string, input: PaymentInput) {
  return runAction(async () => {
    await requirePermission("PAYMENT_MANAGE");
    const parsed = paymentSchema.parse(input);
    await connectToDatabase();
    const doc = await Payment.findByIdAndUpdate(id, parsed, { new: true }).populate("student", "firstName lastName");
    if (!doc) throw new ActionError("Payment not found.");
    revalidatePath("/payments");
    return toDTO(doc);
  });
}

export async function listPaymentsForStudent(studentId: string) {
  const session = await requireSession();
  if (session.user.role === "STUDENT") {
    const self = await Student.findOne({ user: session.user.id });
    if (!self || self._id.toString() !== studentId) throw new ActionError("You can only view your own payments.");
  }
  await connectToDatabase();
  const docs = await Payment.find({ student: studentId }).populate("student", "firstName lastName").sort({ paymentDate: -1 });
  return docs.map(toDTO);
}
export async function deletePayment(id: string) {
  return runAction(async () => {
    await requirePermission("PAYMENT_MANAGE");
    await connectToDatabase();
    const doc = await Payment.findByIdAndDelete(id);
    if (!doc) throw new ActionError("Payment not found.");
    revalidatePath("/payments");
    return { id };
  });
}
