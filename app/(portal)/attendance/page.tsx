import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { MarkAttendanceCard } from "@/components/attendance/mark-attendance-card";
import { StudentAttendanceHistory } from "@/components/attendance/student-attendance-history";
import { ComingSoon } from "@/components/layout/coming-soon";
import { getOwnStudentRecord } from "@/lib/actions/attendance";

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await auth();
  const role = session?.user.role;

  if (role === "ADMIN" || role === "INSTRUCTOR") {
    return (
      <div>
        <PageHeader title="Attendance" description="Select a class and date, then mark each student present or absent." />
        <MarkAttendanceCard />
      </div>
    );
  }

  const student = await getOwnStudentRecord();

  return (
    <div>
      <PageHeader title="My attendance" description="Your attendance history and overall attendance rate." />
      {student ? (
        <StudentAttendanceHistory studentId={student.id} searchParams={params} />
      ) : (
        <ComingSoon title="No student profile linked" description="Your account isn't linked to a student record yet." />
      )}
    </div>
  );
}
