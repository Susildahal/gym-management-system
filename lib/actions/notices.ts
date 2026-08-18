"use server";

import { revalidatePath } from "next/cache";
import connectToDatabase from "@/lib/mongodb";
import { Notice, type INotice } from "@/models/Notice";
import { User } from "@/models/User";
import { noticeSchema, type NoticeInput } from "@/lib/validations/notice";
import { requirePermission, requireSession, ActionError, runAction } from "@/lib/actions/helpers";
import { parsePageParams, type PagedResult } from "@/lib/pagination";
import { createNotification } from "@/lib/actions/notifications";
import type { Role } from "@/types";

export interface NoticeDTO {
  id: string;
  title: string;
  content: string;
  priority: string;
  targetAudience: string;
  publishedDate: string;
  expiryDate?: string;
  isPublished: boolean;
}

function toDTO(doc: INotice): NoticeDTO {
  return {
    id: doc._id.toString(),
    title: doc.title,
    content: doc.content,
    priority: doc.priority,
    targetAudience: doc.targetAudience,
    publishedDate: doc.publishedDate.toISOString(),
    expiryDate: doc.expiryDate?.toISOString(),
    isPublished: doc.isPublished,
  };
}

function audienceForRole(role: Role) {
  if (role === "ADMIN") return null; // admins see everything, no filter
  return role === "INSTRUCTOR" ? ["EVERYONE", "INSTRUCTORS"] : ["EVERYONE", "STUDENTS"];
}

export async function listNotices(
  searchParams: Record<string, string | string[] | undefined>
): Promise<PagedResult<NoticeDTO>> {
  const session = await requireSession();
  await connectToDatabase();

  const { page, limit, skip } = parsePageParams(searchParams);
  const search = Array.isArray(searchParams.search) ? searchParams.search[0] : searchParams.search;

  const query: Record<string, unknown> = {};
  const audiences = audienceForRole(session.user.role);
  if (audiences) {
    query.targetAudience = { $in: audiences };
    query.isPublished = true;
    query.$or = [{ expiryDate: { $exists: false } }, { expiryDate: null }, { expiryDate: { $gte: new Date() } }];
  }
  if (search) {
    query.title = new RegExp(search, "i");
  }

  const [docs, total] = await Promise.all([
    Notice.find(query).sort({ publishedDate: -1 }).skip(skip).limit(limit),
    Notice.countDocuments(query),
  ]);

  return { items: docs.map(toDTO), total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

/** Small set of active notices for dashboards. */
export async function listRecentNotices(limit = 5) {
  const session = await requireSession();
  await connectToDatabase();
  const audiences = audienceForRole(session.user.role);
  const query: Record<string, unknown> = {};
  if (audiences) {
    query.targetAudience = { $in: audiences };
    query.isPublished = true;
  }
  const docs = await Notice.find(query).sort({ publishedDate: -1 }).limit(limit);
  return docs.map(toDTO);
}

export async function createNotice(input: NoticeInput) {
  return runAction(async () => {
    const session = await requirePermission("NOTICE_MANAGE");
    const parsed = noticeSchema.parse(input);
    await connectToDatabase();
    const doc = await Notice.create({ ...parsed, createdBy: session.user.id });

    if (doc.isPublished) {
      await notifyAudience(doc);
    }

    revalidatePath("/notices");
    revalidatePath("/notifications");
    return toDTO(doc);
  });
}

async function notifyAudience(notice: INotice) {
  const roleFilter: Role[] =
    notice.targetAudience === "EVERYONE"
      ? ["ADMIN", "INSTRUCTOR", "STUDENT"]
      : notice.targetAudience === "STUDENTS"
        ? ["STUDENT"]
        : ["INSTRUCTOR"];

  const recipients = await User.find({ role: { $in: roleFilter }, isActive: true }).select("_id");

  await Promise.all(
    recipients.map((u) =>
      createNotification({
        userId: u._id.toString(),
        type: "NOTICE",
        title: notice.title,
        message: notice.content.slice(0, 140),
        link: "/notices",
      })
    )
  );
}

export async function updateNotice(id: string, input: NoticeInput) {
  return runAction(async () => {
    await requirePermission("NOTICE_MANAGE");
    const parsed = noticeSchema.parse(input);
    await connectToDatabase();
    const doc = await Notice.findByIdAndUpdate(id, parsed, { new: true });
    if (!doc) throw new ActionError("Notice not found.");
    revalidatePath("/notices");
    return toDTO(doc);
  });
}

export async function toggleNoticePublished(id: string) {
  return runAction(async () => {
    await requirePermission("NOTICE_MANAGE");
    await connectToDatabase();
    const doc = await Notice.findById(id);
    if (!doc) throw new ActionError("Notice not found.");
    const wasPublished = doc.isPublished;
    doc.isPublished = !doc.isPublished;
    await doc.save();

    if (!wasPublished && doc.isPublished) {
      await notifyAudience(doc);
      revalidatePath("/notifications");
    }

    revalidatePath("/notices");
    return { id };
  });
}

export async function deleteNotice(id: string) {
  return runAction(async () => {
    await requirePermission("NOTICE_MANAGE");
    await connectToDatabase();
    const doc = await Notice.findByIdAndDelete(id);
    if (!doc) throw new ActionError("Notice not found.");
    revalidatePath("/notices");
    return { id };
  });
}
