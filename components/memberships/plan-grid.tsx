"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PlanFormDialog } from "@/components/memberships/plan-form-dialog";
import { togglePlanActive, type MembershipPlanDTO } from "@/lib/actions/memberships";

export function PlanGrid({ plans }: { plans: MembershipPlanDTO[] }) {
  const [isPending, startTransition] = useTransition();

  function handleToggle(id: string) {
    startTransition(async () => {
      const result = await togglePlanActive(id);
      if (!result.success) toast.error(result.error);
    });
  }

  if (plans.length === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No membership plans yet.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((p) => (
        <Card key={p.id}>
          <CardContent className="p-4">
            <div className="mb-2 flex items-start justify-between">
              <div>
                <p className="font-medium">{p.planName}</p>
                <p className="text-xs text-muted-foreground">{p.durationMonths} month(s)</p>
              </div>
              <Badge variant={p.isActive ? "success" : "outline"}>{p.isActive ? "Active" : "Inactive"}</Badge>
            </div>
            <p className="mb-3 text-2xl font-semibold">Rs. {p.price.toLocaleString()}</p>
            {p.description && <p className="mb-3 text-sm text-muted-foreground">{p.description}</p>}
            <div className="flex gap-2">
              <PlanFormDialog plan={p} />
              <Button variant="outline" size="sm" disabled={isPending} onClick={() => handleToggle(p.id)}>
                {p.isActive ? "Deactivate" : "Activate"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
