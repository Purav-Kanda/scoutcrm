"use client";

import { useEffect, useState, useCallback } from "react";
import { Lead, LeadStage, LEAD_STAGES, Signal, OutreachDraft } from "@/lib/types";
import { STAGE_COLORS, StageAccent } from "@/lib/stageColors";
import { authFetch } from "@/lib/authClient";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

const SOURCE_ICON: Record<Signal["source"], string> = {
  serpapi_news: "📰",
  serpapi_jobs: "💼",
  serpapi_search: "🔎",
};

export default function LeadDrawer({
  leadId,
  onClose,
  onLeadUpdated,
  onLeadDeleted,
}: {
  leadId: string;
  onClose: () => void;
  onLeadUpdated: () => void;
  onLeadDeleted: () => void;
}) {
  const [lead, setLead] = useState<Lead | null>(null);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [drafts, setDrafts] = useState<OutreachDraft[]>([]);
  const [enriching, setEnriching] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    const res = await authFetch(`/api/leads/${leadId}`);
    const data = await res.json();
    setLead(data.lead);
    setSignals(data.signals);
    setDrafts(data.drafts);
  }, [leadId]);

  useEffect(() => {
    // Standard "fetch on mount / when leadId changes" pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const changeStage = async (stage: LeadStage) => {
    await authFetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage }),
    });
    await load();
    onLeadUpdated();
  };

  const enrich = async () => {
    setEnriching(true);
    await authFetch(`/api/leads/${leadId}/enrich`, { method: "POST" });
    await load();
    setEnriching(false);
  };

  const generateDraft = async () => {
    setDrafting(true);
    await authFetch(`/api/leads/${leadId}/draft`, { method: "POST" });
    await load();
    setDrafting(false);
  };

  const deleteLead = async () => {
    setDeleting(true);
    const res = await authFetch(`/api/leads/${leadId}`, { method: "DELETE" });
    setDeleting(false);
    if (res.ok) {
      onLeadDeleted();
    } else {
      setConfirmingDelete(false);
    }
  };

  if (!lead) return null;

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="flex-1 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />
      <div className="w-full max-w-lg bg-white h-full shadow-2xl overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-neutral-100 text-sm font-semibold text-neutral-500">
              {initials(lead.company_name)}
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold truncate">{lead.company_name}</h2>
              <p className="text-sm text-neutral-500 truncate">
                {lead.contact_name}
                {lead.contact_title ? ` · ${lead.contact_title}` : ""}
              </p>
              {lead.contact_email && (
                <p className="text-xs text-neutral-400 mt-0.5 truncate">{lead.contact_email}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        <div className="p-6 space-y-6">
          {confirmingDelete ? (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 flex items-center justify-between gap-3">
              <span>Delete this lead and all its signals/drafts? This can&apos;t be undone.</span>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={deleteLead}
                  disabled={deleting}
                  className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting ? "Deleting…" : "Confirm delete"}
                </button>
                <button
                  onClick={() => setConfirmingDelete(false)}
                  disabled={deleting}
                  className="rounded-md border border-neutral-300 px-2.5 py-1 text-xs hover:bg-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmingDelete(true)}
              className="text-xs text-red-600 hover:text-red-700 hover:underline"
            >
              Delete lead
            </button>
          )}

          <div>
            <label className="text-xs font-semibold uppercase text-neutral-500">Stage</label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {LEAD_STAGES.map((s) => {
                const colors = STAGE_COLORS[s.accent as StageAccent];
                const active = lead.stage === s.key;
                return (
                  <button
                    key={s.key}
                    onClick={() => changeStage(s.key)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-all ${
                      active
                        ? `${colors.chipBg} ${colors.chipText} ${colors.chipBorder} ring-1 ${colors.ring}`
                        : "border-neutral-200 text-neutral-400 hover:border-neutral-300 hover:text-neutral-600"
                    }`}
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          {lead.notes && (
            <div>
              <label className="text-xs font-semibold uppercase text-neutral-500">Notes</label>
              <p className="mt-1 text-sm text-neutral-700">{lead.notes}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase text-neutral-500">
                Live signals (SerpApi)
              </label>
              <button
                onClick={enrich}
                disabled={enriching}
                className="text-xs rounded-full border border-neutral-300 px-3 py-1 font-medium hover:bg-neutral-50 hover:border-neutral-400 disabled:opacity-50 transition-colors"
              >
                {enriching ? "Fetching…" : signals.length ? "Refresh" : "Enrich"}
              </button>
            </div>
            {signals.length === 0 ? (
              <p className="text-xs text-neutral-400">
                No signals yet. Click Enrich to pull live news, jobs, and web presence for this
                company.
              </p>
            ) : (
              <ul className="space-y-2">
                {signals.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-neutral-200 p-2.5 text-sm hover:border-neutral-300 transition-colors"
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs">{SOURCE_ICON[s.source]}</span>
                      <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide">
                        {s.source.replace("serpapi_", "")}
                      </p>
                    </div>
                    <p className="font-medium text-neutral-800">{s.headline}</p>
                    {s.snippet && <p className="text-xs text-neutral-500 mt-0.5">{s.snippet}</p>}
                    {s.published_at && (
                      <p className="text-xs text-neutral-400 mt-0.5">{s.published_at}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase text-neutral-500">
                AI outreach draft
              </label>
              <button
                onClick={generateDraft}
                disabled={drafting}
                className="text-xs rounded-full bg-neutral-900 text-white px-3 py-1 font-medium hover:bg-neutral-700 disabled:opacity-50 transition-colors"
              >
                {drafting ? "Writing…" : "Generate"}
              </button>
            </div>
            {drafts.length === 0 ? (
              <p className="text-xs text-neutral-400">
                No draft yet. Enrich first for a sharper, signal-grounded email.
              </p>
            ) : (
              <div className="rounded-lg border border-neutral-200 bg-neutral-50/60 p-3.5 text-sm space-y-2">
                <p className="font-medium text-neutral-900">{drafts[0].subject}</p>
                <p className="text-neutral-700 whitespace-pre-line leading-relaxed">
                  {drafts[0].body}
                </p>
                <p className="text-xs text-neutral-400 flex items-center gap-1 pt-1">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      drafts[0].generated_by === "claude" ? "bg-violet-400" : "bg-neutral-300"
                    }`}
                  />
                  Generated by {drafts[0].generated_by === "claude" ? "Claude" : "template fallback"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
