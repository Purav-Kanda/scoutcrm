# ScoutCRM on Xano — status + reference

**Status: done.** The real Xano backend is live and tested end-to-end
(3 tables, 8 endpoints). This doc is now a reference for what's actually
deployed and the gotchas hit along the way, so future edits don't
reintroduce the same bugs.

- Instance: `x6nu-3s4a-vabv.n7e.xano.io`
- Local workspace: `C:\Users\kanda\workspace` (pulled via `xano workspace
  pull`, pushed via `xano workspace push`)
- Local file layout is **`api/scout_crm/...`** (Xano's own snake_case
  naming), not `api/scoutcrm/...` — an earlier hand-authored copy under
  `api/scoutcrm/` was a duplicate and got moved to
  `_to_delete/scoutcrm_duplicate/` (renamed `.xs.bak` so the CLI's push
  scanner ignores it — do not restore these unless you delete the
  `scout_crm/` versions first).
- `.env.local` in this repo has `XANO_BASE_URL` pointing at the current
  API group base URL. **This URL can change** if the API group ever gets
  recreated — if the app suddenly 404s on every request, check the
  group's base URL in the Xano dashboard (API → ScoutCRM) and update
  `.env.local`.

## Editing a table or endpoint from here on

Any `.xs` file Xano has already pushed has a `guid = "..."` line at the
bottom of its block. **Always read the current file from the local
workspace and edit it in place — never regenerate it from scratch.**
Stripping the guid makes the next push treat it as a brand-new object
instead of an update, which creates duplicates and can break routing for
the whole API group (this happened once during the build — see below).

## Gotchas hit while wiring this up

**Enum defaults.** `default = "new"` as a nested block inside `enum stage
{ ... }` is invalid. Use the suffix form instead:
```
enum stage?=new {
  values = ["new", "researching", ...]
}
```

**Every `query` needs an `input` block**, even if empty:
```
input {
}
```
Omitting it entirely fails the push with "Missing block: input".

**Optional text inputs arrive as `""`, not `null`, when omitted.** This
means `$input.field ?? $existing.field` does *not* protect a field during
a partial update — `??` only falls back on `null`. A `PATCH` sending only
`{"stage": "won"}` silently blanked every other field until this was
caught by testing the exact partial-update case against the live API. The
fix: build the update from the existing record, then conditionally
overwrite only fields where `$input.field != ""`:
```
conditional {
  if ($input.company_name != "") {
    var.update $data.company_name { value = $input.company_name }
  }
}
```

**`if` must live inside a `conditional { }` block** — a bare `if` at the
stack's top level fails with "unexpected 'if'".

**`foreach` for loop-inserts** (used in `signals/bulk`):
```
foreach ($input.signals) {
  each as $s {
    db.add signals { data = { ... } }
  }
}
```

## Tables (as deployed)

### `leads`
company_name (text), website (text, optional), contact_name (text),
contact_title (text, optional), contact_email (email, optional), stage
(enum: new/researching/contacted/qualified/proposal/won/lost, default
new), notes (text, optional), created_at / updated_at (timestamp).

### `signals`
lead_id (ref → leads), source (enum: serpapi_news/serpapi_search/
serpapi_jobs), headline (text), snippet (text, optional), url (text,
optional), published_at (text, optional), created_at (timestamp).

### `outreach_drafts`
lead_id (ref → leads), subject (text), body (text), based_on_signal_ids
(json), generated_by (enum: claude/template_fallback), created_at
(timestamp).

## Endpoints (as deployed, all under the ScoutCRM API group)

`GET /leads` · `POST /leads` · `GET /leads/{lead_id}` ·
`PATCH /leads/{lead_id}` · `GET /leads/{lead_id}/signals` ·
`POST /signals/bulk` · `GET /leads/{lead_id}/drafts` · `POST /drafts`

This matches `src/lib/data.ts` exactly — every function there has the
matching Xano call commented directly above it.

## Auth (done)

Xano's starter workspace already ships a full auth system — `user` table
plus `Authentication` API group (`auth/login`, `auth/signup`, `auth/me`,
password reset, magic link). No need to build this from scratch; wired it
in instead:

- `leads` table got a `user_id` field (ref → `user`, nullable — existing
  unowned test rows are fine to leave or delete).
- Every ScoutCRM endpoint now requires `auth = "user"` and either filters
  by `$auth.id` (list/create) or does a `db.get` + two `precondition`
  checks to 404 on cross-user access (single-record get/patch, and the
  signals/drafts list endpoints, which check the parent lead's
  ownership).
- Known simplification: `POST /signals/bulk` requires login but doesn't
  verify each signal's `lead_id` belongs to the caller — acceptable since
  only our own server-side `/api/leads/[id]/enrich` route calls it, never
  the browser directly.
- Auth group base URL is separate from ScoutCRM's — set as
  `XANO_AUTH_BASE_URL` in `.env.local`.
- Frontend: `/login` page (login + signup toggle), token stored in
  `localStorage` (`src/lib/authClient.ts`), every API call goes through
  `authFetch()` which attaches the bearer token, every Next.js API route
  forwards it to Xano via `src/lib/auth.ts`'s `getToken()`.
- Verified end-to-end via Playwright: logged-out redirect, signup, scoped
  empty board for a new user, add lead, logout, re-login with same
  credentials shows the same lead.

## Delete (done)

- `leads/{lead_id}` `DELETE` — `auth = "user"`, ownership precondition,
  then cascades: queries and deletes every `signals` row and every
  `outreach_drafts` row referencing that lead before deleting the lead
  itself. Verified: normal delete, cascade (signals/drafts actually
  gone), idempotent re-delete returns 404, unauthenticated delete blocked
  (404).
- Frontend: confirm-then-delete button in the lead drawer
  (`src/components/LeadDrawer.tsx`), calls `DELETE /api/leads/[id]`
  (`src/app/api/leads/[id]/route.ts` → `deleteLead()` in
  `src/lib/data.ts`), closes the drawer and refreshes the board on
  success.

## Deploy (done)

- Live at **https://scoutcrm-ten.vercel.app**, deployed via the Vercel
  CLI with `XANO_BASE_URL`, `XANO_AUTH_BASE_URL`,
  `NEXT_PUBLIC_AUTH_REQUIRED`, `SERPAPI_KEY`, `ANTHROPIC_API_KEY` set as
  production environment variables (not committed anywhere — set
  directly via `vercel env add`). Verified end-to-end against the live
  URL: signup, create lead, enrich (real SerpApi), generate draft (real
  Claude), delete.

## Cleanup still needed before recording the demo

Smoke-test data accumulated across development and testing — delete
these from the Xano table browser (Metadata API token also works, via
`GET/DELETE /workspace/{id}/table/{id}/content/{row_id}`):

- **leads** table: "Testify Inc", "Nimbus Logistics", "Auth Test Co",
  "Playwright Test Co" (ids 1-4 as of last check).
- **user** table: "Purav Test" (purav.smoketest@example.com), the two
  "Playwright User" test accounts, "Delete Test", and "Deploy Smoke Test"
  (deploysmoke_test@example.com) — all created during testing, not real
  demo data.
- **signals** / **outreach_drafts**: check for any rows still referencing
  the deleted leads above (most should already be gone thanks to the
  cascading DELETE, but the pre-cascade smoke-test leads predate that
  endpoint).

## Still open

- Static hosting the frontend on Xano
  (`https://docs.xano.com/xano-cli/static-hosting`) — not needed now
  that Vercel deploy is live and working.
- Password reset / magic link flows exist in the Xano template but aren't
  wired into the frontend — not needed for the hackathon demo.
