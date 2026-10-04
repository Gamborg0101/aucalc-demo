# Status — resume here

Last updated: 2026-09-23. This is the project's working log, kept as-is in the public snapshot.

## Starting on a new machine

```bash
git clone https://github.com/Gamborg0101/frikoeb-calculator.git
cd frikoeb-calculator
npm install         # runs `prisma generate` via postinstall
npm test            # expect 169 passing
npm run dev          # http://localhost:3000 now redirects to /login — see "Auth" below
```

Needs Node 20+ (developed on 24.18.0, npm 11.16.0). `node_modules` is gitignored, so
`npm install` is required. The AU source PDFs are not included — see README "Source documents". **The whole site is gated behind per-person login as of 2026-09-03** — needs
`DATABASE_URL` (any Postgres) and `AUTH_SECRET` (see `.env.example`) in
`.env.local` before `npm run dev` is actually usable — then either sign up at `/signup` or seed an
account with `npx tsx scripts/create-user.ts <username> <name> <password>`. See "Auth" below.

**Read first:** `CLAUDE.md` (the rules that must not be violated) and then this file.

---

## Done

### Research — complete
Every domain question answered from primary AU sources. `docs/open-questions.md` has the full
resolved list. Three items (overhead rate 105/113/116%, the undervisningsfrikøb coefficient, and
DPU's frikøbsnotat) were sent to the consultants/institutleder on 2026-08-31. **A live conversation
the same day resolved the undervisningsfrikøb question** (with a worked AUFF example — see R18)
**and confirmed overhead is low-stakes for this tool's actual use case** (IDV-only, rare, no
bearing on hour registration). **2026-09-01: further practitioner input resolved the DPU question in substance** (their practice
numerically matches the standard model, R20) and **confirmed Vipomatic's own workday length**
(7,24 t — R24, now wired into the engine as `workDays`). Nothing blocks building or using the tool, and
past calculation examples are on their way from the consultant for cross-checking against the tool.

### Logic layer — complete, 169 tests passing

Everything under `src/lib/frikoeb/` — units, rounding, the derivation trace, the bidirectional
solver, the full cost stack (overhead/margin/moms with per-mechanism bases), multi-year
`timeline.ts` (**now wired into `solve()`, 2026-09-21** — see below), and `employmentFraction` for
part-time staff. `src/lib/frikoeb/index.ts` is the only public surface; the UI imports from there
and nothing deeper.

**Multi-year scenarios, wired 2026-09-21.** `solve()` gained an optional `scenario.timeline:
{ indexationId? }` field. Presence alone opts in — omitting it reproduces the exact prior
single-period behaviour (verified: a timeline-requested project inside one calendar year produces
identical `moneyKr`/hours to the flat calculation, since it resolves to one unindexed segment).
When present:
- Money↔months now walks year-by-year through `buildSegments`/`monthsFromBudget` — indexation
  compounds correctly across a year boundary instead of being ignored.
- A new `monthsFromRegisteredHoursTimeline` (in `timeline.ts`, mirroring `monthsFromBudget`'s exact
  year-walking inverse — no bisection) covers the hoursRegistered→months direction too.
- `config/norms.ts` gained `scaleNorm()`, extracted from `solve()`'s inline part-time scaling and
  reused inside `buildSegments`, so `employmentFraction` now works correctly across multi-year
  segments (previously `buildSegments` didn't know about part-time at all).
- `TimelineSegment` now carries the full per-year `HoursBreakdown`; a new `aggregateHours()` sums
  segments into one headline figure — summing each year's *floored* registration hours rather than
  flooring the sum, so a single year's segment is never over-credited.
- The result exposes `timeline: TimelineResult | null` and the trace gained a new "Flerårig
  fordeling" section with one row per calendar year (indexed cost + hours to register that year)
  plus a total row.
- Fixed a latent, previously-untested bug in the same pass: `t.bind('months', …)` always pointed at
  the money-derivation step even when months was solved from `hoursRegistered` instead — the
  derivation trace's `resultRefs.months` could point at a step that was never created. Now tracks
  the step that actually produced the final `months` value (including after whole-month snapping).

Not yet wired: the multi-year breakdown doesn't feed into the market-floor check (still uses flat
total months on the productive-hours basis) — a real but smaller gap than the one just closed.

**Verified:** all worked examples from every source document reproduce exactly; canonical profile
deviates ≤0,6 t from the published figures; money→time→money round-trips to 0,5 kr over 200
generated cases; part-time scaling matches hand-calculation exactly (50% beskæftigelsesgrad
exactly halves the Vipomatic hours and the semesternorm used in the residual check).

