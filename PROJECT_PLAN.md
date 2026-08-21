# ScoutCRM — build plan to Sep 1

Real deadline is Sep 3, 10:00 AM PST. Target Sep 1 as the finish line so the
last two days are slack, not scramble — for fixing whatever breaks and for
being ready if you land in the Top 5 and have to pitch same-day.

## Status as of Aug 20

All of Week 1 is done, ahead of schedule:
- ~~Xano workspace live, 3 tables + 8 endpoints, tested end-to-end~~ ✅
- ~~SerpApi + Anthropic keys wired in~~ ✅ — real live signals, real
  Claude drafts, zero mock-data labels left anywhere in the UI
- ~~Xano-native auth~~ ✅ — login/signup, per-user lead scoping,
  cross-user access blocked, verified end-to-end via Playwright (signup →
  add lead → logout → re-login → same data)

See `XANO_SETUP.md` for exactly what's deployed and the gotchas hit along
the way (worth skimming — some of it is genuinely good "challenges we ran
into" material for the submission).

## Week 1 — Aug 17 to Aug 23: go from mock to real ✅ DONE

- ~~Deploy the frontend~~ ✅ — live on Vercel at
  **https://scoutcrm-ten.vercel.app**, with production env vars set for
  the real Xano/SerpApi/Claude keys. Verified end-to-end against the live
  URL (signup, create, enrich, draft, delete all confirmed working).
- ~~Delete-lead flow~~ ✅ — full XanoScript DELETE endpoint (cascades to
  that lead's signals + drafts), wired through the Next.js API route and
  a confirm-then-delete button in the lead drawer. Verified: normal
  delete, cascade, idempotent re-delete (404), and unauthenticated delete
  blocked (404).

**Still open**
- Clean up smoke-test leads/users in the Xano dashboard (list in
  `XANO_SETUP.md`) before recording the demo.

## Week 2 — Aug 24 to Aug 30: make it good, not just working

**Aug 24-26 — the feature that makes you stand out**
Pick one, don't do all three — depth beats breadth per the Xano and
name.com judging criteria specifically calling out "surface-level" vs
"meaningful" integration:
- Bulk enrich (enrich every "New" lead at once) — good demo moment.
- Weekly digest: re-enrich all active leads, surface only what changed.
- name.com stretch: when a lead converts to "Won," suggest and register a
  matching landing-page domain. Only worth it if it stays a clean bolt-on
  — don't force it if it dilutes the core story.

**Aug 26-28 — UI polish**
- Empty states, loading states, error states (a demo that shows a raw
  error message loses points on "technical execution").
- Mobile isn't the priority (judges will watch a laptop demo) but the
  drawer shouldn't visibly break at common projector resolutions —
  sanity-check at 1280x800.
- Tighten the pipeline board: drag-and-drop stage changes would read much
  better live than the dropdown, if there's time.

**Aug 28-30 — real-data test pass**
- Add 5-8 real companies as leads (not the seeded fake ones) and run the
  full enrich → draft flow on each. This is the actual QA — it'll surface
  where SerpApi results are noisy or Claude's drafts go generic.
- Fix whatever breaks. Do not add new features this window.

## Aug 31 - Sep 1: submission, not code

- Record the demo video (2-4 min): add a lead → enrich (show real live
  results) → generate draft (show it referencing the live signal) → move
  through pipeline. Script is basically `SUBMISSION.md`'s "what it does"
  section.
- Retake screenshots against the live app (not the mock ones from this
  session).
- Fill in the real "how long did it take" / hours-spent fields in
  `SUBMISSION.md` — you'll actually know by now.
- Submit on Devpost, check the Xano + SerpApi challenge boxes (and
  name.com if you built that piece), plus you're automatically in the
  overall round.
- Submit a day early if at all possible — Devpost/Xano/SerpApi sites lag
  under load right at deadlines.

## Sep 2-3: buffer + onsite

- Nothing new. If notified for Top 5, you're pitching from `SUBMISSION.md`
  material you already have memorized, not writing it under pressure.

## Where I can help without your keys, right now

- Draft-quality UI copy, empty/error states, README/demo script — all
  buildable against the mock data.
- The name.com stretch feature scaffolding, if you want it, ahead of you
  having live SerpApi/Xano keys.
- A rehearsed 2-4 min demo script once the feature set is locked.

## Where I'm blocked on you

- Xano tables/endpoints going live (needs your account + CLI auth).
- Real SerpApi/Claude output (needs your keys in `.env.local`).
- The actual deploy (needs your Vercel/Xano account).
