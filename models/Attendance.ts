import { Schema, model, models, type Model, type Document, type Types } from "mongoose";
import type { AttendanceStatus } from "@/types";

export interface IAttendance extends Document {
  student: Types.ObjectId;
  class: Types.ObjectId;
  date: Date;
  status: AttendanceStatus;
  remarks?: string;
  markedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    class: { type: Schema.Types.ObjectId, ref: "Class", required: true },
    date: { type: Date, required: true },
    status: { type: String, enum: ["PRESENT", "ABSENT"], required: true },
    remarks: { type: String },
    markedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

// One attendance record per student, per class, per day.
AttendanceSchema.index({ student: 1, class: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });

export const Attendance: Model<IAttendance> =
  models.Attendance || model<IAttendance>("Attendance", AttendanceSchema);
