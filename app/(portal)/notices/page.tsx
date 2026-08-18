import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { PaginationControls } from "@/components/layout/pagination-controls";
import { NoticeFormDialog } from "@/components/notices/notice-form-dialog";
import { NoticeFeed } from "@/components/notices/notice-feed";
import { Card } from "@/components/ui/card";
import { listNotices } from "@/lib/actions/notices";

export default async function NoticesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await auth();
  const canManage = session?.user.role === "ADMIN";

  const { items, total, page, pages } = await listNotices(params);

  return (
    <div>
      <PageHeader
        title="Notices"
        description="Announcements and updates from the academy."
        actions={canManage ? <NoticeFormDialog /> : undefined}
      />
      <div className="mb-3">
        <SearchInput placeholder="Search notices..." />
      </div>
      <NoticeFeed notices={items} canManage={canManage} />
      <Card className="mt-3">
        <PaginationControls page={page} pages={pages} total={total} />
      </Card>
    </div>
  );
}
