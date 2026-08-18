import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface IInstructor extends Document {
  instructorId: string;
  user?: Types.ObjectId;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  address?: string;
  specialization?: string;
  experienceYears?: number;
  joiningDate: Date;
  profileImage?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InstructorSchema = new Schema<IInstructor>(
  {
    instructorId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, ref: "User" },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String },
    address: { type: String },
    specialization: { type: String },
    experienceYears: { type: Number },
    joiningDate: { type: Date, default: Date.now },
    profileImage: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

InstructorSchema.index({ firstName: "text", lastName: "text" });

export const Instructor: Model<IInstructor> =
  models.Instructor || model<IInstructor>("Instructor", InstructorSchema);
