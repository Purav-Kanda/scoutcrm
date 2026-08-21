import { Lead, LeadStage, Signal, OutreachDraft } from "./types";

// ---------------------------------------------------------------------------
// DATA LAYER
//
// When XANO_BASE_URL is unset, this reads/writes an in-memory store so the
// app runs end-to-end with zero setup and no auth required (handy for
// local dev/demo). When XANO_BASE_URL is set, every call goes to the real
// Xano backend and requires a bearer token (see XANO_SETUP.md /
// src/lib/authClient.ts) — leads are scoped per-user on the Xano side.
// ---------------------------------------------------------------------------

const XANO_BASE_URL = process.env.XANO_BASE_URL; // e.g. https://xxxx.n7.xano.io/api:abcd1234

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// In-memory store, seeded on module load. Persists for the life of the
// server process (fine for a hackathon demo; ignored once Xano is live).
let leads: Lead[] = [];
let signals: Signal[] = [];
let drafts: OutreachDraft[] = [];

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function seed() {
  if (leads.length) return;
  const now = new Date().toISOString();
  leads = [
    {
      id: uid("lead"),
      company_name: "Brightloop Robotics",
      website: "brightlooprobotics.com",
      contact_name: "Dana Whitfield",
      contact_title: "VP of Operations",
      contact_email: "dana@brightlooprobotics.com",
      stage: "new",
      notes: "Met at a supply-chain conference, warm intro from a mutual contact.",
      created_at: now,
      updated_at: now,
    },
    {
      id: uid("lead"),
      company_name: "Harbor & Vine",
      website: "harborandvine.co",
      contact_name: "Miles Okafor",
      contact_title: "Head of Growth",
      contact_email: "miles@harborandvine.co",
      stage: "contacted",
      notes: "Replied once, went quiet after pricing question.",
      created_at: now,
      updated_at: now,
    },
    {
      id: uid("lead"),
      company_name: "Fernway Health",
      website: "fernwayhealth.io",
      contact_name: "Priya Ramaswami",
      contact_title: "Director of Partnerships",
      contact_email: "priya@fernwayhealth.io",
      stage: "qualified",
      notes: "Confirmed budget for Q4, evaluating two other vendors.",
      created_at: now,
      updated_at: now,
    },
  ];
}
seed();

// -- Leads --------------------------------------------------------------

// Xano GET /leads (auth required — scoped to $auth.id server-side)
export async function listLeads(token?: string): Promise<Lead[]> {
  if (XANO_BASE_URL) {
    const res = await fetch(`${XANO_BASE_URL}/leads`, {
      cache: "no-store",
      headers: authHeaders(token),
    });
    if (!res.ok) return [];
    return res.json();
  }
  return [...leads].sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

// Xano GET /leads/{id} (auth required — 404s if not owned by caller)
export async function getLead(id: string, token?: string): Promise<Lead | undefined> {
  if (XANO_BASE_URL) {
    const res = await fetch(`${XANO_BASE_URL}/leads/${id}`, {
      cache: "no-store",
      headers: authHeaders(token),
    });
    if (!res.ok) return undefined;
    return res.json();
  }
  return leads.find((l) => l.id === id);
}

// Xano POST /leads (auth required — server sets user_id from the token)
export async function createLead(
  input: Omit<Lead, "id" | "created_at" | "updated_at" | "stage"> & { stage?: LeadStage },
  token?: string
): Promise<Lead> {
  if (XANO_BASE_URL) {
    const res = await fetch(`${XANO_BASE_URL}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(input),
    });
    return res.json();
  }
  const now = new Date().toISOString();
  const lead: Lead = {
    id: uid("lead"),
    company_name: input.company_name,
    website: input.website,
    contact_name: input.contact_name,
    contact_title: input.contact_title ?? null,
    contact_email: input.contact_email ?? null,
    notes: input.notes ?? null,
    stage: input.stage ?? "new",
    created_at: now,
    updated_at: now,
  };
  leads = [lead, ...leads];
  return lead;
}

// Xano PATCH /leads/{id} (auth required — 404s if not owned by caller)
export async function updateLead(
  id: string,
  patch: Partial<Lead>,
  token?: string
): Promise<Lead | undefined> {
  if (XANO_BASE_URL) {
    const res = await fetch(`${XANO_BASE_URL}/leads/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(patch),
    });
    if (!res.ok) return undefined;
    return res.json();
  }
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return undefined;
  leads[idx] = { ...leads[idx], ...patch, updated_at: new Date().toISOString() };
  return leads[idx];
}

// Xano DELETE /leads/{id} (auth required — 404s if not owned by caller,
// cascades to that lead's signals + drafts server-side)
export async function deleteLead(id: string, token?: string): Promise<boolean> {
  if (XANO_BASE_URL) {
    const res = await fetch(`${XANO_BASE_URL}/leads/${id}`, {
      method: "DELETE",
      headers: authHeaders(token),
    });
    return res.ok;
  }
  const idx = leads.findIndex((l) => l.id === id);
  if (idx === -1) return false;
  leads = leads.filter((l) => l.id !== id);
  signals = signals.filter((s) => s.lead_id !== id);
  drafts = drafts.filter((d) => d.lead_id !== id);
  return true;
}

// -- Signals --------------------------------------------------------------

// Xano GET /leads/{lead_id}/signals (auth required)
export async function listSignals(leadId: string, token?: string): Promise<Signal[]> {
  if (XANO_BASE_URL) {
    const res = await fetch(`${XANO_BASE_URL}/leads/${leadId}/signals`, {
      cache: "no-store",
      headers: authHeaders(token),
    });
    if (!res.ok) return [];
    return res.json();
  }
  return signals
    .filter((s) => s.lead_id === leadId)
    .sort((a, b) => (a.fetched_at < b.fetched_at ? 1 : -1));
}

// Xano POST /signals/bulk (auth required)
export async function saveSignals(
  newSignals: Omit<Signal, "id" | "fetched_at">[],
  token?: string
): Promise<Signal[]> {
  const fetched_at = new Date().toISOString();
  const withIds = newSignals.map((s) => ({ ...s, id: uid("sig"), fetched_at }));
  if (XANO_BASE_URL) {
    const res = await fetch(`${XANO_BASE_URL}/signals/bulk`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ signals: withIds }),
    });
    return res.json();
  }
  signals = [...signals, ...withIds];
  return withIds;
}

// -- Outreach drafts --------------------------------------------------------------

// Xano GET /leads/{lead_id}/drafts (auth required)
export async function listDrafts(leadId: string, token?: string): Promise<OutreachDraft[]> {
  if (XANO_BASE_URL) {
    const res = await fetch(`${XANO_BASE_URL}/leads/${leadId}/drafts`, {
      cache: "no-store",
      headers: authHeaders(token),
    });
    if (!res.ok) return [];
    return res.json();
  }
  return drafts
    .filter((d) => d.lead_id === leadId)
    .sort((a, b) => (a.generated_at < b.generated_at ? 1 : -1));
}

// Xano POST /drafts (auth required)
export async function saveDraft(
  input: Omit<OutreachDraft, "id" | "generated_at">,
  token?: string
): Promise<OutreachDraft> {
  const draft: OutreachDraft = { ...input, id: uid("draft"), generated_at: new Date().toISOString() };
  if (XANO_BASE_URL) {
    const res = await fetch(`${XANO_BASE_URL}/drafts`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify(draft),
    });
    return res.json();
  }
  drafts = [draft, ...drafts];
  return draft;
}
