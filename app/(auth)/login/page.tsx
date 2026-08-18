"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Loader2, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";

/** Hand-built taijitu — the page's one deliberate flourish, tying the login screen to the academy's name. */
function TaijituEmblem() {
  return (
    <svg
      viewBox="0 0 100 100"
      className="h-28 w-28 motion-safe:animate-[spin_50s_linear_infinite] sm:h-36 sm:w-36"
      aria-hidden="true"
    >
      <circle cx="50" cy="50" r="49" fill="#E7DCC5" stroke="#E7DCC5" strokeWidth="1" />
      <path
        d="M50,1 A24.5,24.5 0 0,1 50,50 A24.5,24.5 0 0,0 50,99 A49,49 0 0,1 50,1 Z"
        fill="#9E2A2B"
      />
      <circle cx="50" cy="25.5" r="8" fill="#9E2A2B" />
      <circle cx="50" cy="74.5" r="8" fill="#E7DCC5" />
    </svg>
  );
}

function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setLoading(true);
    const result = await signIn("credentials", { ...values, redirect: false });
    setLoading(false);

    if (!result || result.error) {
      if (!result || result.error === "CredentialsSignin") {
        toast.error("That username or password isn't right.");
      } else {
        // Not a bad-credentials case (e.g. a config or connection problem) — say so
        // plainly instead of misleadingly blaming the password. Check server logs
        // for the underlying [auth] message.
        console.error("Sign-in error:", result.error);
        toast.error(`Couldn't sign in (${result.error}). Try again in a moment.`);
      }
      return;
    }

    // A hard navigation (rather than router.push + router.refresh) guarantees the
    // server sees the freshly-set session cookie on the very first render of the
    // destination page — avoids landing on a stale/unauthenticated-looking dashboard.
    window.location.href = callbackUrl;
  }

  return (
    <div className="w-full max-w-sm">
      <p className="mb-1 font-mono text-[11px] uppercase tracking-[0.2em] text-[#9E2A2B]">Member sign in</p>
      <h1 className="mb-8 font-serif text-3xl text-[#1B1B18]">Welcome back</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="username" className="text-[#1B1B18]">
            Username or email
          </Label>
          <Input
            id="username"
            autoComplete="username"
            autoFocus
            className="rounded-none border-x-0 border-t-0 border-b-2 border-[#1B1B18]/20 bg-transparent px-0 shadow-none focus-visible:border-[#9E2A2B] focus-visible:ring-0"
            {...register("username")}
          />
          {errors.username && <p className="text-xs text-[#9E2A2B]">{errors.username.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[#1B1B18]">
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="rounded-none border-x-0 border-t-0 border-b-2 border-[#1B1B18]/20 bg-transparent px-0 shadow-none focus-visible:border-[#9E2A2B] focus-visible:ring-0 pr-8"
              {...register("password")}
            />
            <button
              type="button"
              className="absolute right-0 top-1/2 -translate-y-1/2 text-[#1B1B18]/40 hover:text-[#1B1B18]/70"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Eye className="h-4 w-4" aria-hidden="true" />
              )}
              <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
            </button>
          </div>
          {errors.password && <p className="text-xs text-[#9E2A2B]">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="mt-2 h-11 w-full rounded-sm bg-[#9E2A2B] text-[#F3EEE3] hover:bg-[#832222]"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Sign in
        </Button>
      </form>

      <div className="mt-8 rounded-sm border border-[#1B1B18]/10 bg-[#1B1B18]/[0.03] px-3.5 py-2.5">
        <p className="font-mono text-[11px] uppercase tracking-wider text-[#1B1B18]/50">Demo credentials</p>
        <p className="mt-1 text-xs text-[#1B1B18]/70">admin / admin123 &middot; coach.hari / coach123 &middot; ram.sharma / student123</p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-dvh flex-col sm:flex-row">
      {/* Brand panel */}
      <div className="relative flex min-h-[38vh] flex-col justify-between overflow-hidden bg-[#16181B] px-8 py-10 text-[#E7DCC5] sm:min-h-dvh sm:w-[42%] sm:px-12 sm:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(135deg, #E7DCC5 0px, #E7DCC5 1px, transparent 1px, transparent 28px)",
          }}
          aria-hidden="true"
        />

        <p className="relative font-mono text-[11px] uppercase tracking-[0.25em] text-[#E7DCC5]/60">
          YinYang Wushu Sanda Center
        </p>

        <div className="relative flex flex-1 flex-col items-start justify-center gap-6 py-8 sm:py-0">
          <TaijituEmblem />
          <div>
            <h2 className="font-serif text-3xl leading-tight sm:text-4xl">
              Balance in
              <br />
              every session.
            </h2>
            <p className="mt-3 max-w-xs text-sm text-[#E7DCC5]/70">
              Manage students, classes, attendance, and memberships from one place.
            </p>
          </div>
        </div>

        <div className="relative flex gap-6 border-t border-[#E7DCC5]/15 pt-4 text-xs text-[#E7DCC5]/60">
          <span>Sanda</span>
          <span>Wushu</span>
          <span>Taichi</span>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center bg-[#F3EEE3] px-6 py-14 sm:px-12">
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}