**Guardrails, tested:** postdoc without an explicit share throws; undervisningsfrikøb without a
stated basis throws; a beskæftigelsesgrad outside (0,1] throws; the takstkatalog now covers all 16
VIP/TAP stillingstyper (the previously-missing 431/451/461/465/466 rows were added from the
primary PDF, not estimated).

### UI — built and verified in-browser

- **`/beregner`** — the calculator. One flat "Udgangspunkt" choice (beløb / måneder /
  Vipomatic-timer — whichever you already know), Frikøbsprocent as an alternate way to enter
  måneder, Beskæftigelsesgrad (percent or weekly hours) under "Avanceret" for part-time staff,
  Nulstil, and Eksportér som PDF (browser print dialog, "Save as PDF" as destination — print CSS
  hides the nav/form/buttons and adds a print-only header with the shareable link for
  provenance). Every scenario syncs to the URL.
- **`/satser`** — every constant the engine uses, with its citation. Server component, no
  interactivity needed.
- **`/om`** — the rounding policy (with the known ≤0,6 t deviation table), the three genuinely
  open domain questions in plain consultant-facing language, and the grouped source list. Does
  **not** contain the internal research-diary content from `docs/open-questions.md` — that stays
  internal, on request.
- Shared nav (`_components/Nav.tsx`) and reference-page building blocks (`_components/
  reference.tsx`) across all three pages.

### AU-branded theme, switchable light/dark — built 2026-09-02

Consultant feedback item 6. Accent colour is AU's official brand blue, `#003d73` — sourced from
AU's own design guidelines (medarbejdere.au.dk/en/administration/communication/guidelines/
guidelinesforcolours), cross-checked against the `unicol` R package's sourced colour table
(github.com/hneth/unicol) rather than taken from memory. The dark-mode accent, `#809eb9`, is
**not** an AU-published colour — it's AU blue mixed 50% with white, computed (not eyeballed) to
clear WCAG AA against the dark background (7,1:1; the raw AU blue only manages 1,8:1 there — AU's
own darker tints go the other direction, toward black, meant for print). Both accent tones and
their button/text pairings were checked against the WCAG contrast formula directly (see the
`--accent`/`--accent-foreground` tokens in `globals.css`) before use, matching the rigor of the
2026-09-01 accessibility pass rather than reopening it.

