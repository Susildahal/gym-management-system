import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PlanGrid } from "@/components/memberships/plan-grid";
import { PlanFormDialog } from "@/components/memberships/plan-form-dialog";
import { AssignMembershipDialog } from "@/components/memberships/assign-membership-dialog";
import { MembershipTable } from "@/components/memberships/membership-table";
import { ComingSoon } from "@/components/layout/coming-soon";
import { listMembershipPlans, listMemberships, getStudentMembership } from "@/lib/actions/memberships";
import { getOwnStudentRecord } from "@/lib/actions/attendance";
import { formatDate } from "@/lib/utils";

export default async function MembershipsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await auth();
  const role = session?.user.role;

  if (role === "ADMIN") {
    const [plans, memberships] = await Promise.all([listMembershipPlans(), listMemberships(params)]);
    return (
      <div>
        <PageHeader title="Memberships" description="Manage membership plans and student subscriptions." />
        <Tabs defaultValue="memberships">
          <div className="mb-4 flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="memberships">Student memberships</TabsTrigger>
              <TabsTrigger value="plans">Plans</TabsTrigger>
            </TabsList>
          </div>
          <TabsContent value="memberships">
            <div className="mb-3 flex justify-end">
              <AssignMembershipDialog />
            </div>
            <Card>
              <MembershipTable memberships={memberships.items} />
            </Card>
          </TabsContent>
          <TabsContent value="plans">
            <div className="mb-3 flex justify-end">
              <PlanFormDialog />
            </div>
            <PlanGrid plans={plans} />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // STUDENT view
  const student = await getOwnStudentRecord();
  const membership = student ? await getStudentMembership(student.id) : null;

  return (
    <div>
      <PageHeader title="My membership" description="Your current membership plan and status." />
      {!membership ? (
        <ComingSoon title="No active membership" description="You don't have a membership on file yet." />
      ) : (
        <Card>
          <CardContent className="space-y-3 p-5">
            <div className="flex items-center justify-between">
              <p className="text-lg font-medium">{membership.planName}</p>
              <Badge variant={membership.status === "ACTIVE" ? "success" : "outline"}>{membership.status}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
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
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
