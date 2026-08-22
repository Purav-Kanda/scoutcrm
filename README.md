# ScoutCRM

[![CI](https://github.com/Purav-Kanda/scoutcrm/actions/workflows/ci.yml/badge.svg)](https://github.com/Purav-Kanda/scoutcrm/actions/workflows/ci.yml)

**An AI sales CRM that replaces stale contact cards with live web signals.**

🔗 **Live app:** https://scoutcrm-ten.vercel.app
📦 Built for the DevNetwork [API + Cloud + AI] Hackathon 2026 — targeting the
**Xano** challenge and the **SerpApi** challenge ("Best AI Use Case"), plus
the overall track.

## The problem

Every CRM (Salesforce, HubSpot, Clay) stores what you typed in six months
ago. Reps still open five tabs to check "has anything changed at this
company" before a call. ScoutCRM does that lookup automatically — live —
and turns it straight into a ready-to-send email.

## What it does

1. Add a lead (company + contact), or click **Enrich all New** to run live
   enrichment across every unenriched lead in one click.
2. Enrich calls **SerpApi** (Google News, Google Jobs, Google Search) live
   for that company and stores the results as structured "signals": recent
   news, open roles, web presence — filtered to drop navigational noise
   (login pages, privacy policies) so only substantive results survive.
3. Click **Generate** — Claude (Anthropic API) reads those live signals and
   writes a short, specific outreach email that references something
   *actually happening right now* at the company, instead of a generic
   template.
4. Move the lead through a pipeline (New → Researching → Contacted →
   Qualified → Proposal → Won/Lost) via color-coded stage pills.
5. Delete a lead and its signals/drafts cascade with it.

All of this runs behind real multi-user auth — sign up, and your leads are
yours: scoped and enforced server-side, not just hidden in the UI.

## Stack

- **Frontend:** Next.js 16 (App Router) + Tailwind, single self-contained
  repo, no separate backend service to deploy. Deployed on Vercel.
- **Backend:** Xano — 3 tables (leads, signals, outreach_drafts) + 9 REST
  endpoints, including auth-gated per-user scoping and a cascading delete.
  See [`XANO_SETUP.md`](./XANO_SETUP.md) for the exact schema, the
  XanoScript gotchas hit along the way, and how the data layer
  (`src/lib/data.ts`) swaps between an in-memory mock and real Xano calls
  with a single env var.
- **Live data:** SerpApi (`src/lib/serpapi.ts`) — Google News, Jobs, and
  Search engines, with a two-layer filter (query-level exclusion + title
  heuristic) that drops login/privacy/terms navigational junk from results.
- **AI drafting:** Anthropic Claude (`src/lib/ai.ts`), with a clearly
  labeled template fallback if no key is set so the app never breaks in a
  demo.
- **Auth:** Xano's built-in auth system — bearer tokens, per-user data
  scoping and cross-user access blocking enforced in XanoScript, not just
  the frontend.

## Running it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. Works immediately with realistic seeded leads
and clearly-labeled mock signals/drafts — no API keys required to try it.

To use live data, copy `.env.example` → `.env.local` and set `SERPAPI_KEY`
and/or `ANTHROPIC_API_KEY`. To use a real Xano backend instead of the
in-memory store, see `XANO_SETUP.md`.

## Why this fits both challenges

- **Xano:** the backend isn't a thin CRUD wrapper — auth, per-user data
  scoping, and a cascading delete are all enforced in XanoScript on the
  server, not bolted on in the frontend. `XANO_SETUP.md` documents a real
  data-corruption bug (partial updates silently blanking fields) found and
  fixed by testing against the live API.
- **SerpApi ("best AI use case"):** the AI output is materially better
  *because* of live search data — the whole pitch is "don't let the AI
  make things up, ground it in what's true right now." The signal-quality
  filter exists because we tested against real companies and found (and
  fixed) cases where raw search results were navigational noise, not
  useful signal.

## What's next

- Sending the drafted email directly (would need an email-sending API,
  e.g. SendGrid/Gmail — out of scope for the demo)
- Drag-and-drop stage changes (currently one-click stage pills)
- Team/shared workspaces on top of the per-user auth already in place
