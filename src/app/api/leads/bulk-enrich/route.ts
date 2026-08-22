import { NextRequest, NextResponse } from "next/server";
import { listLeads, saveSignals } from "@/lib/data";
import { gatherSignals } from "@/lib/serpapi";
import { getToken } from "@/lib/auth";

// Enriches every lead currently in the "new" stage for the calling user in
// one request. Runs sequentially (not Promise.all) on purpose — SerpApi's
// free tier is 100 searches/month and each lead burns 3, so this keeps
// usage predictable instead of firing a burst of parallel calls. A single
// lead's enrichment failing (rate limit, network blip) doesn't abort the
// rest — it's recorded and the batch continues.
export async function POST(req: NextRequest) {
  const token = getToken(req);
  const leads = await listLeads(token);
  const targets = leads.filter((l) => l.stage === "new");

  const results: { id: string; company_name: string; signals_added: number; error?: string }[] = [];

  for (const lead of targets) {
    try {
      const raw = await gatherSignals(lead.company_name, lead.website);
      const saved = await saveSignals(
        raw.map((s) => ({ ...s, lead_id: lead.id })),
        token
      );
      results.push({ id: lead.id, company_name: lead.company_name, signals_added: saved.length });
    } catch {
      results.push({ id: lead.id, company_name: lead.company_name, signals_added: 0, error: "enrich failed" });
    }
  }

  const enriched = results.filter((r) => !r.error).length;
  const totalSignals = results.reduce((sum, r) => sum + r.signals_added, 0);

  return NextResponse.json({
    total: targets.length,
    enriched,
    failed: targets.length - enriched,
    total_signals_added: totalSignals,
    results,
  });
}
