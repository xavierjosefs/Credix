import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get("auth_token")?.value;
  const isProtectedRoute =
    pathname.startsWith("/home") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/loans") ||
    pathname.startsWith("/cash") ||
    pathname.startsWith("/settings");

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(token ? "/home" : "/login", request.url)
    );
  }

  if (isProtectedRoute && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/home/:path*",
    "/clients/:path*",
    "/loans/:path*",
    "/cash/:path*",
    "/settings/:path*",
    "/login",
    "/auth/login/:path*",
  ],
};
