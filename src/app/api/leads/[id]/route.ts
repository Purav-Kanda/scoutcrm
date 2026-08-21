import { NextRequest, NextResponse } from "next/server";
import { getLead, listSignals, listDrafts, updateLead, deleteLead } from "@/lib/data";
import { getToken } from "@/lib/auth";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = getToken(req);
  const lead = await getLead(id, token);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  const [signals, drafts] = await Promise.all([listSignals(id, token), listDrafts(id, token)]);
  return NextResponse.json({ lead, signals, drafts });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const patch = await req.json();
  const lead = await updateLead(id, patch, getToken(req));
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ok = await deleteLead(id, getToken(req));
  if (!ok) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
