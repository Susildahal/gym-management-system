import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { CsvExportButton } from "@/components/reports/csv-export-button";
import { PrintButton } from "@/components/reports/print-button";
import { Users, ClipboardCheck, Wallet, CreditCard, CalendarDays } from "lucide-react";
import {
  getStudentReport,
  getAttendanceReport,
  getPaymentReport,
  getMembershipReport,
  getClassReport,
} from "@/lib/actions/reports";

export default async function ReportsPage() {
  const [students, attendance, payments, memberships, classes] = await Promise.all([
    getStudentReport(),
    getAttendanceReport(),
    getPaymentReport(),
    getMembershipReport(),
    getClassReport(),
  ]);

  return (
    <div>
      <PageHeader
        title="Reports"
        description="Student, attendance, payment, membership, and class reports."
        actions={<PrintButton />}
      />

      <Tabs defaultValue="students">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="memberships">Memberships</TabsTrigger>
          <TabsTrigger value="classes">Classes</TabsTrigger>
        </TabsList>

        <TabsContent value="students">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Total students" value={students.total} icon={Users} />
            <StatCard label="Active" value={students.active} icon={Users} tone="success" />
            <StatCard label="Inactive" value={students.inactive} icon={Users} />
            <StatCard label="New this month" value={students.newThisMonth} icon={Users} tone="success" />
          </div>
        </TabsContent>

        <TabsContent value="attendance">
          <div className="mb-4 grid grid-cols-3 gap-3">
            <StatCard label="Today" value={`${attendance.todayRate}%`} icon={ClipboardCheck} />
            <StatCard label="Last 7 days" value={`${attendance.weekRate}%`} icon={ClipboardCheck} />
            <StatCard label="Last 30 days" value={`${attendance.monthRate}%`} icon={ClipboardCheck} />
          </div>
          <Card>
            <div className="flex justify-end p-3">
              <CsvExportButton data={attendance.byClass} filename="attendance-by-class" />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Present</TableHead>
                  <TableHead>Absent</TableHead>
                  <TableHead>Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {attendance.byClass.map((c) => (
                  <TableRow key={c.className}>
                    <TableCell>{c.className}</TableCell>
                    <TableCell>{c.present}</TableCell>
                    <TableCell>{c.absent}</TableCell>
                    <TableCell>{c.rate}%</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Today" value={`Rs. ${payments.todayTotal.toLocaleString()}`} icon={Wallet} />
            <StatCard label="This month" value={`Rs. ${payments.monthTotal.toLocaleString()}`} icon={Wallet} tone="success" />
            <StatCard label="Outstanding memberships" value={payments.outstandingCount} icon={Wallet} tone="warning" />
            <StatCard label="Outstanding amount" value={`Rs. ${payments.outstandingAmount.toLocaleString()}`} icon={Wallet} tone="destructive" />
          </div>
        </TabsContent>

        <TabsContent value="memberships">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Active" value={memberships.active} icon={CreditCard} tone="success" />
            <StatCard label="Expired" value={memberships.expired} icon={CreditCard} />
            <StatCard label="Expiring within 7 days" value={memberships.expiringSoon} icon={CreditCard} tone="warning" />
          </div>
        </TabsContent>

        <TabsContent value="classes">
          <Card>
            <div className="flex justify-end p-3">
              <CsvExportButton data={classes} filename="class-report" />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Class</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Days</TableHead>
                  <TableHead>Enrollment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.map((c) => (
                  <TableRow key={c.className}>
                    <TableCell className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      {c.className}
                    </TableCell>
                    <TableCell>{c.instructorName}</TableCell>
                    <TableCell>{c.days.join(", ")}</TableCell>
                    <TableCell>
                      {c.enrolled}/{c.capacity}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
