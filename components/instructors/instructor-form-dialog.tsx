"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { instructorSchema, type InstructorInput } from "@/lib/validations/instructor";
import { createInstructor, updateInstructor, type InstructorDTO } from "@/lib/actions/instructors";
import { CredentialsDialog } from "@/components/shared/credentials-dialog";
import type { GeneratedCredentials } from "@/lib/actions/user-accounts";

export function InstructorFormDialog({ instructor }: { instructor?: InstructorDTO }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newCredentials, setNewCredentials] = useState<GeneratedCredentials | null>(null);
  const isEdit = !!instructor;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(instructorSchema),
    defaultValues: instructor
      ? {
          firstName: instructor.firstName,
          lastName: instructor.lastName,
          email: instructor.email,
          phone: instructor.phone,
          specialization: instructor.specialization,
          experienceYears: instructor.experienceYears,
        }
      : {},
  });

  async function onSubmit(values: InstructorInput) {
    setLoading(true);
    const result = isEdit ? await updateInstructor(instructor!.id, values) : await createInstructor(values);
    setLoading(false);

    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Instructor updated" : "Instructor added");
    setOpen(false);
    if (!isEdit) {
      reset();
      if ("credentials" in result.data) {
        setNewCredentials(result.data.credentials as GeneratedCredentials);
      }
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="Edit instructor">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" /> Add instructor
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit instructor" : "Add instructor"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this instructor's details." : "A unique instructor ID is generated automatically."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...register("email")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="specialization">Specialization</Label>
              <Input id="specialization" placeholder="Sanda, Wushu..." {...register("specialization")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="experienceYears">Experience (years)</Label>
              <Input id="experienceYears" type="number" min={0} {...register("experienceYears")} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input id="address" {...register("address")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Add instructor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
      <CredentialsDialog credentials={newCredentials} onClose={() => setNewCredentials(null)} />
    </>
  );
}
