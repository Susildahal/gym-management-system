"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, Power, Trash2, KeyRound } from "lucide-react";
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
import { InstructorFormDialog } from "@/components/instructors/instructor-form-dialog";
import { CredentialsDialog } from "@/components/shared/credentials-dialog";
import { toggleInstructorActive, deleteInstructor, createLoginForInstructor, type InstructorDTO } from "@/lib/actions/instructors";
import type { GeneratedCredentials } from "@/lib/actions/user-accounts";

export function InstructorTable({ instructors, canManage }: { instructors: InstructorDTO[]; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [newCredentials, setNewCredentials] = useState<GeneratedCredentials | null>(null);

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleInstructorActive(id);
      if (!result.success) toast.error(result.error);
      else toast.success("Status updated");
    });
  }

  function handleCreateLogin(id: string) {
    startTransition(async () => {
      const result = await createLoginForInstructor(id);
      if (!result.success) toast.error(result.error);
      else setNewCredentials(result.data.credentials);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this instructor permanently?")) return;
    startTransition(async () => {
      const result = await deleteInstructor(id);
      if (!result.success) toast.error(result.error);
      else toast.success("Instructor deleted");
    });
  }

  if (instructors.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No instructors found.</p>;
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Instructor ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="hidden sm:table-cell">Specialization</TableHead>
          <TableHead className="hidden md:table-cell">Phone</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Login</TableHead>
          {canManage && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {instructors.map((i) => (
          <TableRow key={i.id}>
            <TableCell className="font-mono text-xs">{i.instructorId}</TableCell>
            <TableCell className="font-medium">
              {i.firstName} {i.lastName}
            </TableCell>
            <TableCell className="hidden sm:table-cell">{i.specialization || "—"}</TableCell>
            <TableCell className="hidden md:table-cell">{i.phone || "—"}</TableCell>
            <TableCell>
              <Badge variant={i.isActive ? "success" : "outline"}>{i.isActive ? "Active" : "Inactive"}</Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {i.hasAccount ? (
                <div className="flex flex-col items-start gap-1">
                  <Badge variant="success">Has login</Badge>
                  {i.tempPassword && canManage && (
                    <div className="text-[10px] text-muted-foreground">
                      <div>U: <span className="font-mono text-foreground">{i.username}</span></div>
                      <div>P: <span className="font-mono text-foreground">{i.tempPassword}</span></div>
                    </div>
                  )}
                </div>
              ) : (
                <Badge variant="outline">No login</Badge>
              )}
            </TableCell>
            {canManage && (
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <InstructorFormDialog instructor={i} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleToggle(i.id)}>
                        <Power className="mr-2 h-4 w-4" /> {i.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      {!i.hasAccount && (
                        <DropdownMenuItem onClick={() => handleCreateLogin(i.id)}>
                          <KeyRound className="mr-2 h-4 w-4" /> Create login
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(i.id)} className="text-destructive focus:text-destructive">
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
    <CredentialsDialog credentials={newCredentials} onClose={() => setNewCredentials(null)} />
    </>
  );
}
