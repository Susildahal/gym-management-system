import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  UserSquare2,
  CalendarDays,
  ClipboardCheck,
  CreditCard,
  Wallet,
  AlertTriangle,
  Megaphone,
} from "lucide-react";

// NOTE: this is scaffold-stage — figures below are placeholders wired up with
// zero values. Replace each with a real Mongoose aggregation once the data
// modules are implemented (see lib/mongodb.ts + models/).

function AdminDashboard() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total Students" value={0} icon={Users} />
        <StatCard label="Active Students" value={0} icon={Users} tone="success" />
        <StatCard label="Total Instructors" value={0} icon={UserSquare2} />
        <StatCard label="Today's Classes" value={0} icon={CalendarDays} />
        <StatCard label="Today's Attendance" value="0%" icon={ClipboardCheck} />
        <StatCard label="Active Memberships" value={0} icon={CreditCard} tone="success" />
        <StatCard label="Expiring Memberships" value={0} icon={AlertTriangle} tone="warning" />
        <StatCard label="Outstanding Payments" value="Rs. 0" icon={Wallet} tone="destructive" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Monthly Payment Collection</CardTitle>
          </CardHeader>
          <CardContent className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            Chart placeholder — wire up recharts once payments module is built.
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent Notices</CardTitle>
          </CardHeader>
          <CardContent className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            No notices yet.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InstructorDashboard() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Today's Classes" value={0} icon={CalendarDays} />
      <StatCard label="Assigned Students" value={0} icon={Users} />
      <StatCard label="Today's Attendance" value="0%" icon={ClipboardCheck} />
      <StatCard label="Recent Notices" value={0} icon={Megaphone} />
    </div>
  );
}

function StudentDashboard() {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <StatCard label="Attendance Rate" value="0%" icon={ClipboardCheck} />
      <StatCard label="Membership Status" value="None" icon={CreditCard} />
      <StatCard label="Payment Status" value="Up to date" icon={Wallet} tone="success" />
      <StatCard label="Upcoming Classes" value={0} icon={CalendarDays} />
    </div>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  const role = session?.user.role;

  return (
    <div>
      <PageHeader
        title={`Welcome back${session?.user.name ? ", " + session.user.name.split(" ")[0] : ""}`}
        description="Here's what's happening at the center today."
      />
      {role === "ADMIN" && <AdminDashboard />}
      {role === "INSTRUCTOR" && <InstructorDashboard />}
      {role === "STUDENT" && <StudentDashboard />}
    </div>
  );
}
