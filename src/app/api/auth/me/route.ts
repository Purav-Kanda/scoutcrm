import { NextRequest, NextResponse } from "next/server";
import { getToken } from "@/lib/auth";

const XANO_AUTH_BASE_URL = process.env.XANO_AUTH_BASE_URL;

export async function GET(req: NextRequest) {
  if (!XANO_AUTH_BASE_URL) {
    return NextResponse.json(
      { error: "Auth isn't configured (XANO_AUTH_BASE_URL not set)" },
      { status: 500 }
    );
  }
  const token = getToken(req);
  if (!token) {
    return NextResponse.json({ error: "No token" }, { status: 401 });
  }
  const res = await fetch(`${XANO_AUTH_BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
