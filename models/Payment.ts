import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import type { PaymentMethod } from "@/types";

export interface IPayment extends Document {
  receiptNumber: string;
  student: Types.ObjectId;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  paymentFor: string; // e.g. "Membership", "Uniform", "Event"
  membership?: Types.ObjectId;
  remarks?: string;
  recordedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    receiptNumber: { type: String, required: true, unique: true },
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    amount: { type: Number, required: true },
    paymentDate: { type: Date, required: true, default: Date.now },
    paymentMethod: {
      type: String,
      enum: ["CASH", "BANK_TRANSFER", "ONLINE", "CARD", "OTHER"],
      required: true,
    },
    paymentFor: { type: String, required: true },
    membership: { type: Schema.Types.ObjectId, ref: "Membership" },
    remarks: { type: String },
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

PaymentSchema.index({ student: 1 });
PaymentSchema.index({ paymentDate: 1 });

export const Payment: Model<IPayment> = models.Payment || model<IPayment>("Payment", PaymentSchema);
