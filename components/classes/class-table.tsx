"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Power, Trash2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { ClassFormDialog } from "@/components/classes/class-form-dialog";
import { ManageStudentsDialog } from "@/components/classes/manage-students-dialog";
import { toggleClassActive, deleteClass, type ClassDTO } from "@/lib/actions/classes";

export function ClassTable({ classes, canManage }: { classes: ClassDTO[]; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleClassActive(id);
      if (!result.success) toast.error(result.error);
      else toast.success("Status updated");
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this class permanently?")) return;
    startTransition(async () => {
      const result = await deleteClass(id);
      if (!result.success) toast.error(result.error);
      else toast.success("Class deleted");
    });
  }

  if (classes.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No classes found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Class</TableHead>
          <TableHead className="hidden sm:table-cell">Instructor</TableHead>
          <TableHead className="hidden md:table-cell">Days</TableHead>
          <TableHead>Time</TableHead>
          <TableHead className="hidden lg:table-cell">Location</TableHead>
          <TableHead>Capacity</TableHead>
          {canManage && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {classes.map((c) => (
          <TableRow key={c.id}>
            <TableCell>
              <div className="font-medium">{c.name}</div>
              <Badge variant="outline" className="mt-1">
                {c.trainingLevel.replace("_", " ")}
              </Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell">{c.instructorName || "—"}</TableCell>
            <TableCell className="hidden md:table-cell">{c.trainingDays.join(", ")}</TableCell>
            <TableCell>
              {c.startTime}–{c.endTime}
            </TableCell>
            <TableCell className="hidden lg:table-cell">{c.location}</TableCell>
            <TableCell>
              {c.enrolledCount}/{c.maxCapacity}
            </TableCell>
            {canManage && (
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <ManageStudentsDialog trainingClass={c} />
                  <ClassFormDialog trainingClass={c} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggle(c.id)}>
                        <Power className="mr-2 h-4 w-4" /> {c.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(c.id)} className="text-destructive focus:text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
