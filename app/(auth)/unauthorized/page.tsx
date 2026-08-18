import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 p-4 text-center">
      <LockKeyhole className="h-12 w-12 text-muted-foreground" />
      <div>
        <h1 className="text-xl font-semibold">Sign in required</h1>
        <p className="text-sm text-muted-foreground">You need to sign in to view this page.</p>
      </div>
      <Button asChild>
        <Link href="/login">Go to login</Link>
      </Button>
    </div>
  );
}
