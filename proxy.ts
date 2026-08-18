import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
import { ROUTE_ROLES } from "@/lib/permissions";

const PUBLIC_PATHS = ["/login", "/unauthorized", "/forbidden"];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p)) || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  const session = req.auth;

  if (!session?.user) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const matchedPrefix = Object.keys(ROUTE_ROLES).find((prefix) => pathname.startsWith(prefix));

  if (matchedPrefix) {
    const allowedRoles = ROUTE_ROLES[matchedPrefix];
    if (!allowedRoles.includes(session.user.role)) {
      return NextResponse.redirect(new URL("/forbidden", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  // Run on everything except static assets and Next internals.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
