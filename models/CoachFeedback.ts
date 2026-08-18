import { Schema, model, models, type Model, type Document, type Types } from "mongoose";

export interface ICoachFeedback extends Document {
  student: Types.ObjectId;
  instructor: Types.ObjectId;
  date: Date;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

const CoachFeedbackSchema = new Schema<ICoachFeedback>(
  {
    student: { type: Schema.Types.ObjectId, ref: "Student", required: true },
    instructor: { type: Schema.Types.ObjectId, ref: "Instructor", required: true },
    date: { type: Date, default: Date.now },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

CoachFeedbackSchema.index({ student: 1, date: -1 });

export const CoachFeedback: Model<ICoachFeedback> =
  models.CoachFeedback || model<ICoachFeedback>("CoachFeedback", CoachFeedbackSchema);