Applied to interactive/brand touchpoints only — Nav (a 2px accent top bar, the wordmark, active
link, hover states), primary buttons (`/login`'s submit), the kostpris "brug denne" suggestion
link, and focus-visible outlines. Body text, headings, and the dense `/satser`/`/om` reference
tables stay in the existing neutral zinc scale deliberately — brand colour as accent, not as the
dominant text colour.

Theme is switchable via `ThemeToggle.tsx` (sun/moon button in Nav), not just OS-driven anymore:
`data-theme="light"|"dark"` on `<html>`, persisted to `localStorage`, defaulting to system
preference on first visit. Follows Next 16's own documented flash-prevention pattern exactly
(`node_modules/next/dist/docs/01-app/02-guides/preventing-flash-before-hydration.md`) — a
blocking inline script in `layout.tsx`'s `<head>` sets the attribute before first paint, and
`ThemeToggle` always renders assuming 'light' initially (matching SSR exactly) then corrects via
effect immediately after mount, specifically to avoid a genuine hydration-mismatch on the
sun/moon SVG (structurally different children, not just text — `suppressHydrationWarning` alone
doesn't cover that). Verified in-browser: no flash on reload, persists across reloads, both
themes render correctly on `/beregner`, `/satser`, and `/login`.

Several rounds of user feedback already folded in: number inputs no longer respond to
mouse-wheel scroll; kr amounts show da-DK thousands separators while typing; Dato lives in
"Avanceret" (it only matters for scenarios before 2024-01-01) and always displays as
DD-MM-YYYY regardless of browser locale; arbejdsdage (workHours ÷ 7,24 t, confirmed 2026-09-01)
is floored to whole days and lives behind a collapsed "Arbejdsdage" disclosure rather than
always-visible text, per consultant feedback 2026-09-02 that it confused more than it helped;
Stillingskategori's picker now offers only lektor/adjunkt/professor (per the same feedback — in
practice a frikøb is always one of these three) while `CATEGORY_NORMS` and the
`registeredShareOverride` guard stay intact underneath, so an older shared link naming postdoc/
ph.d./DVIP/studieadjunkt still resolves correctly instead of breaking; trace section headers
have visible dividers; every trace row renders uniformly (no special-cased "result" row).

**2026-09-04 — R26, the default variant.** The calculator defaults to the 60%-scaled model, labelled "Frikøb (standard)". That follows practitioner input and the IKK staff page (`cc.medarbejdere.au.dk/…/frikoeb`: "Langt de fleste på instituttet er ansat til at undervise 60% og forske 40%"). Full kostpris remains available as "Fuld kostpris". The `fuldt` variant was
secondary, first labelled "Fuldt frikøb". See `docs/open-questions.md` R26.

**2026-09-22 — R27, radio labels relabeled again per consultant feedback.** A research consultant
flagged that the word "fuldt" in "Fuldt frikøb" read as if that variant, not the 60%-scaled
default, were the norm — a wording problem layered on top of R26's already-correct default, not a
reopening of R26 itself. Relabeled: **"Frikøb (standard)"** (the consultant's literal suggestion
was "Frikøb (60%)"; the user preferred keeping the shipped plain "Frikøb" wording and just adding
the "(standard)" tag — matching the `"...(standard)"` convention already used one level down for
the `undervisningsBasis` sub-choice) and **"Fuld kostpris"** replacing "Fuldt frikøb" (removing
"frikøb" from that option's name entirely, so it no longer reads as a second, competing kind of
frikøb). UI copy only — `FrikoebVariant`'s values and `DEFAULT_FORM.variant` are unchanged. See
`docs/open-questions.md` R27.

**2026-09-22 — R28, same feedback round: the explanatory text itself, not just the labels.** A
consultant asked for clearer wording under each Frikøbstype. Rewritten sourced directly from
`Frikoeb_IKK_notat_2026.pdf`'s own plain-language explanation of the trade-off, rather than
paraphrased from the formula. Each `undervisningsBasis` sub-option in `ScenarioForm.tsx` is now a
short label ("Fonden betaler 60% af lønnen (standard)" / "Fonden betaler fuld løn alligevel") plus
a one-line hint below it, mirroring the label+hint pattern already used elsewhere in the same form
(Stillingskategori, Kostpris) instead of one dense sentence. The "Fuld kostpris" hint paragraph now
states both halves of that deal — what the fund pays *and* what the researcher commits to — per
the notat's own definition, which the old copy only gave one half of. No formulas or defaults
changed. See `docs/open-questions.md` R28.

**2026-09-22 — R29, "who is this tool for?"** A consultant asked whether the calculator is meant
for administrative staff or VIP (academic) staff. Verdict: the audience was never ambiguous in the
project's own understanding, but the one sentence that stated it (`/om`'s subtitle) had drifted to
being the *only* place stating it — it was also on `/login` once, then deliberately dropped per an
earlier, undocumented round of consultant feedback, and never replaced elsewhere. Fixed by adding
the same sentence — "Et internt værktøj for forskningskonsulenter på Faculty of Arts, Aarhus
Universitet." — as a subtitle on `/beregner` itself, the page every user actually lands on, rather
than reviving the removed `/login` copy. See `docs/open-questions.md` R29.

**2026-09-22 — R30, "does everyone know what kostpris includes relative to løn?"** Agreed this was
a real gap, not just a phrasing preference — kostpris/løn confusion silently corrupts every
downstream number, the same risk class as the overhead double-counting `CLAUDE.md` rule 5 already
flags. The answer was already researched (R19 — kostpris includes pension, ferieafregning ved
fratrædelser, seniorbonus, særlig feriegodtgørelse, bidragssats inkl. barselsfond; excludes
engangsudbetalinger and the extra cost of actual barsel/sygdom) but had never been surfaced
anywhere a consultant would see it while entering the number. Added a short hint directly under the
Kostpris input on `/beregner`, and expanded `/satser`'s "Kostpris — formelparametre" intro with the
full include/exclude list next to the formula. See `docs/open-questions.md` R30.

**2026-09-22 — R31, resolves open question 9 (whole hours vs. decimals into Vipomatic).**
Feedback described Vipomatic's actual behavior: it rounds figures it computes internally, but
stores a manually-typed entry exactly as typed, unrounded. Since this calculator's whole point on
the hours side is telling a consultant what to type into Vipomatic, this means the engine's
existing `hoursToRegisterWhole` (floored, already the headline figure in `ResultSummary.tsx`) isn't
just an institute-favoring convention — it's load-bearing: handing over the decimal instead would
have Vipomatic register that exact fraction, with no downstream rounding to catch it. No engine
change needed. Strengthened the trace note on the Vipomatic-hours rounding step in `solve.ts` to
state the actual reason, not just the outcome; removed question 9 from `docs/open-questions.md`
(resolved as R31) and closed the matching "Open question" in `docs/rounding-policy.md`.

