"use client";

import { Copy, KeyRound, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import type { GeneratedCredentials } from "@/lib/actions/user-accounts";

function copy(value: string, label: string) {
  navigator.clipboard.writeText(value);
  toast.success(`${label} copied`);
}

export function CredentialsDialog({
  credentials,
  onClose,
}: {
  credentials: GeneratedCredentials | null;
  onClose: () => void;
}) {
  return (
    <Dialog open={!!credentials} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
            <KeyRound className="h-5 w-5" />
          </div>
          <DialogTitle>Login created</DialogTitle>
          <DialogDescription>Share these with them directly — this password won&apos;t be shown again.</DialogDescription>
        </DialogHeader>

        {credentials && (
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <div>
                <p className="text-xs text-muted-foreground">Username</p>
                <p className="font-mono text-sm">{credentials.username}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => copy(credentials.username, "Username")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <div>
                <p className="text-xs text-muted-foreground">Temporary password</p>
                <p className="font-mono text-sm">{credentials.password}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => copy(credentials.password, "Password")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="flex items-start gap-1.5 pt-1 text-xs text-muted-foreground">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              They can change this password anytime from their Profile page after signing in.
            </p>
          </div>
        )}

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
