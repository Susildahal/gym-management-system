"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { membershipPlanSchema, type MembershipPlanInput } from "@/lib/validations/membership";
import { createMembershipPlan, updateMembershipPlan, type MembershipPlanDTO } from "@/lib/actions/memberships";

export function PlanFormDialog({ plan }: { plan?: MembershipPlanDTO }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!plan;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(membershipPlanSchema),
    defaultValues: plan
      ? { planName: plan.planName, durationMonths: plan.durationMonths, price: plan.price, description: plan.description }
      : {},
  });

  async function onSubmit(values: MembershipPlanInput) {
    setLoading(true);
    const result = isEdit ? await updateMembershipPlan(plan!.id, values) : await createMembershipPlan(values);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Plan updated" : "Plan created");
    setOpen(false);
    if (!isEdit) reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="Edit plan">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button variant="outline">
            <Plus className="h-4 w-4" /> New plan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit membership plan" : "New membership plan"}</DialogTitle>
          <DialogDescription>Define pricing and duration for this plan.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="planName">Plan name</Label>
            <Input id="planName" placeholder="Monthly, Quarterly..." {...register("planName")} />
            {errors.planName && <p className="text-xs text-destructive">{errors.planName.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="durationMonths">Duration (months)</Label>
              <Input id="durationMonths" type="number" min={1} {...register("durationMonths")} />
              {errors.durationMonths && <p className="text-xs text-destructive">{errors.durationMonths.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="price">Price (NPR)</Label>
              <Input id="price" type="number" min={0} {...register("price")} />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" rows={2} {...register("description")} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Create plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
