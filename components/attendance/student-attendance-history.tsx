import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/dashboard/stat-card";
import { PaginationControls } from "@/components/layout/pagination-controls";
import { ClipboardCheck, CheckCircle2, XCircle } from "lucide-react";
import { listAttendanceForStudent, getStudentAttendanceStats } from "@/lib/actions/attendance";
import { formatDate } from "@/lib/utils";

export async function StudentAttendanceHistory({
  studentId,
  searchParams,
}: {
  studentId: string;
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const [stats, { items, page, pages, total }] = await Promise.all([
    getStudentAttendanceStats(studentId),
    listAttendanceForStudent(studentId, searchParams),
  ]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Attendance rate" value={`${stats.rate}%`} icon={ClipboardCheck} tone="default" />
        <StatCard label="Total classes" value={stats.total} icon={ClipboardCheck} />
        <StatCard label="Present" value={stats.present} icon={CheckCircle2} tone="success" />
        <StatCard label="Absent" value={stats.absent} icon={XCircle} tone="destructive" />
      </div>
      <Card>
        {items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">No attendance records yet.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden sm:table-cell">Remarks</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{formatDate(r.date)}</TableCell>
                  <TableCell>{r.className}</TableCell>
                  <TableCell>
                    <Badge variant={r.status === "PRESENT" ? "success" : "destructive"}>{r.status}</Badge>
                  </TableCell>
                  <TableCell className="hidden text-sm text-muted-foreground sm:table-cell">{r.remarks || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <PaginationControls page={page} pages={pages} total={total} />
      </Card>
    </div>
  );
}
