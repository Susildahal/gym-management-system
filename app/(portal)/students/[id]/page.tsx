import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StudentAttendanceHistory } from "@/components/attendance/student-attendance-history";
import { CoachFeedbackFeed } from "@/components/coach-feedback/coach-feedback-feed";
import { getStudent } from "@/lib/actions/students";
import { getStudentMembership } from "@/lib/actions/memberships";
import { listFeedbackForStudent } from "@/lib/actions/coach-feedback";
import { listPaymentsForStudent } from "@/lib/actions/payments";
import { formatDate } from "@/lib/utils";
import { auth } from "@/lib/auth";

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const session = await auth();
  const canManage = session?.user.role === "ADMIN" || session?.user.role === "INSTRUCTOR";

  let student;
  try {
    student = await getStudent(id);
  } catch {
    notFound();
  }

  const [membership, feedback, payments] = await Promise.all([
    getStudentMembership(id),
    listFeedbackForStudent(id),
    canManage ? listPaymentsForStudent(id) : Promise.resolve([]),
  ]);

  return (
    <div>
      <Link href="/students" className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to students
      </Link>
      <PageHeader title={`${student.firstName} ${student.lastName}`} description={`Student ID: ${student.studentId}`} />

      <Card className="mb-6">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="text-base">{initials(student.firstName, student.lastName)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {student.firstName} {student.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{student.email || "No email on file"}</p>
              <p className="text-sm text-muted-foreground">{student.phone || "No phone on file"}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant={student.isActive ? "success" : "outline"}>{student.isActive ? "Active" : "Inactive"}</Badge>
            <Badge variant={student.membershipStatus === "ACTIVE" ? "success" : "secondary"}>{student.membershipStatus}</Badge>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="attendance">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="membership">Membership</TabsTrigger>
          {canManage && <TabsTrigger value="payments">Payments</TabsTrigger>}
          <TabsTrigger value="feedback">Coach feedback</TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <StudentAttendanceHistory studentId={id} searchParams={sp} />
        </TabsContent>

        <TabsContent value="membership">
          {!membership ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No membership on file.</p>
          ) : (
            <Card>
              <CardContent className="grid grid-cols-2 gap-3 p-5 text-sm">
                <div>
                  <p className="text-muted-foreground">Plan</p>
                  <p>{membership.planName}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Status</p>
                  <Badge variant={membership.status === "ACTIVE" ? "success" : "outline"}>{membership.status}</Badge>
                </div>
                <div>
                  <p className="text-muted-foreground">Start date</p>
                  <p>{formatDate(membership.startDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">End date</p>
                  <p>{formatDate(membership.endDate)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p>Rs. {membership.amount.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Payment status</p>
                  <p>{membership.paymentStatus}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {canManage && (
          <TabsContent value="payments">
            <Card>
              {payments.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">No payment history.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Receipt #</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Method</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs">{p.receiptNumber}</TableCell>
                        <TableCell>Rs. {p.amount.toLocaleString()}</TableCell>
                        <TableCell>{formatDate(p.paymentDate)}</TableCell>
                        <TableCell>{p.paymentMethod.replace("_", " ")}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>
        )}

        <TabsContent value="feedback">
          <CoachFeedbackFeed feedback={feedback} canManage={canManage} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
