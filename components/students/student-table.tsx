"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { MoreHorizontal, Power, Trash2, Eye, KeyRound } from "lucide-react";
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
import { StudentFormDialog } from "@/components/students/student-form-dialog";
import { CredentialsDialog } from "@/components/shared/credentials-dialog";
import { toggleStudentActive, deleteStudent, createLoginForStudent, type StudentDTO } from "@/lib/actions/students";
import type { GeneratedCredentials } from "@/lib/actions/user-accounts";
import { formatDate } from "@/lib/utils";

export function StudentTable({ students, canManage }: { students: StudentDTO[]; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [newCredentials, setNewCredentials] = useState<GeneratedCredentials | null>(null);

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await toggleStudentActive(id);
      if (!result.success) toast.error(result.error);
      else toast.success("Status updated");
    });
  }

  function handleCreateLogin(id: string) {
    startTransition(async () => {
      const result = await createLoginForStudent(id);
      if (!result.success) toast.error(result.error);
      else setNewCredentials(result.data.credentials);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this student permanently? This cannot be undone.")) return;
    startTransition(async () => {
      const result = await deleteStudent(id);
      if (!result.success) toast.error(result.error);
      else toast.success("Student deleted");
    });
  }

  if (students.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No students found.</p>;
  }

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student ID</TableHead>
          <TableHead>Name</TableHead>
          <TableHead className="hidden sm:table-cell">Phone</TableHead>
          <TableHead className="hidden md:table-cell">Joined</TableHead>
          <TableHead>Membership</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="hidden sm:table-cell">Login</TableHead>
          {canManage && <TableHead className="w-10" />}
        </TableRow>
      </TableHeader>
      <TableBody>
        {students.map((s) => (
          <TableRow key={s.id}>
            <TableCell className="font-mono text-xs">{s.studentId}</TableCell>
            <TableCell className="font-medium">
              <Link href={`/students/${s.id}`} className="hover:underline">
                {s.firstName} {s.lastName}
              </Link>
            </TableCell>
            <TableCell className="hidden sm:table-cell">{s.phone || "—"}</TableCell>
            <TableCell className="hidden md:table-cell">{formatDate(s.joinDate)}</TableCell>
            <TableCell>
              <Badge variant={s.membershipStatus === "ACTIVE" ? "success" : "secondary"}>
                {s.membershipStatus}
              </Badge>
            </TableCell>
            <TableCell>
              <Badge variant={s.isActive ? "success" : "outline"}>{s.isActive ? "Active" : "Inactive"}</Badge>
            </TableCell>
            <TableCell className="hidden sm:table-cell">
              {s.hasAccount ? (
                <div className="flex flex-col items-start gap-1">
                  <Badge variant="success">Has login</Badge>
                  {s.tempPassword && canManage && (
                    <div className="text-[10px] text-muted-foreground">
                      <div>U: <span className="font-mono text-foreground">{s.username}</span></div>
                      <div>P: <span className="font-mono text-foreground">{s.tempPassword}</span></div>
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
                  <StudentFormDialog student={s} />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" disabled={isPending}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/students/${s.id}`}>
                          <Eye className="mr-2 h-4 w-4" /> View profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggle(s.id)}>
                        <Power className="mr-2 h-4 w-4" /> {s.isActive ? "Deactivate" : "Activate"}
                      </DropdownMenuItem>
                      {!s.hasAccount && (
                        <DropdownMenuItem onClick={() => handleCreateLogin(s.id)}>
                          <KeyRound className="mr-2 h-4 w-4" /> Create login
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDelete(s.id)} className="text-destructive focus:text-destructive">
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
