import { NextRequest } from "next/server";

// Pulls the bearer token out of an incoming request's Authorization
// header, so our API routes can forward it to Xano.
export function getToken(req: NextRequest): string | undefined {
  const header = req.headers.get("authorization");
  if (!header) return undefined;
  const [, token] = header.split(" ");
  return token;
}
