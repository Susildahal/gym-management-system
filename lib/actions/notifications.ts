"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import { Notification } from "@/models/Notification";
import { requireSession, ActionError, runAction } from "@/lib/actions/helpers";

export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toDTO(doc: any): NotificationDTO {
  return {
    id: doc._id.toString(),
    type: doc.type,
    title: doc.title,
    message: doc.message,
    link: doc.link,
    isRead: doc.isRead,
    createdAt: doc.createdAt.toISOString(),
  };
}

export async function listMyNotifications() {
  const session = await requireSession();
  await connectToDatabase();
  const docs = await Notification.find({ user: session.user.id }).sort({ createdAt: -1 }).limit(100);
  return docs.map(toDTO);
}

export async function getUnreadCount() {
  const session = await requireSession();
  await connectToDatabase();
  return Notification.countDocuments({ user: session.user.id, isRead: false });
}

export async function markNotificationRead(id: string) {
  return runAction(async () => {
    const session = await requireSession();
    await connectToDatabase();
    const doc = await Notification.findOne({ _id: id, user: session.user.id });
    if (!doc) throw new ActionError("Notification not found.");
    doc.isRead = true;
    await doc.save();
    revalidatePath("/notifications");
    return { id };
  });
}

export async function markAllNotificationsRead() {
  return runAction(async () => {
    const session = await requireSession();
    await connectToDatabase();
    await Notification.updateMany({ user: session.user.id, isRead: false }, { $set: { isRead: true } });
    revalidatePath("/notifications");
    return { success: true };
  });
}

/** Create a notification for a user — called by other modules (e.g. notice publish, membership expiry jobs). */
export async function createNotification(input: {
  userId: string;
  type: "NOTICE" | "CLASS_REMINDER" | "MEMBERSHIP_EXPIRING" | "PAYMENT_DUE" | "GENERAL";
  title: string;
  message: string;
  link?: string;
}) {
  await connectToDatabase();
  await Notification.create({
    user: input.userId,
    type: input.type,
    title: input.title,
    message: input.message,
    link: input.link,
  });
}
