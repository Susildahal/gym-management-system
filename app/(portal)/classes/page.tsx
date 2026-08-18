import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { PaginationControls } from "@/components/layout/pagination-controls";
import { ClassFormDialog } from "@/components/classes/class-form-dialog";
import { ClassTable } from "@/components/classes/class-table";
import { Card } from "@/components/ui/card";
import { listClasses } from "@/lib/actions/classes";

export default async function ClassesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await auth();
  const canManage = session?.user.role === "ADMIN";

  const { items, total, page, pages } = await listClasses(params);

  return (
    <div>
      <PageHeader
        title="Classes & schedule"
        description="Create and manage training classes, timetables, and capacity."
        actions={canManage ? <ClassFormDialog /> : undefined}
      />
      <Card>
        <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput placeholder="Search by class, type, location..." />
        </div>
        <ClassTable classes={items} canManage={canManage} />
        <PaginationControls page={page} pages={pages} total={total} />
      </Card>
    </div>
  );
}