**2026-09-22 — R32, "the whole Vipomatic-registrering section feels overwhelming."** Agreed, and
restructured rather than just reworded: cut the trace's "Vipomatic-registrering" section from 5
steps to 3 for what is really a 3-number story (total time → registered teaching hours vs.
unregistered research hours). Folded the standalone arbejdsdage step into a one-line note on
"Samlet arbejdstid i frikøbet" (it was already out of place — its own note said it's not a number
Vipomatic registers, yet it sat in a section titled exactly that); merged the unrounded-then-floored
hours pair into one step showing the formula, substitution and floor together instead of two
near-identical rows. `vipomatic.timer.hele` no longer exists as a step id — its content lives in
`vipomatic.timer` now, which both `hours.hoursToRegister` and `hours.hoursToRegisterWhole` bind to.
Zero facts dropped, both test-guarded phrases survive in the merged note. See
`docs/open-questions.md` R32.

**2026-09-22 — R33, a UX analysis pass plus a follow-up: too much is exposed to the primary
consultant audience, not just the secondary VIP-via-PDF one R32 addressed.** A read-only UX
analysis (three parallel codebase surveys + external research into GOV.UK's design system, the IRS
Tax Withholding Estimator redesign, and progressive-disclosure literature) confirmed the dense
single-page form and the always-visible trace are the *right* calls for an internal expert-user
tool — GOV.UK's own research favors exactly this over a multi-step wizard for repeat internal
users — but flagged `TracePanel` as the one place that never got the disclosure treatment already
applied to Avanceret/Pris og omkostningsstak/Arbejdsdage, repeating on every single calculation what
`ResultSummary` already shows, in much denser form. Fixed: `TracePanel` is now a `<details>`,
closed by default, summary "Beregningsspor". The PDF export needed care — it's the actual citable
artifact, so it must never silently print collapsed — handled with a `beforeprint`/`afterprint`
listener on the `<details>` ref that force-opens it for the duration of printing and restores
whatever state the user had, verified directly against both starting states. See
`docs/open-questions.md` R33.

**2026-09-22 — R34, a detailed line-by-line trim of `/beregner`, `/satser` and `/om`, plus removing
the PI-credit card.** Removed `PiCreditCard.tsx` and its usage from `/beregner` entirely (confirmed
first, since it's a feature deletion, not a text trim) — `piCredit.ts`'s engine and tests are
untouched, so it's one file away from coming back. Everything else was copy/structure: shortened
the Kostpris hints and dropped the redundant "Vælg det, du allerede kender" line on `/beregner`;
trimmed three `solve.ts` trace notes down to only what wasn't already shown elsewhere in the same
view; removed negative-framing phrasing ("ikke X, ikke Y", "mest sandsynlige fejlkilde") on
`/satser`; added a `collapsible` option to the shared `Section` component
(`_components/reference.tsx`) and applied it to all 8 `/satser` sections and 2 of `/om`'s, so both
now read as a scannable title + one-line intro with a "Vis tabel" disclosure rather than a long
dump — zero information deleted, same principle as R33; trimmed `/satser`'s Stillingskategorier and
Takstkatalog tables to the three categories the calculator actually offers, matching
`ScenarioForm.tsx`'s existing `CALCULATOR_CATEGORIES` narrowing (the underlying config stays
complete for older shared links); trimmed the Kostpris feriefaktor/bidrag history table to the 3
most recent years with a source-document citation for older ones instead of showing 2015 data;
reformatted the crammed inline P/L-regulering year breakdown to point at its own note. Verified
in-browser: every collapsed section's content still renders correctly expanded, calculator numbers
unchanged. See `docs/open-questions.md` R34.

