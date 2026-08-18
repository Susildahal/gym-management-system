import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { PaginationControls } from "@/components/layout/pagination-controls";
import { InstructorFormDialog } from "@/components/instructors/instructor-form-dialog";
import { InstructorTable } from "@/components/instructors/instructor-table";
import { Card } from "@/components/ui/card";
import { listInstructors } from "@/lib/actions/instructors";

export default async function InstructorsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await auth();
  const canManage = session?.user.role === "ADMIN";

  const { items, total, page, pages } = await listInstructors(params);

  return (
    <div>
      <PageHeader
        title="Instructors"
        description="Manage instructor profiles, specializations, and class assignments."
        actions={canManage ? <InstructorFormDialog /> : undefined}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput placeholder="Search by name, ID, phone, email..." />
        </div>
        <InstructorTable instructors={items} canManage={canManage} />
        <PaginationControls page={page} pages={pages} total={total} />
      </Card>
    </div>
  );
}
