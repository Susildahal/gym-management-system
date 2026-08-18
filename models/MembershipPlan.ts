import { Schema, model, models, type Model, type Document } from "mongoose";

export interface IMembershipPlan extends Document {
  planName: string;
  durationMonths: number;
  price: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MembershipPlanSchema = new Schema<IMembershipPlan>(
  {
    planName: { type: String, required: true, unique: true },
    durationMonths: { type: Number, required: true },
    price: { type: Number, required: true },
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const MembershipPlan: Model<IMembershipPlan> =
  models.MembershipPlan || model<IMembershipPlan>("MembershipPlan", MembershipPlanSchema);