**2026-09-23 — R35, a second, more detailed copy pass plus two structural decisions.** Removed the
"Fonden betaler fuld løn" radio from `/beregner` entirely (confirmed first) — only the 60%
salary-scaled option shows now for `variant: 'undervisning'`, since it's the only real choice left;
`full_month_equivalent` stays fully supported by the engine and still resolves correctly from an
old shared link's `ub=full_month_equivalent` param, it just can't be freshly selected from the
form. Removed the entire "Reguleringspolitikker" section from `/satser`, reasoned through rather
than guessed: `timeline.ts` is wired into `solve()` but `/beregner` has no multi-year UI toggle at
all yet, so the section documented config for a capability today's consultant can't reach — flagged
to bring back once multi-year gets a UI. Everything else was copy: more negative-framing and filler
trims, "IDV" expanded to "indtægtsdækket virksomhed" everywhere it appeared bare, "provisorisk" →
"(foreløbig, ikke bekræftet)", "konstant" → "tal", the Kommerciel/Samfinansieret rate-table
citations cleaned up (one rewritten as prose, one dropped as redundant with its own note), the
Arts Økonomi contact linked, and `/om`'s Decimaler/Metode table nested behind its own "detaljer"
toggle rather than removed. **New infrastructure**: copied the 18 primary-source documents from
`rules/` (4.7MB, 17 PDF + 1 xlsm) into `public/kilder/`; the shared `Cite` component now links every
citation's title to the actual downloadable file, except the two `DocumentRef`s whose `file` points
at our own internal `NOTES-*.md` write-up (real source is a web page, nothing to download) — those
correctly stay plain text. Verified in-browser end-to-end: a PDF link returns 200 for a logged-in
session (gated behind the same auth as everything else, by design), the URL-reachable
`full_month_equivalent` path produces numbers identical to Fuld kostpris, every restructured
section still renders its full content when expanded. See `docs/open-questions.md` R35.

**2026-09-04 — trimmed per direct user request.** Four pieces of explanatory/citation copy were
deleted outright, not reworded: the `UNDERVISNINGSFRIKOEB_REQUIRES_APPROVAL` warning (code, push,
and its test) is gone entirely; the ScenarioForm paragraph explaining the undervisningsfrikøb
model is gone (the two `undervisningsBasis` radio options remain, just without prose above them);
the "Bekræftet af forskningskonsulent … AUFF-regneeksempel … afviger X%" sentence was cut from the
`assumption.uf.basis` trace note (the core formula sentence stays); the "Et semester er 6
måneder …" multi-year caveat was cut from the `kontrol.restforpligtelse` note (same short note now
used regardless of `months`). Note: the underlying institut-/afdelingsleder approval requirement
is still real per the notat's procedure section — only the in-app warning text was removed, not
the actual policy.

### Auth — rebuilt 2026-09-03, per-person login via Postgres + Prisma

Consultant feedback item 5 ("smid authentication på"). After trying an email magic link and a
shared passcode, it landed on per-person accounts: password auth, a small Postgres DB, no email
dependency.

- **Database:** Neon Postgres, provisioned via the Vercel marketplace integration (`vercel install
  neon`) and connected to the `aucalculator` project — `DATABASE_URL` (pooled) and
  `DATABASE_URL_UNPOOLED` (direct, used for migrations) are set for Production/Preview/Development
  automatically. One `User` model (`prisma/schema.prisma`): id, username, name, passwordHash.
- **ORM:** Prisma 7 — driver-adapter workflow (`@prisma/adapter-pg` + `pg`), client generated to
  `src/generated/prisma` (gitignored, regenerated by `npm run build`'s `prisma generate` step and
  by `postinstall`). Singleton client in `src/lib/prisma.ts`, cached on `globalThis` so Next dev's
  hot-reload doesn't exhaust Neon's connection pool.
- **Mechanism:** username + password (`bcryptjs`, cost 12) checked against the `User` table in
  `src/app/login/actions.ts`. On success, the session cookie carries a **signed** `{userId, name}`
  payload (HMAC over base64url JSON, keyed by `AUTH_SECRET` — `src/lib/access.ts`,
  `parseAccessToken`/`issueAccessToken`) — deliberately kept self-contained (no DB read) so
  `proxy.ts` can gate every request without a database round trip. Nav shows the logged-in user's
  name next to "Log ud".
- **Self-serve signup** at `/signup` (`src/app/signup/page.tsx`, `signup()` in
  `src/app/login/actions.ts`) — name, username, password (min. 8 chars), no email verification,
  logs the new account straight in. Duplicate usernames are caught via Prisma's `P2002` unique
  violation and shown as a friendly error, not a 500. There's still no admin-approval step; see
  `docs/todo-privatliv.md` #1. `scripts/create-user.ts` still works too, for out-of-band resets.
- **Usernames are case-insensitive** — lowercased on both signup and login lookup (and, since
  2026-09-03's QA pass, in `scripts/create-user.ts` too — it has to match, or an admin-created
  mixed-case account could never log in via the form). Passwords stay case-sensitive.
