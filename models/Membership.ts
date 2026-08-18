import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import type { MembershipStatus } from "@/types";

export interface IMembership extends Document {
  student: Types.ObjectId;
  plan: Types.ObjectId;
  startDate: Date;
  endDate: Date;
  amount: number;
  paymentStatus: "PAID" | "PARTIAL" | "UNPAID";
  status: MembershipStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipSchema = new Schema<IMembership>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    plan: { type: Schema.Types.ObjectId, ref: "MembershipPlan", required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    amount: { type: Number, required: true },
    paymentStatus: { type: String, enum: ["PAID", "PARTIAL", "UNPAID"], default: "UNPAID" },
    status: {
      type: String,
      enum: ["ACTIVE", "EXPIRED", "SUSPENDED", "CANCELLED"],
      default: "ACTIVE",
    },
  },
  { timestamps: true }
);

MembershipSchema.index({ student: 1 });
MembershipSchema.index({ endDate: 1 });
MembershipSchema.index({ status: 1 });

export const Membership: Model<IMembership> =
  models.Membership || model<IMembership>("Membership", MembershipSchema);
