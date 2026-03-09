import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

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

  if (pathname === "/") {
    if (isLoggedIn) {
      const dest = role === "ADMIN" ? "/dashboard/admin" : "/dashboard/member";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/", "/login", "/dashboard/:path*"],
};