- **`/konto`** (`src/app/konto/page.tsx`) — change your password (current password required) or
  delete your account entirely (current password + a confirmation checkbox required;
  `deleteAccount()` in `login/actions.ts`). Nav's username is a link there.
- **Gate scope:** the whole site via `src/proxy.ts`; `/login`, `/signup`, `/privatliv`, and static
  assets excluded from the matcher (the first two to avoid looping the sign-in flow against its
  own gate, the third so the privacy notice is readable before signing in). `/konto` is gated
  normally.
- **Login page:** dropped the "Internt værktøj for forskningskonsulenter…" copy per consultant
  feedback — just the form, plus a link to `/signup`. Both auth forms set `noValidate` and the app
  resets `:invalid` box-shadow/outline globally (`globals.css`) — Firefox draws a red glow around
  empty `required` fields by default, independent of `noValidate`. Both pages have their own
  `ThemeToggle` (not forced to any one theme — an earlier attempt at forcing light was reverted the
  same day because it made `/login` inconsistent with every other unauthenticated page reading the
  same stored preference, e.g. `/privatliv`).
- **Nav** only renders when there's a valid session (so `/login`/`/signup`, and `/privatliv` if
  visited pre-login, render without the top bar), and no longer has a redundant "Frikøbsberegner"
  wordmark next to the "Beregner" link — one was dropped.
- **Footer + `/privatliv`**, a footer
  (`_components/Footer.tsx`) on every page linking to `/privatliv` and `mailto:cg@cc.au.dk`, and an
  honest technical description of what's collected (username/name/password-hash, a signed-not-
  encrypted session cookie) and why. **Explicitly not a lawyer-reviewed privacy policy** — see
  `docs/todo-privatliv.md` for what's still open (no verification on signup, no retention policy,
  no confirmed AU data-processing agreement). The database-region concern that used to be here is
  resolved — see "Deployed" below.
