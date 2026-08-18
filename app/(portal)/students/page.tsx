import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { PaginationControls } from "@/components/layout/pagination-controls";
import { StudentFormDialog } from "@/components/students/student-form-dialog";
import { StudentTable } from "@/components/students/student-table";
import { Card } from "@/components/ui/card";
import { listStudents } from "@/lib/actions/students";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await auth();
  const canManage = session?.user.role === "ADMIN";

  const { items, total, page, pages } = await listStudents(params);

  return (
    <div>
      <PageHeader
        title="Students"
        description="Manage student profiles, membership status, and attendance history."
        actions={canManage ? <StudentFormDialog /> : undefined}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput placeholder="Search by name, ID, phone, email..." />
        </div>
        <StudentTable students={items} canManage={canManage} />
        <PaginationControls page={page} pages={pages} total={total} />
      </Card>
    </div>
  );
}
