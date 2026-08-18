"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { assignStudentsToClass, type ClassDTO } from "@/lib/actions/classes";
import { listAllActiveStudents, type StudentDTO } from "@/lib/actions/students";

export function ManageStudentsDialog({ trainingClass }: { trainingClass: ClassDTO }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [selected, setSelected] = useState<string[]>(trainingClass.enrolledStudentIds);

  useEffect(() => {
    if (open) {
      listAllActiveStudents().then(setStudents);
      setSelected(trainingClass.enrolledStudentIds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSave() {
    setLoading(true);
    const result = await assignStudentsToClass(trainingClass.id, selected);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(`${selected.length} student(s) enrolled in ${trainingClass.name}`);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Manage enrolled students">
          <Users className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] max-w-md overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage students — {trainingClass.name}</DialogTitle>
          <DialogDescription>
            Select which students are enrolled in this class. Capacity: {selected.length}/{trainingClass.maxCapacity}.
          </DialogDescription>
        </DialogHeader>

        {students.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No active students yet — add students first.</p>
        ) : (
          <div className="max-h-80 space-y-1 overflow-y-auto rounded-md border p-2">
            {students.map((s) => (
              <label
                key={s.id}
                className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
              >
                <Checkbox checked={selected.includes(s.id)} onCheckedChange={() => toggle(s.id)} />
                <span>
                  {s.firstName} {s.lastName}
                </span>
                <span className="ml-auto font-mono text-xs text-muted-foreground">{s.studentId}</span>
              </label>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button onClick={handleSave} disabled={loading || selected.length > trainingClass.maxCapacity}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save enrollment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
