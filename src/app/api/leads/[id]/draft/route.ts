import { NextRequest, NextResponse } from "next/server";
import { getLead, listSignals, saveDraft } from "@/lib/data";
import { draftOutreach } from "@/lib/ai";
import { getToken } from "@/lib/auth";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const token = getToken(req);
  const lead = await getLead(id, token);
  if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });

  const signals = await listSignals(id, token);
  const { subject, body, generated_by } = await draftOutreach(lead, signals);
  const draft = await saveDraft(
    {
      lead_id: id,
      subject,
      body,
      based_on_signal_ids: signals.map((s) => s.id),
      generated_by,
    },
    token
  );
  return NextResponse.json(draft);
}
