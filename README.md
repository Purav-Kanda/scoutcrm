# ScoutCRM

**An AI sales CRM that replaces stale contact cards with live web signals.**

Built for the DevNetwork [API + Cloud + AI] Hackathon 2026 — targeting the
**Xano** challenge ("Rebuild a SaaS Tool You Hate") and the **SerpApi**
challenge ("Best AI Use Case"), plus the overall track.

## The problem

Every CRM (Salesforce, HubSpot, Clay) stores what you typed in six months
ago. Reps still open five tabs to check "has anything changed at this
company" before a call. ScoutCRM does that lookup automatically and turns
it straight into a ready-to-send email.

## What it does

1. Add a lead (company + contact).
2. Click **Enrich** — the app calls **SerpApi** (Google News, Google Jobs,
   Google Search) live for that company and stores the results as
   structured "signals": recent news, open roles, web presence.
3. Click **Generate** — an AI drafting step (Claude, via Anthropic's API)
   reads those live signals and writes a short, specific outreach email
   that references something *actually happening right now* at the
   company, instead of a generic template.
4. Drag the lead through a pipeline (New → Researching → Contacted →
   Qualified → Proposal → Won/Lost).

## Stack

- **Frontend:** Next.js 16 (App Router) + Tailwind, single self-contained
  repo, no separate backend service to deploy.
- **Backend/data:** designed against Xano from day one — see
  [`XANO_SETUP.md`](./XANO_SETUP.md) for the exact tables/endpoints and how
  the data layer (`src/lib/data.ts`) swaps from an in-memory mock to real
  Xano `fetch()` calls with a single env var.
- **Live data:** SerpApi (`src/lib/serpapi.ts`) — Google News, Jobs, and
  Search engines.
- **AI drafting:** Anthropic Claude (`src/lib/ai.ts`), with a clearly
  labeled template fallback if no key is set so the app never breaks in a
  demo.

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

- **Xano ("rebuild a SaaS tool you hate"):** replaces the lead-research
  half of a CRM — the part everyone actually hates doing by hand — with
  Xano powering auth, the data model, and business logic (lead → signals →
  draft pipeline).
- **SerpApi ("best AI use case"):** the AI output is materially better
  *because* of live search data — the whole pitch is "don't let the AI
  make things up, ground it in what's true right now."

## What's next / not built for the hackathon deadline

- Real auth (Xano handles this natively once wired up — see setup doc)
- Sending the drafted email (would need an email-sending API, e.g.
  SendGrid/Gmail — out of scope for the demo)
- Multi-user workspaces / teams
