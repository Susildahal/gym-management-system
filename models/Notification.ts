import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface INotification extends Document {
  user: Types.ObjectId;
  type: "NOTICE" | "CLASS_REMINDER" | "MEMBERSHIP_EXPIRING" | "PAYMENT_DUE" | "GENERAL";
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["NOTICE", "CLASS_REMINDER", "MEMBERSHIP_EXPIRING", "PAYMENT_DUE", "GENERAL"],
      default: "GENERAL",
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });

export const Notification: Model<INotification> =
  models.Notification || model<INotification>("Notification", NotificationSchema);
