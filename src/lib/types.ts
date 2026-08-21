// These types mirror the exact tables we will create in Xano.
// See XANO_SETUP.md for the matching table/field definitions and
// endpoint names, so swapping the mock data layer for real Xano
// REST calls is a drop-in replacement (see lib/data.ts).

export type LeadStage =
  | "new"
  | "researching"
  | "contacted"
  | "qualified"
  | "proposal"
  | "won"
  | "lost";

// `accent` drives the small stage-color system used across the board,
// drawer, and stage pills — keeps color meaning consistent everywhere
// instead of every component picking its own palette.
export const LEAD_STAGES: {
  key: LeadStage;
  label: string;
  accent: string; // tailwind color name, e.g. "slate", "blue"
}[] = [
  { key: "new", label: "New", accent: "slate" },
  { key: "researching", label: "Researching", accent: "sky" },
  { key: "contacted", label: "Contacted", accent: "amber" },
  { key: "qualified", label: "Qualified", accent: "violet" },
  { key: "proposal", label: "Proposal Sent", accent: "indigo" },
  { key: "won", label: "Won", accent: "emerald" },
  { key: "lost", label: "Lost", accent: "rose" },
];

// Xano table: leads
export interface Lead {
  id: string;
  company_name: string;
  website: string | null;
  contact_name: string;
  contact_title: string | null;
  contact_email: string | null;
  stage: LeadStage;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

// Xano table: signals (one row per enrichment run, linked lead_id -> leads.id)
export interface Signal {
  id: string;
  lead_id: string;
  source: "serpapi_news" | "serpapi_search" | "serpapi_jobs";
  headline: string;
  snippet: string;
  url: string | null;
  published_at: string | null;
  fetched_at: string;
}

// Xano table: outreach_drafts (linked lead_id -> leads.id)
export interface OutreachDraft {
  id: string;
  lead_id: string;
  subject: string;
  body: string;
  based_on_signal_ids: string[];
  generated_by: "claude" | "template_fallback";
  generated_at: string;
}

export interface EnrichmentResult {
  signals: Signal[];
  summary: string;
}
