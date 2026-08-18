"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CoachFeedbackFormDialog } from "@/components/coach-feedback/coach-feedback-form-dialog";
import { deleteCoachFeedback, type CoachFeedbackDTO } from "@/lib/actions/coach-feedback";
import { formatDate } from "@/lib/utils";

export function CoachFeedbackFeed({ feedback, canManage }: { feedback: CoachFeedbackDTO[]; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this feedback entry?")) return;
    startTransition(async () => {
      const result = await deleteCoachFeedback(id);
      if (!result.success) toast.error(result.error);
      else toast.success("Feedback deleted");
    });
  }

  if (feedback.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No feedback yet.</p>;
  }

  return (
    <div className="space-y-3">
      {feedback.map((f) => (
        <Card key={f.id}>
          <CardContent className="p-4">
            <div className="mb-1.5 flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{f.studentName}</p>
                <p className="text-xs text-muted-foreground">
                  {f.instructorName} &middot; {formatDate(f.date)}
                </p>
              </div>
              {canManage && (
                <div className="flex items-center gap-1">
                  <CoachFeedbackFormDialog feedback={f} />
                  <Button variant="ghost" size="icon" disabled={isPending} onClick={() => handleDelete(f.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              )}
            </div>
            <p className="text-sm text-foreground/90">{f.comment}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
