"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeTempPassword } from "@/lib/actions/user-accounts";
import { useSession } from "next-auth/react";

const changePasswordSchema = z
  .object({
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ChangePasswordInput>({ resolver: zodResolver(changePasswordSchema) });

  async function onSubmit(values: ChangePasswordInput) {
    if (!session?.user?.id) return;
    setLoading(true);
    try {
      await changeTempPassword(session.user.id, values.password);
      await update({ ...session, user: { ...session.user, requiresPasswordChange: false } });
      toast.success("Password changed successfully!");
      router.push("/login");
    } catch (err) {
      console.error(err);
      toast.error("An error occurred while changing your password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col sm:flex-row">
      <div className="flex flex-1 items-center justify-center bg-[#F3EEE3] px-6 py-14 sm:px-12">
        <div className="w-full max-w-sm">
          <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#9E2A2B]">Action Required</p>
          <h1 className="mb-8 font-serif text-3xl text-[#1B1B18]">Set New Password</h1>
          <p className="mb-6 text-sm text-[#1B1B18]/70">
            You are logging in with a temporary password. Please set a new password to continue.
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[#1B1B18]">
                New Password
              </Label>
              <Input
                id="password"
                type="password"
                className="rounded-none border-x-0 border-t-0 border-b-2 border-[#1B1B18]/20 bg-transparent px-0 shadow-none focus-visible:border-[#9E2A2B] focus-visible:ring-0"
                {...register("password")}
              />
              {errors.password && <p className="text-xs text-[#9E2A2B]">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword" className="text-[#1B1B18]">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                className="rounded-none border-x-0 border-t-0 border-b-2 border-[#1B1B18]/20 bg-transparent px-0 shadow-none focus-visible:border-[#9E2A2B] focus-visible:ring-0"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword && <p className="text-xs text-[#9E2A2B]">{errors.confirmPassword.message}</p>}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="mt-4 h-11 w-full rounded-sm bg-[#9E2A2B] text-[#F3EEE3] hover:bg-[#832222]"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              Update Password
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
