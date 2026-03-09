import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let auth API routes pass through
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  let session: any = null;
  try {
    session = await auth();
  } catch {
    // If auth fails (e.g. missing secret), allow page to handle it
    return NextResponse.next();
  }

  const isLoggedIn = !!session?.user;
  const role = session?.user?.role;

  if (pathname === "/login") {
    if (isLoggedIn) {
      const dest = role === "ADMIN" ? "/dashboard/admin" : "/dashboard/member";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/member", req.url));
    }
    if (pathname.startsWith("/dashboard/member") && role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/dashboard/:path*"],
};
