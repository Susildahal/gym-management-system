import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface IStudent extends Document {
  studentId: string;
  user?: Types.ObjectId;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: "MALE" | "FEMALE" | "OTHER";
  phone?: string;
  email?: string;
  address?: string;
  guardianName?: string;
  guardianPhone?: string;
  emergencyContact?: string;
  joinDate: Date;
  profilePhoto?: string;
  membershipStatus: "ACTIVE" | "EXPIRED" | "NONE";
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    studentId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER"] },
    phone: { type: String },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    guardianName: { type: String },
    guardianPhone: { type: String },
    emergencyContact: { type: String },
    joinDate: { type: Date, default: Date.now },
    profilePhoto: { type: String },
    membershipStatus: { type: String, enum: ["ACTIVE", "EXPIRED", "NONE"], default: "NONE" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

StudentSchema.index({ firstName: "text", lastName: "text" });
StudentSchema.index({ isActive: 1 });

export const Student: Model<IStudent> = models.Student || model<IStudent>("Student", StudentSchema);
