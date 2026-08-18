"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Bell, CheckCheck, CreditCard, Megaphone, CalendarClock, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { markNotificationRead, markAllNotificationsRead, type NotificationDTO } from "@/lib/actions/notifications";
import { formatDate } from "@/lib/utils";

const ICONS: Record<string, typeof Bell> = {
  NOTICE: Megaphone,
  CLASS_REMINDER: CalendarClock,
  MEMBERSHIP_EXPIRING: CreditCard,
  PAYMENT_DUE: Wallet,
  GENERAL: Bell,
};

export function NotificationFeed({ notifications }: { notifications: NotificationDTO[] }) {
  const [isPending, startTransition] = useTransition();

  function handleMarkRead(id: string) {
    startTransition(async () => {
      await markNotificationRead(id);
    });
  }

  function handleMarkAll() {
    startTransition(async () => {
      const result = await markAllNotificationsRead();
      if (result.success) toast.success("All notifications marked as read");
    });
  }

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleMarkAll} disabled={isPending}>
            <CheckCheck className="h-4 w-4" /> Mark all as read
          </Button>
        </div>
      )}
      {notifications.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">You're all caught up.</p>
      ) : (
        notifications.map((n) => {
          const Icon = ICONS[n.type] ?? Bell;
          return (
            <Card key={n.id} className={cn(!n.isRead && "border-primary/40")}>
              <CardContent className="flex items-start gap-3 p-4">
                <div
                  className={cn(
                    "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                    n.isRead ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                  )}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{n.title}</p>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="shrink-0 text-xs text-primary hover:underline"
                        disabled={isPending}
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(n.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
