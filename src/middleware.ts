import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;
  const isAuthPage = pathname === "/auth/login" || pathname === "/auth/register";

  if (!token && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  if (token) {
    const verifyRes = await fetch(new URL("/api/auth/check", req.url), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const { valid } = await verifyRes.json();

    if (!valid) {
      const res = NextResponse.redirect(new URL("/auth/login", req.url));
      res.cookies.set({
        name: "token",
        value: "",
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 0,
      });
      return res;
    }

    if (isAuthPage) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/auth/login", "/auth/register"],
};
