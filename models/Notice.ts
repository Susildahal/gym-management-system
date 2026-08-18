import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import type { NoticeAudience, NoticePriority } from "@/types";

export interface INotice extends Document {
  title: string;
  content: string;
  priority: NoticePriority;
  targetAudience: NoticeAudience;
  publishedDate: Date;
  expiryDate?: Date;
  isPublished: boolean;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    priority: { type: String, enum: ["LOW", "NORMAL", "HIGH", "URGENT"], default: "NORMAL" },
    targetAudience: {
      type: String,
      enum: ["EVERYONE", "STUDENTS", "INSTRUCTORS"],
      default: "EVERYONE",
    },
    publishedDate: { type: Date, default: Date.now },
    expiryDate: { type: Date },
    isPublished: { type: Boolean, default: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

NoticeSchema.index({ isPublished: 1, targetAudience: 1 });
NoticeSchema.index({ publishedDate: -1 });

export const Notice: Model<INotice> = models.Notice || model<INotice>("Notice", NoticeSchema);
