import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // Protect /settings - require authentication
  if (pathname.startsWith("/settings")) {
    const authCookie = request.cookies.get("mineral-auth");
    if (authCookie?.value !== "authenticated") {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If logged in and trying to access /login, redirect to home
  if (pathname === "/login") {
    const authCookie = request.cookies.get("mineral-auth");
    if (authCookie?.value === "authenticated") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/settings/:path*", "/login"],
};
