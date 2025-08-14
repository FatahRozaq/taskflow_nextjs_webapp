import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * POST: body { token: string } -> set httpOnly cookie "token"
 * DELETE: clear cookie
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = body?.token;
    if (!token) return NextResponse.json({ ok: false }, { status: 400 });

    const res = NextResponse.json({ ok: true });
    // set HTTP only cookie, secure in prod
    res.cookies.set({
      name: "token",
      value: token,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // secure should be true in production (HTTPS)
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    return res;
  } catch (err) {
    return NextResponse.json({ ok: false, error: "invalid" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
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
