"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { membershipSchema, type MembershipInput } from "@/lib/validations/membership";
import { createMembership, listMembershipPlans, type MembershipPlanDTO } from "@/lib/actions/memberships";
import { listAllActiveStudents, type StudentDTO } from "@/lib/actions/students";

function addMonths(date: Date, months: number) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

export function AssignMembershipDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [plans, setPlans] = useState<MembershipPlanDTO[]>([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(membershipSchema),
    defaultValues: { paymentStatus: "UNPAID" },
  });

  useEffect(() => {
    if (open) {
      listAllActiveStudents().then(setStudents);
      listMembershipPlans().then((p) => setPlans(p.filter((x) => x.isActive)));
    }
  }, [open]);

  function handlePlanChange(planId: string) {
    setValue("plan", planId, { shouldValidate: true });
    const plan = plans.find((p) => p.id === planId);
    if (plan) {
      const start = new Date();
      setValue("startDate", start);
      setValue("endDate", addMonths(start, plan.durationMonths));
      setValue("amount", plan.price);
    }
  }

  async function onSubmit(values: MembershipInput) {
    setLoading(true);
    const result = await createMembership(values);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Membership assigned");
    setOpen(false);
    reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4" /> Assign membership
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign membership</DialogTitle>
          <DialogDescription>Dates and amount pre-fill from the plan and can be adjusted.</DialogDescription>
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
                    {s.firstName} {s.lastName} ({s.studentId})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.student && <p className="text-xs text-destructive">{errors.student.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Plan</Label>
            <Select value={watch("plan")} onValueChange={handlePlanChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.planName} — Rs. {p.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.plan && <p className="text-xs text-destructive">{errors.plan.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">Start date</Label>
              <Input id="startDate" type="date" {...register("startDate")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">End date</Label>
              <Input id="endDate" type="date" {...register("endDate")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (NPR)</Label>
              <Input id="amount" type="number" min={0} {...register("amount")} />
            </div>
            <div className="space-y-1.5">
              <Label>Payment status</Label>
              <Select value={watch("paymentStatus")} onValueChange={(v) => setValue("paymentStatus", v as MembershipInput["paymentStatus"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="UNPAID">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
