import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { PaginationControls } from "@/components/layout/pagination-controls";
import { CoachFeedbackFormDialog } from "@/components/coach-feedback/coach-feedback-form-dialog";
import { CoachFeedbackFeed } from "@/components/coach-feedback/coach-feedback-feed";
import { listCoachFeedback } from "@/lib/actions/coach-feedback";

export default async function CoachFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await auth();
  const canManage = session?.user.role === "ADMIN" || session?.user.role === "INSTRUCTOR";

  const { items, total, page, pages } = await listCoachFeedback(params);

  return (
    <div>
      <PageHeader
        title="Coach feedback"
        description={canManage ? "Give and review coaching feedback for students." : "Feedback from your instructors."}
        actions={canManage ? <CoachFeedbackFormDialog /> : undefined}
      />
      <CoachFeedbackFeed feedback={items} canManage={canManage} />
      <PaginationControls page={page} pages={pages} total={total} />
    </div>
  );
}
