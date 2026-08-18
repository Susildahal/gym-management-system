"use client";

import { useState, useEffect, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { getClassRoster, markAttendance, type RosterEntry } from "@/lib/actions/attendance";
import { listAllActiveClasses, type ClassDTO } from "@/lib/actions/classes";
import type { AttendanceStatus } from "@/types";

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function MarkAttendanceCard() {
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [classId, setClassId] = useState<string>("");
  const [date, setDate] = useState(today());
  const [roster, setRoster] = useState<RosterEntry[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    listAllActiveClasses().then((cls) => {
      setClasses(cls);
      if (cls.length > 0) setClassId(cls[0].id);
    });
  }, []);

  useEffect(() => {
    if (!classId || !date) return;
    setLoadingRoster(true);
    getClassRoster(classId, date)
      .then(setRoster)
      .finally(() => setLoadingRoster(false));
  }, [classId, date]);

  function setStatus(studentId: string, status: AttendanceStatus) {
    setRoster((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, status } : r)));
  }

  function setRemarks(studentId: string, remarks: string) {
    setRoster((prev) => prev.map((r) => (r.studentId === studentId ? { ...r, remarks } : r)));
  }

  function handleSave() {
    const entries = roster.filter((r) => r.status !== null);
    if (entries.length === 0) {
      toast.error("Mark at least one student before saving.");
      return;
    }
    startTransition(async () => {
      const result = await markAttendance({
        class: classId,
        date: new Date(date),
        entries: entries.map((e) => ({ student: e.studentId, status: e.status as AttendanceStatus, remarks: e.remarks })),
      });
      if (!result.success) toast.error(result.error);
      else toast.success(`Attendance saved for ${result.data.count} student(s)`);
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Class</Label>
            <Select value={classId} onValueChange={setClassId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Date</Label>
            <Input type="date" value={date} max={today()} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>

        {loadingRoster ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : roster.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {classId ? "No students are enrolled in this class." : "Select a class to begin."}
          </p>
        ) : (
          <div className="space-y-2">
            {roster.map((r) => (
              <div key={r.studentId} className="flex flex-col gap-2 rounded-md border p-2.5 sm:flex-row sm:items-center sm:justify-between">
                <span className="text-sm font-medium">{r.studentName}</span>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Remarks (optional)"
                    value={r.remarks ?? ""}
                    onChange={(e) => setRemarks(r.studentId, e.target.value)}
                    className="h-8 w-40 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => setStatus(r.studentId, "PRESENT")}
                    className={cn(
                      "flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors",
                      r.status === "PRESENT"
                        ? "border-success bg-success/15 text-success"
                        : "border-input text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <Check className="h-3.5 w-3.5" /> Present
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus(r.studentId, "ABSENT")}
                    className={cn(
                      "flex h-8 items-center gap-1 rounded-md border px-2.5 text-xs font-medium transition-colors",
                      r.status === "ABSENT"
                        ? "border-destructive bg-destructive/10 text-destructive"
                        : "border-input text-muted-foreground hover:bg-accent"
                    )}
                  >
                    <X className="h-3.5 w-3.5" /> Absent
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-end pt-2">
              <Button onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save attendance
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
