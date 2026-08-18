"use client";

import { useState, useEffect } from "react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { paymentSchema, type PaymentInput } from "@/lib/validations/payment";
import { createPayment, updatePayment, type PaymentDTO } from "@/lib/actions/payments";
import { listAllActiveStudents, type StudentDTO } from "@/lib/actions/students";

export function PaymentFormDialog({ payment }: { payment?: PaymentDTO }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const isEdit = !!payment;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(paymentSchema),
    defaultValues: payment
      ? {
          student: payment.studentId,
          amount: payment.amount,
          paymentMethod: payment.paymentMethod as PaymentInput["paymentMethod"],
          paymentFor: payment.paymentFor,
          remarks: payment.remarks,
        }
      : { paymentMethod: "CASH", paymentDate: new Date() },
  });

  useEffect(() => {
    if (open) listAllActiveStudents().then(setStudents);
  }, [open]);

  async function onSubmit(values: PaymentInput) {
    setLoading(true);
    const result = isEdit ? await updatePayment(payment!.id, values) : await createPayment(values);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success(isEdit ? "Payment updated" : `Payment recorded (receipt ${result.data.receiptNumber})`);
    setOpen(false);
    if (!isEdit) reset();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEdit ? (
          <Button variant="ghost" size="icon" aria-label="Edit payment">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="h-4 w-4" /> Record payment
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit payment" : "Record payment"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update this payment record." : "A unique receipt number is generated automatically."}
          </DialogDescription>
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount (NPR)</Label>
              <Input id="amount" type="number" min={0.01} step="0.01" {...register("amount")} />
              {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentDate">Payment date</Label>
              <Input id="paymentDate" type="date" {...register("paymentDate")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Payment method</Label>
              <Select value={watch("paymentMethod")} onValueChange={(v) => setValue("paymentMethod", v as PaymentInput["paymentMethod"])}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank transfer</SelectItem>
                  <SelectItem value="ONLINE">Online</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="paymentFor">Payment for</Label>
              <Input id="paymentFor" placeholder="Monthly Membership..." {...register("paymentFor")} />
              {errors.paymentFor && <p className="text-xs text-destructive">{errors.paymentFor.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="remarks">Remarks</Label>
            <Input id="remarks" {...register("remarks")} />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Save changes" : "Record payment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
