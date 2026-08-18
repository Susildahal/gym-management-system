import { PageHeader } from "@/components/layout/page-header";
import { NotificationFeed } from "@/components/notifications/notification-feed";
import { listMyNotifications } from "@/lib/actions/notifications";

export default async function NotificationsPage() {
  const notifications = await listMyNotifications();

  return (
    <div>
      <PageHeader title="Notifications" description="Your recent in-app notifications." />
      <NotificationFeed notifications={notifications} />
    </div>
  );
}
