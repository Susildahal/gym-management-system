import { auth } from "@/lib/auth";
import { PageHeader } from "@/components/layout/page-header";
import { SearchInput } from "@/components/layout/search-input";
import { PaginationControls } from "@/components/layout/pagination-controls";
import { PaymentFormDialog } from "@/components/payments/payment-form-dialog";
import { PaymentTable } from "@/components/payments/payment-table";
import { Card } from "@/components/ui/card";
import { listPayments } from "@/lib/actions/payments";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await auth();
  const canManage = session?.user.role === "ADMIN";

  const { items, total, page, pages } = await listPayments(params);

  return (
    <div>
      <PageHeader
        title={canManage ? "Payments" : "My payments"}
        description={canManage ? "Record and track student payments and receipts." : "Your payment history."}
        actions={canManage ? <PaymentFormDialog /> : undefined}
      />
      <Card>
        {canManage && (
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <SearchInput placeholder="Search by receipt number..." />
          </div>
        )}
        <PaymentTable payments={items} canManage={canManage} />
        <PaginationControls page={page} pages={pages} total={total} />
      </Card>
    </div>
  );
}