- **Final pre-handoff QA pass, 2026-09-03:** a dedicated security review (of `access.ts`,
  `proxy.ts`, `login/actions.ts`, the Prisma schema, `create-user.ts`) surfaced and fixed two real
  issues before this went to a real consultant:
  1. **Open redirect in `login()`'s `callbackUrl`** — `startsWith('/')` alone doesn't exclude
     `//evil.example.com`, which browsers treat as protocol-relative (i.e. absolute). A crafted
     link could send a consultant to an attacker page immediately after a normal-looking login.
     Fixed by also rejecting `//` and `/\` prefixes.
  2. **`scripts/create-user.ts` didn't lowercase the username** — since login always lowercases
     before lookup, an admin-created account with any uppercase character could never actually log
     in. Fixed to match.

  Everything else checked out: `bcrypt.compare` (constant-time) used everywhere passwords are
  checked; the session cookie's HMAC is verified with `timingSafeEqual`; `changePassword` and
  `deleteAccount` only ever touch the session's own `userId`, never another account; no secrets in
  any committed file; Prisma errors don't leak stack/SQL to the client. A parallel tech-debt audit
  found no dead code or unused dependencies and confirmed the one Prisma migration exactly matches
  the current schema — its only findings were the doc staleness this update fixes.
- **Verified end-to-end in-browser against the live production site** (not just locally):
  unauthenticated request → 307 to `/login`; wrong username/password → error shown, original
  destination preserved; correct credentials, including mismatched case in the username → signed
  cookie set, lands on original destination, nav shows the user's name; "Log ud" → cookie cleared,
  nav disappears, gate re-engages; signup with a taken username → friendly error, no account
  created; signup with a new (mixed-case) username → account created, logged in immediately; wrong
  password on `/konto`'s delete form → rejected, account intact; correct password + confirmation
  checkbox → account actually deleted, cookie cleared, redirected to `/login`.

---

## Next — in order

1. ~~Wire `timeline.ts` into `solve()` for multi-year scenarios.~~ **Done, 2026-09-21** — see
   "Logic layer" above. Note the residual-obligation check is still, correctly, a single-semester
   figure — that's inherent to what it means ("what's owed *this semester*"), not a gap the
   timeline wiring was meant to close.
2. ~~Pricing/cost-stack UI.~~ **Done, 2026-09-21.** A new collapsed "Pris og omkostningsstak"
   `<details>` block in `ScenarioForm.tsx` (parallel to "Avanceret", closed by default — a plain
   frikøb calculation still needs none of this). A "Vis fuld prisberegning" checkbox gates a
   Finansieringsmekanisme select (tilskudsfinansieret / rekvireret IDV / samfinansieret) that
   preselects sensible overhead/margin/moms/market-floor-table defaults per mechanism
   (`MECHANISM_DEFAULTS` in `ScenarioForm.tsx` — a UI convenience, not an engine constraint; any
   combination can still be overridden), plus selects for overhead (`OVERHEAD_POLICIES`), margin
   (`MARGIN_POLICIES`), a moms checkbox, a driftsomkostninger kr field, and a market-floor rate
   table (`RATE_TABLES`). All fields round-trip through the shareable URL (new query keys:
   `pe`/`mech`/`oh`/`mg`/`moms`/`op`/`mft` in `scenario.ts`). A new `PriceSummary.tsx` renders a
   compact headline breakdown (direct salary → overhead → margin → moms → total) when
   `result.price` is present; `TracePanel` and `WarningList` needed **no changes** — both are
   already fully generic over trace sections/warnings, so the existing 'oekonomi' trace steps and
   `BELOW_MARKET_FLOOR`/`RATE_TABLE_STALE`/etc. warnings solve() already produced simply started
   rendering once the form could populate `scenario.pricing`. Verified in-browser end-to-end
   (logged in, switched to IDV, checked the rendered numbers against the engine's own test
   expectations: 105% overhead, 10% margin, 25% moms, correct market-floor block warning; toggling
   pricing off cleanly clears the URL params and the cost-stack trace rows).
3. ~~Princip 6 — PI teaching-credit for postdoc grants.~~ **Done, 2026-09-21.** New module
   `src/lib/frikoeb/piCredit.ts`, `computePiCredit()` — a **distinct, separate calculation from
   `solve()`**, per the explicit decision in `rules/NOTES-frikoebspolitik.md` action item 6: it
   reduces the *grant-winning senior researcher's own* institutarbejdsforpligtelse, not the
   postdoc's, so it is never wired into a frikøb `Scenario` at all. Implements Princip 6 exactly:
   `PI_CREDIT_RATE = 0.10` of the semester teaching norm, floored, per postdoc position secured —
   the rate is the cited rule (not the "49 timer" figure, which is that rate applied to the
   2023-2025 493 t norm and floored; the function derives it from whichever semester norm is in
   force at `asOf`, and still floors to 49 under the 2024+ 495 t norm, matching the source
   document exactly either way). Takes `postdocCount` (a non-negative integer) and the PI's own
   `employmentFraction`, reusing `scaleNorm()` from the timeline work above. Ships its own
   `TraceBuilder`-based derivation citing `Frikoeb_IKK_politik.pdf`, Princip 6, and a note stating
   the rule's actual preconditions in the trace itself (only applies when the postdoc is
   themselves obligated to 20% undervisning; an externally-financed ph.d. does **not** trigger
   it) — both cited in the source, neither invented. 12 new tests in
   `__tests__/piCredit.test.ts`. UI: a new standalone, collapsed-by-default `PiCreditCard.tsx` at
   the bottom of `/beregner` — deliberately **not** synced to the main `FormState`/URL, since the
   PI computing this credit may not be the same person the main calculator is currently pricing a
   frikøb for. Verified in-browser: postdoc count × 49 t/semester updates live, cites Princip 6.
   **The UI card was removed again 2026-09-22 (R34)** as unnecessary on `/beregner` — the engine
   (`piCredit.ts`) and its tests are untouched, so only the entry point is gone.
4. ~~Put it in front of an actual consultant.~~ **Done — consultant feedback is now coming in.**
   Six rounds landed and were incorporated 2026-09-22 (R27–R32 in `docs/open-questions.md`):
   relabeling the Frikøbstype radios ("Frikøb (standard)" / "Fuld kostpris", R27), clearer
   explanatory text under them sourced from the IKK notat (R28), stating the tool's audience on
   `/beregner` itself (R29), explaining what kostpris includes relative to løn (R30), confirming
   Vipomatic doesn't round manually-typed entries — resolving open question 9 (R31), and cutting
   the "Vipomatic-registrering" trace section from 5 steps to 3 for readability (R32). This is
   exactly the usage signal internal review couldn't produce — expect more rounds; keep watching
   `docs/open-questions.md` for the running log.
5. **Deployed, 2026-09-03**, on Vercel. Neon Postgres runs in
   `eu-central-1` (Frankfurt) — moved there the same day, from an initial `us-east-1` provision;
   see `docs/todo-privatliv.md` under "Resolved".
6. **`docs/todo-privatliv.md`.** Before this goes in front of anyone outside the immediate team:
   decide whether self-serve signup needs an approval/invite gate, and get `/privatliv` and the
   overall setup an actual legal read.

## Accessibility — audited 2026-09-01

WCAG 2.1 A/AA audit across all three pages: automated (axe-core 4.9, both `prefers-color-scheme`
modes) plus manual review and keyboard testing. **Zero automated violations remaining** — fixed:

- **Color contrast (serious):** `Cite`'s citation text and the trace panel's "Kilde:" line used a
  reversed light/dark class order (`text-zinc-400 dark:text-zinc-500`) that failed 4.5:1 in *both*
  modes (2.6:1 light, 4.1:1 dark). Swapped to the app's own already-correct convention
  (`text-zinc-500 dark:text-zinc-400`, 4.8:1 / 7.6:1).
- **Keyboard access to scrollable tables (serious):** the horizontal-scroll wrappers around every
  table in `/satser` and `/om` had no way to scroll via keyboard. Added `role="region"
  tabIndex={0} aria-label`.
- **Focus indicator removed:** `inputCls` had `focus:outline-none` with only a subtle border-color
  change — insufficient per 2.4.7. Replaced with a real `focus-visible` outline.
- **Nested radio groups without a fieldset/legend** (undervisningsBasis, monthsEntryMode,
  beskaeftigelsesgradEntryMode) — each now has its own `<fieldset>`/`<legend>` (visually hidden
  where a caption already exists) so assistive tech can identify them as a set (1.3.1, 4.1.2).
  The two outer, already-correct fieldsets (Frikøbstype, Udgangspunkt) were untouched.
  - **No landmark structure or bypass mechanism (2.4.1).** Added a skip link and wrapped page
  content in `<main>` in `layout.tsx`.
- **Dynamic content not announced (4.1.3):** the error box now has `role="alert"`; the warnings
  list and the headline result number are `aria-live="polite"`.
- **Missing visual affordance:** the "Avanceret" `<details>` had no indicator that it was
  expandable beyond a hover cursor. Added a chevron that rotates on open.
- **Table headers:** added `scope="col"` to every `<th>` in `/satser` and `/om`.
- **Nav:** active link now gets `aria-current="page"` and distinct styling; nav has `aria-label`.

**Not covered by this pass** — flagged honestly, not verified: no test with a real screen reader
(VoiceOver/NVDA), no explicit 400%-zoom/320px-reflow check (1.4.10), no text-spacing override test
(1.4.12). The automated+manual pass is thorough but isn't a substitute for real AT usage before a
public-sector launch.

---

## Deliberately deferred

- **Per-user saved scenarios.** Accounts now exist (see "Auth" above), but nothing is stored per
  user yet — a scenario is still just a shareable URL. Revisit only if someone actually wants
  saved/recalled scenarios.
- **Ph.d. and DVIP models.** Both have their own hour regimes that don't fit the monthly norm.
- **Running timesaldo.** Aftale §6 gives the tolerances if it's ever wanted.
- **Deployment.** Live on Vercel, Neon Postgres
  in `eu-central-1` + `AUTH_SECRET` set for Production/Preview/Development (see "Auth" above). The
  accessibility pass (above) is done; before wider rollout, still confirm Vercel is acceptable to
  AU IT, and ideally get real screen-reader testing done (not just automated + manual review). See
  `docs/open-questions.md` #13.

---

## Open risks

1. **The ground truth moves.** The arbejdstidsaftale is extended only to end-2026 and under
   revision. Hence date-versioned config everywhere.
2. **One unresolved source conflict** (overhead rate 105/113/116%), low-stakes per the most recent
   source (confirmed IDV-only, rare, no bearing on hour registration) — see `CLAUDE.md` under
   "Known conflicts" and `docs/open-questions.md`. The other two items sent to consultants — the
   undervisningsfrikøb coefficient and the DPU question — were resolved 2026-08-31 and
   2026-09-01 respectively.

## Handy commands

```bash
npm test                 # 169 tests
npm run lint && npm run typecheck
npx tsx --eval "import {solve} from './src/lib/frikoeb/solve';import {traceToMarkdown} from './src/lib/frikoeb/trace';console.log(traceToMarkdown(solve({asOf:'2026-01-01',category:'lektor',variant:'fuldt',monthlyCostKr:70000,solveFor:'months',given:{moneyKr:210000}}).trace))"

# Auth setup (see .env.example):
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"  # AUTH_SECRET
npx tsx scripts/create-user.ts <username> <name> <password>                  # add an account
```
