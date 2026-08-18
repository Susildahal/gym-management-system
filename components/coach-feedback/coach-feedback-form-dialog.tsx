"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { coachFeedbackSchema, type CoachFeedbackInput } from "@/lib/validations/coach-feedback";
import { createCoachFeedback, updateCoachFeedback, type CoachFeedbackDTO } from "@/lib/actions/coach-feedback";
import { listAllActiveStudents, type StudentDTO } from "@/lib/actions/students";

export function CoachFeedbackFormDialog({ feedback }: { feedback?: CoachFeedbackDTO }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const isEdit = !!feedback;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(coachFeedbackSchema),
    defaultValues: feedback ? { student: feedback.studentId, comment: feedback.comment } : {},
  });

  useEffect(() => {
    if (open) listAllActiveStudents().then(setStudents);
  }, [open]);

  async function onSubmit(values: CoachFeedbackInput) {
    setLoading(true);
    const result = isEdit ? await updateCoachFeedback(feedback!.id, values) : await createCoachFeedback(values);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Feedback updated" : "Feedback added");
    setOpen(false);
    if (!isEdit) reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="Edit feedback">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" /> Add feedback
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit feedback" : "Add coach feedback"}</DialogTitle>
          <DialogDescription>Keep it short and focused on progress and next steps.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Student</Label>
            <Select value={watch("student")} onValueChange={(v) => setValue("student", v, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Select student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.student && <p className="text-xs text-destructive">{errors.student.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="date">Date</Label>
            <Input id="date" type="date" {...register("date")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="comment">Comment</Label>
            <Textarea id="comment" rows={4} placeholder="Good improvement in footwork..." {...register("comment")} />
            {errors.comment && <p className="text-xs text-destructive">{errors.comment.message}</p>}
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
