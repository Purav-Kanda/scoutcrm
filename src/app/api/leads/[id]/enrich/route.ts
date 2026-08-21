import { NextRequest, NextResponse } from "next/server";
import { getLead, saveSignals } from "@/lib/data";
import { gatherSignals } from "@/lib/serpapi";
import { getToken } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = getToken(req);
  const lead = await getLead(id, token);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  const raw = await gatherSignals(lead.company_name, lead.website);
  const saved = await saveSignals(
    raw.map((s) => ({ ...s, lead_id: id })),
    token
  );
  return NextResponse.json(saved);
}
