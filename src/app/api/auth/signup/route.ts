import { NextRequest, NextResponse } from "next/server";

const XANO_AUTH_BASE_URL = process.env.XANO_AUTH_BASE_URL;

export async function POST(req: NextRequest) {
  if (!XANO_AUTH_BASE_URL) {
    return NextResponse.json(
      { error: "Auth isn't configured (XANO_AUTH_BASE_URL not set)" },
      { status: 500 }
    );
  }
  const body = await req.json();
  const res = await fetch(`${XANO_AUTH_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
