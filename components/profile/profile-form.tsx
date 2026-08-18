"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { profileUpdateSchema, type ProfileUpdateInput } from "@/lib/validations/profile";
import { updateOwnProfile, type ProfileDTO } from "@/lib/actions/profile";

function initials(first: string, last: string) {
  return `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();
}

export function ProfileForm({ profile }: { profile: ProfileDTO }) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
    },
  });

  async function onSubmit(values: ProfileUpdateInput) {
    const result = await updateOwnProfile(values);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success("Profile updated");
  }

  return (
    <Card>
      <CardContent className="p-5">
        <div className="mb-5 flex items-center gap-3">
          <Avatar className="h-14 w-14">
            <AvatarFallback className="text-base">{initials(profile.firstName, profile.lastName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {profile.firstName} {profile.lastName}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>@{profile.username}</span>
              <Badge variant="outline" className="capitalize">
                {profile.role.toLowerCase()}
              </Badge>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" {...register("firstName")} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" {...register("lastName")} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
            </div>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save profile
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
