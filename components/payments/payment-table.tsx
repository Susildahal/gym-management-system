"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2, Printer } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentFormDialog } from "@/components/payments/payment-form-dialog";
import { deletePayment, type PaymentDTO } from "@/lib/actions/payments";
import { formatDate } from "@/lib/utils";

export function PaymentTable({ payments, canManage }: { payments: PaymentDTO[]; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string) {
    if (!confirm("Delete this payment record?")) return;
    startTransition(async () => {
      const result = await deletePayment(id);
      if (!result.success) toast.error(result.error);
      else toast.success("Payment deleted");
    });
  }

  if (payments.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No payments found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Receipt #</TableHead>
          {canManage && <TableHead>Student</TableHead>}
          <TableHead>Amount</TableHead>
          <TableHead className="hidden sm:table-cell">Date</TableHead>
          <TableHead className="hidden md:table-cell">Method</TableHead>
          <TableHead className="hidden lg:table-cell">For</TableHead>
          <TableHead className="w-20" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {payments.map((p) => (
          <TableRow key={p.id}>
            <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
            {canManage && <TableCell className="font-medium">{p.studentName}</TableCell>}
            <TableCell>Rs. {p.amount.toLocaleString()}</TableCell>
            <TableCell className="hidden sm:table-cell">{formatDate(p.paymentDate)}</TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant="outline">{p.paymentMethod.replace("_", " ")}</Badge>
            </TableCell>
            <TableCell className="hidden lg:table-cell">{p.paymentFor}</TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                <Button variant="ghost" size="icon" onClick={() => window.print()} aria-label="Print receipt">
                  <Printer className="h-4 w-4" />
                </Button>
                {canManage && (
                  <>
                    <PaymentFormDialog payment={p} />
                    <Button variant="ghost" size="icon" disabled={isPending} onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
