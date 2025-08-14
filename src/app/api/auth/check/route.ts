export const runtime = "nodejs";

import { verifyIdToken } from "@/lib/firebaseAdmin";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ valid: false }), { status: 400 });
    }

    const decoded = await verifyIdToken(token);
    return new Response(
      JSON.stringify({ valid: !!decoded }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(JSON.stringify({ valid: false }), { status: 200 });
  }
}
