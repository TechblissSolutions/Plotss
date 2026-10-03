import { NextResponse } from "next/server";
import { DEV_COOKIE } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import type { Role } from "@/lib/types";

// Local-only stand-in for Google / phone-OTP sign-in until Supabase Auth is configured.
export async function POST(req: Request) {
  if (isSupabaseConfigured || process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "disabled" }, { status: 404 });
  }
  const { name, role } = (await req.json()) as { name?: string; role?: Role };
  const r: Role = (["buyer", "seller", "broker", "admin"] as const).includes(role as Role) ? (role as Role) : "buyer";
  const ids = { buyer: "b1", seller: "o1", broker: "o2", admin: "admin1" };
  const res = NextResponse.json({ ok: true });
  res.cookies.set(DEV_COOKIE, encodeURIComponent(JSON.stringify({ id: ids[r], name: name || "Demo user", role: r, phone: "+919876543210" })), {
    path: "/", httpOnly: true, sameSite: "lax",
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(DEV_COOKIE);
  return res;
}
