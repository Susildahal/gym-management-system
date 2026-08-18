"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateMembershipStatus, deleteMembership, type MembershipDTO } from "@/lib/actions/memberships";
import { formatDate } from "@/lib/utils";

export function MembershipTable({ memberships }: { memberships: MembershipDTO[] }) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(id: string, status: string) {
    startTransition(async () => {
      const result = await updateMembershipStatus(id, status as never);
      if (!result.success) toast.error(result.error);
      else toast.success("Status updated");
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this membership record?")) return;
    startTransition(async () => {
      const result = await deleteMembership(id);
      if (!result.success) toast.error(result.error);
      else toast.success("Membership deleted");
    });
  }

  if (memberships.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No memberships found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Plan</TableHead>
          <TableHead className="hidden sm:table-cell">Start</TableHead>
          <TableHead>End</TableHead>
          <TableHead className="hidden md:table-cell">Payment</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="w-10" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {memberships.map((m) => (
          <TableRow key={m.id}>
            <TableCell className="font-medium">{m.studentName}</TableCell>
            <TableCell>{m.planName}</TableCell>
            <TableCell className="hidden sm:table-cell">{formatDate(m.startDate)}</TableCell>
            <TableCell>{formatDate(m.endDate)}</TableCell>
            <TableCell className="hidden md:table-cell">
              <Badge variant="outline">{m.paymentStatus}</Badge>
            </TableCell>
            <TableCell>
              <Select value={m.status} onValueChange={(v) => handleStatusChange(m.id, v)} disabled={isPending}>
                <SelectTrigger className="h-7 w-32 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Active</SelectItem>
                  <SelectItem value="EXPIRED">Expired</SelectItem>
                  <SelectItem value="SUSPENDED">Suspended</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </TableCell>
            <TableCell>
              <Button variant="ghost" size="icon" disabled={isPending} onClick={() => handleDelete(m.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
