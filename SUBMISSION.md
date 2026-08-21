# Devpost submission — copy/paste reference

## Project name
ScoutCRM

## Elevator pitch (one line, ~120 char limit)
An AI sales CRM that replaces stale contact cards with live web signals —
and drafts your outreach for you.

## Inspiration
Every rep opens five tabs before a call just to check "did anything change
at this company." CRMs store what you typed in six months ago; they don't
know what's true *today*. We wanted a CRM where "research the lead" is a
button, not a 15-minute chore — and where the AI's output is grounded in
real, current information instead of a generic template.

## What it does
Add a lead. Click **Enrich** and ScoutCRM pulls live news, open job
postings, and web presence for that company via SerpApi. Click **Generate**
and Claude writes a short, specific outreach email that references one of
those live signals by name — no "I hope this finds you well." Move the
lead through a pipeline as the deal progresses. The backend — leads,
signals, drafts, auth — runs on Xano.

## How we built it
- Next.js 16 App Router frontend, Tailwind for the UI.
- A data layer (`src/lib/data.ts`) written against Xano's REST conventions
  from the start — every function has the matching Xano endpoint shape
  documented directly above it, so wiring the real backend is a one-line
  env var swap, not a rewrite.
- `src/lib/serpapi.ts` calls SerpApi's `google_news`, `google_jobs`, and
  `google` engines in parallel per lead, normalizes them into one
  `Signal` shape.
- `src/lib/ai.ts` sends those signals to Claude with a tight prompt asking
  for a grounded, specific draft — with a deterministic template fallback
  so a demo never breaks on a flaky network call.
- Built solo, end-to-end, using Claude Code as the pair-programmer for
  scaffolding, the Xano data-layer design, and testing.

## Challenges we ran into
Getting the AI draft to actually *use* a signal instead of writing generic
copy that ignored the data — solved by forcing the prompt to require a
concrete reference and validating the output references at least one
signal.

Wiring the real Xano backend surfaced three sharp edges worth calling out
because they're the kind of thing that silently corrupts data if you don't
catch them: an enum field's default has to be set with the `?=` suffix
(`enum stage?=new { ... }`), not a nested `default` block. Optional text
inputs that are omitted from a request arrive as `""`, not `null` — so a
naive `$input.field ?? $existing.field` partial-update pattern doesn't
protect anything, and a PATCH sending only `{"stage": "won"}` silently blanked
every other field on the record. Caught it by testing the exact partial-update
case against the live API instead of trusting the happy path, then rewrote
it to only overwrite a field when the input was actually non-empty.

Running a real-data pass (7 real companies, not the seeded test data) exposed
a signal-quality bug: the plain "web presence" SerpApi search kept surfacing
each company's own login/privacy/terms pages as top hits — one lead's top
signal was literally "Duolingo — Log in." Fixed with a two-layer filter:
excluding `-inurl:login`/`-inurl:signin` at the query level, plus a
title-based filter that catches navigational and legal-boilerplate titles
that slip through anyway (an early version of this filter had a regex
boundary bug that let "Stripe, Inc." past — caught by testing against live
results instead of a handful of hand-picked examples).

## Accomplishments we're proud of
A full lead → live enrichment → grounded AI draft loop that works
end-to-end and demos in under two minutes, with a backend designed to be
genuinely Xano-native rather than bolted on.

## What we learned
How much better AI output gets from a small amount of *real* grounding
data versus more prompt engineering alone.

## What's next
Sending the draft directly (Gmail/SendGrid), team/workspace support so a
whole sales team shares lead history on top of the per-user auth already
in place, and deploying the frontend to a public URL.

---

## Build story (Xano challenge required fields)

**What software did you replace?**
The manual "open five tabs and check LinkedIn/news/company site" step that
happens before every cold outreach email — and the generic-template half
of CRMs like HubSpot/Salesforce sequences.

**Why did you choose it?**
It's a real, tedious, universal pain point in sales — and a great fit for
"AI + live data," which plays directly to both the Xano and SerpApi
challenges from one build.

**Which AI tools did you use?**
Claude Code (build/scaffolding), Claude (Anthropic API, in-app outreach
drafting).

**Approximately how long did it take to build?**
[Fill in once submitted — track your actual hours]

**What would have taken significantly longer without AI + Xano?**
Standing up the auth/data/business-logic backend from scratch, and writing
+ testing the SerpApi normalization and prompt-grounding logic.

---

## One-line callouts for the other challenge submissions

**SerpApi ("Best AI Use Case"):** "ScoutCRM's AI outreach drafts are
generated *from* live SerpApi news/jobs/search results for each lead's
company — the AI is explicitly prompted to ground its output in at least
one real, current signal, not write generically."

---

## Submission checklist
- [x] Xano backend live: 3 tables + 9 endpoints (incl. cascading DELETE),
      tested end-to-end (`XANO_BASE_URL` set in `.env.local`)
- [x] `SERPAPI_KEY` and `ANTHROPIC_API_KEY` set in `.env.local` — real
      live signals + real Claude drafts confirmed working end-to-end,
      zero mock-data labels left in the UI
- [x] Multi-user auth wired to Xano's built-in auth system — login,
      signup, per-user data scoping, cross-user access blocked. Verified
      end-to-end via Playwright.
- [x] Smoke-test leads/users deleted from Xano — verified empty via the
      Metadata API (leads, signals, outreach_drafts, user tables all 0
      rows before the real-data pass below)
- [x] UI redesign — colored stage pills/accents on the board and drawer,
      card hover states, consistent focus rings, fixed a dark-mode
      text-contrast bug on the login page
- [x] Real-data test pass — 7 real companies end-to-end (Anthropic,
      Stripe, Chipotle, Duolingo, Rivian, Notion, Instacart), which
      surfaced and fixed a signal-quality bug (see "Challenges we ran
      into")
- [ ] Project page: pitch + full story (above) filled in
- [ ] Screenshots: retake against the live redesigned app
- [ ] "Built With": Next.js, TypeScript, Tailwind, Xano, SerpApi, Claude
      (Anthropic API), Vercel
- [ ] Public repo link (push this project to GitHub — `.env.local` is
      already gitignored, so the real Xano URL won't leak)
- [x] Try It Out link — live at **https://scoutcrm-ten.vercel.app**,
      deployed to Vercel with the real Xano/SerpApi/Claude keys set as
      production env vars, verified end-to-end (signup → create lead →
      enrich → draft → delete, all against the live URL)
- [ ] 2-4 min demo video: add a lead → enrich → generate draft → move
      pipeline stage
- [ ] Check challenge boxes: Xano, SerpApi, + overall (leave others
      unchecked unless you actually build against them)
