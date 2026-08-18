"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { MoreHorizontal, EyeOff, Eye, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { NoticeFormDialog } from "@/components/notices/notice-form-dialog";
import { toggleNoticePublished, deleteNotice, type NoticeDTO } from "@/lib/actions/notices";
import { formatDate } from "@/lib/utils";

const PRIORITY_VARIANT: Record<string, "outline" | "secondary" | "warning" | "destructive"> = {
  LOW: "outline",
  NORMAL: "secondary",
  HIGH: "warning",
  URGENT: "destructive",
};

export function NoticeFeed({ notices, canManage }: { notices: NoticeDTO[]; canManage: boolean }) {
  const [isPending, startTransition] = useTransition();

  function handleTogglePublish(id: string) {
    startTransition(async () => {
      const result = await toggleNoticePublished(id);
      if (!result.success) toast.error(result.error);
    });
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this notice?")) return;
    startTransition(async () => {
      const result = await deleteNotice(id);
      if (!result.success) toast.error(result.error);
      else toast.success("Notice deleted");
    });
  }

  if (notices.length === 0) {
    return <p className="py-12 text-center text-sm text-muted-foreground">No notices to show.</p>;
  }

  return (
    <div className="space-y-3">
      {notices.map((n) => (
        <Card key={n.id}>
          <CardContent className="p-4">
            <div className="mb-1 flex items-start justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{n.title}</p>
                <Badge variant={PRIORITY_VARIANT[n.priority]}>{n.priority}</Badge>
                <Badge variant="outline">{n.targetAudience}</Badge>
                {canManage && !n.isPublished && <Badge variant="outline">Unpublished</Badge>}
              </div>
              {canManage && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={isPending}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleTogglePublish(n.id)}>
                      {n.isPublished ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
                      {n.isPublished ? "Unpublish" : "Publish"}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleDelete(n.id)} className="text-destructive focus:text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
            <p className="mb-2 text-sm text-muted-foreground">{n.content}</p>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Published {formatDate(n.publishedDate)}</span>
              {n.expiryDate && <span>Expires {formatDate(n.expiryDate)}</span>}
              {canManage && <NoticeFormDialog notice={n} />}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
