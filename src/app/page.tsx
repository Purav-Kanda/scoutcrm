"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Lead, LeadStage, LEAD_STAGES } from "@/lib/types";
import { STAGE_COLORS, StageAccent } from "@/lib/stageColors";
import LeadDrawer from "@/components/LeadDrawer";
import NewLeadModal from "@/components/NewLeadModal";
import { authFetch, AUTH_REQUIRED, getStoredToken, clearStoredToken } from "@/lib/authClient";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}

export default function Home() {
  const router = useRouter();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showNewLead, setShowNewLead] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const res = await authFetch("/api/leads");
      if (res.status === 401) {
        clearStoredToken();
        router.push("/login");
        return;
      }
      if (!res.ok) {
        setError("Couldn't load your leads. Try refreshing.");
        setLoading(false);
        return;
      }
      setLeads(await res.json());
      setLoading(false);
    } catch {
      setError("Can't reach the server. Check your connection and try again.");
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (AUTH_REQUIRED && !getStoredToken()) {
      router.push("/login");
      return;
    }
    // Standard "fetch on mount" pattern.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    if (AUTH_REQUIRED) {
      authFetch("/api/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((me) => me?.name && setUserName(me.name))
        .catch(() => {});
    }
  }, [refresh, router]);

  const logout = () => {
    clearStoredToken();
    router.push("/login");
  };

  const grouped: Record<LeadStage, Lead[]> = LEAD_STAGES.reduce((acc, s) => {
    acc[s.key] = leads.filter((l) => l.stage === s.key);
    return acc;
  }, {} as Record<LeadStage, Lead[]>);

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900">
      <header className="sticky top-0 z-30 border-b border-neutral-200/80 bg-white/90 backdrop-blur-sm px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-white text-sm font-bold shrink-0">
            S
          </div>
          <div>
            <h1 className="text-base font-semibold tracking-tight leading-tight">ScoutCRM</h1>
            <p className="text-xs text-neutral-500 leading-tight hidden sm:block">
              AI sales intelligence &mdash; live web signals, not stale contact cards.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {userName && (
            <span className="hidden sm:flex items-center gap-2 text-sm text-neutral-500">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-neutral-100 text-[11px] font-medium text-neutral-600">
                {initials(userName)}
              </span>
              {userName}
            </span>
          )}
          <button
            onClick={() => setShowNewLead(true)}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-700 active:scale-[0.98] transition-all"
          >
            + Add lead
          </button>
          {AUTH_REQUIRED && (
            <button
              onClick={logout}
              className="rounded-lg border border-neutral-200 px-3 py-2 text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
            >
              Log out
            </button>
          )}
        </div>
      </header>

      <main className="p-6 overflow-x-auto">
        {error && (
          <div className="mb-4 flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button
              onClick={refresh}
              className="rounded-md border border-red-300 bg-white px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
            >
              Retry
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex gap-4 min-w-max">
            {LEAD_STAGES.slice(0, 5).map((stage) => (
              <div key={stage.key} className="w-72 shrink-0">
                <div className="h-3 w-16 rounded bg-neutral-200 animate-pulse mb-3" />
                <div className="space-y-2">
                  {[0, 1].map((i) => (
                    <div
                      key={i}
                      className="h-16 rounded-lg border border-neutral-200 bg-white p-3 animate-pulse"
                    >
                      <div className="h-3 w-3/4 rounded bg-neutral-200 mb-2" />
                      <div className="h-2.5 w-1/2 rounded bg-neutral-100" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : !error && leads.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-24">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 mb-4 text-xl">
              🎯
            </div>
            <p className="text-sm font-medium text-neutral-700">No leads yet</p>
            <p className="text-sm text-neutral-400 mt-1 max-w-sm">
              Add your first lead, then enrich it with live signals and generate a grounded
              outreach draft in one click.
            </p>
            <button
              onClick={() => setShowNewLead(true)}
              className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-neutral-700 transition-colors"
            >
              + Add your first lead
            </button>
          </div>
        ) : (
          <div className="flex gap-4 min-w-max">
            {LEAD_STAGES.map((stage) => {
              const colors = STAGE_COLORS[stage.accent as StageAccent];
              return (
                <div key={stage.key} className="w-72 shrink-0">
                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`h-1.5 w-1.5 rounded-full ${colors.dot}`} />
                    <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                      {stage.label}
                    </h2>
                    <span className="ml-auto text-xs font-medium text-neutral-400 bg-neutral-100 rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                      {grouped[stage.key]?.length ?? 0}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {(grouped[stage.key] ?? []).map((lead) => (
                      <button
                        key={lead.id}
                        onClick={() => setSelectedId(lead.id)}
                        className={`w-full text-left rounded-xl border border-neutral-200 border-l-[3px] ${colors.cardBorder} bg-white p-3 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-150`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-[11px] font-semibold text-neutral-500">
                            {initials(lead.company_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-sm text-neutral-900 truncate">
                              {lead.company_name}
                            </p>
                            <p className="text-xs text-neutral-500 mt-0.5 truncate">
                              {lead.contact_name}
                            </p>
                            {lead.contact_title && (
                              <p className="text-xs text-neutral-400 truncate">
                                {lead.contact_title}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    {(grouped[stage.key] ?? []).length === 0 && (
                      <p className="text-xs text-neutral-300 px-1 py-4 text-center border border-dashed border-neutral-200 rounded-xl">
                        Empty
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {selectedId && (
        <LeadDrawer
          leadId={selectedId}
          onClose={() => setSelectedId(null)}
          onLeadUpdated={refresh}
          onLeadDeleted={() => {
            setSelectedId(null);
            refresh();
          }}
        />
      )}

      {showNewLead && (
        <NewLeadModal
          onClose={() => setShowNewLead(false)}
          onCreated={() => {
            setShowNewLead(false);
            refresh();
          }}
        />
      )}
    </div>
  );
}
