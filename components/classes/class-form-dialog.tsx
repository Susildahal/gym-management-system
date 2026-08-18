"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
import { classSchema, type ClassInput } from "@/lib/validations/class";
import { createClass, updateClass, listClassTypes, type ClassDTO } from "@/lib/actions/classes";
import { listAllActiveInstructors, type InstructorDTO } from "@/lib/actions/instructors";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"] as const;

export function ClassFormDialog({ trainingClass }: { trainingClass?: ClassDTO }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [instructors, setInstructors] = useState<InstructorDTO[]>([]);
  const [classTypes, setClassTypes] = useState<string[]>([]);
  const isEdit = !!trainingClass;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(classSchema),
    defaultValues: trainingClass
      ? {
          name: trainingClass.name,
          classType: trainingClass.classType,
          trainingLevel: trainingClass.trainingLevel as ClassInput["trainingLevel"],
          instructor: trainingClass.instructorId,
          trainingDays: trainingClass.trainingDays as ClassInput["trainingDays"],
          startTime: trainingClass.startTime,
          endTime: trainingClass.endTime,
          location: trainingClass.location,
          maxCapacity: trainingClass.maxCapacity,
          description: trainingClass.description,
        }
      : { trainingDays: [], trainingLevel: "ALL_LEVELS", maxCapacity: 20 },
  });

  const selectedDays = watch("trainingDays") ?? [];

  useEffect(() => {
    if (open) {
      listAllActiveInstructors().then(setInstructors);
      listClassTypes().then(setClassTypes);
    }
  }, [open]);

  function toggleDay(day: (typeof DAYS)[number]) {
    const next = selectedDays.includes(day) ? selectedDays.filter((d) => d !== day) : [...selectedDays, day];
    setValue("trainingDays", next, { shouldValidate: true });
  }

  async function onSubmit(values: ClassInput) {
    setLoading(true);
    const result = isEdit ? await updateClass(trainingClass!.id, values) : await createClass(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Class updated" : "Class created");
    setOpen(false);
    if (!isEdit) reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="Edit class">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" /> Add class
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit class" : "Create class"}</DialogTitle>
          <DialogDescription>Define the schedule, instructor, and capacity for this class.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Class name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="classType">Class type</Label>
              <Input id="classType" list="class-type-options" placeholder="e.g. Beginner Sanda" {...register("classType")} />
              <datalist id="class-type-options">
                {classTypes.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
              {errors.classType && <p className="text-xs text-destructive">{errors.classType.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Training level</Label>
              <Select
                value={watch("trainingLevel")}
                onValueChange={(v) => setValue("trainingLevel", v as ClassInput["trainingLevel"])}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                  <SelectItem value="ALL_LEVELS">All levels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Instructor</Label>
            <Select value={watch("instructor")} onValueChange={(v) => setValue("instructor", v, { shouldValidate: true })}>
              <SelectTrigger>
                <SelectValue placeholder="Select instructor" />
              </SelectTrigger>
              <SelectContent>
                {instructors.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.firstName} {i.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.instructor && <p className="text-xs text-destructive">{errors.instructor.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Training days</Label>
            <div className="flex flex-wrap gap-3">
              {DAYS.map((day) => (
                <label key={day} className="flex items-center gap-1.5 text-sm">
                  <Checkbox checked={selectedDays.includes(day)} onCheckedChange={() => toggleDay(day)} />
                  {day}
                </label>
              ))}
            </div>
            {errors.trainingDays && <p className="text-xs text-destructive">{errors.trainingDays.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Start time</Label>
              <Input id="startTime" type="time" {...register("startTime")} />
              {errors.startTime && <p className="text-xs text-destructive">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endTime">End time</Label>
              <Input id="endTime" type="time" {...register("endTime")} />
              {errors.endTime && <p className="text-xs text-destructive">{errors.endTime.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="location">Location</Label>
              <Input id="location" {...register("location")} />
              {errors.location && <p className="text-xs text-destructive">{errors.location.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxCapacity">Max capacity</Label>
              <Input id="maxCapacity" type="number" min={1} {...register("maxCapacity")} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create class"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
