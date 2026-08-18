import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface IClass extends Document {
  name: string;
  classType: string;
  trainingLevel: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVELS";
  instructor: Types.ObjectId;
  trainingDays: string[]; // e.g. ["MON","WED","FRI"]
  startTime: string; // "17:00"
  endTime: string; // "18:30"
  location: string;
  maxCapacity: number;
  enrolledStudents: Types.ObjectId[];
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ClassSchema = new Schema<IClass>(
  {
    name: { type: String, required: true },
    classType: { type: String, required: true },
    trainingLevel: {
      type: String,
      enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "ALL_LEVELS"],
      default: "ALL_LEVELS",
    },
    instructor: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
    trainingDays: [{ type: String, enum: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] }],
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    location: { type: String, required: true },
    maxCapacity: { type: Number, required: true, default: 20 },
    enrolledStudents: [{ type: Schema.Types.ObjectId, ref: "Student" }],
    description: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ClassSchema.index({ instructor: 1 });
ClassSchema.index({ trainingDays: 1 });

export const Class: Model<IClass> = models.Class || model<IClass>("Class", ClassSchema);
