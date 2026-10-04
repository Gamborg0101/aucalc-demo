# CLAUDE.md — ARTS Frikøb Calculator (`aucalc`)

## 👉 Pick up here

**Research phase is complete.** Every domain question is answered from primary sources. No
blocking unknowns remain. See `docs/open-questions.md` for the three items sent to the
consultants for confirmation (none block building) and `docs/STATUS.md` for exactly where to
resume.

**Built and passing (169 tests):** the pure calculation core — units, rounding profiles, the
date-versioned config, the derivation trace, the bidirectional solver, the full cost stack,
multi-year timelines (wired into `solve()` 2026-09-21), and part-time (`employmentFraction`)
support. All worked examples from every source document reproduce exactly. The UI (`/beregner`,
`/satser`, `/om`) is built and verified in-browser.

**Auth is per-person login (Postgres + Prisma via Neon on Vercel, `eu-central-1`), with self-serve
signup at `/signup` and a `/konto` page for changing your password or deleting your account** — no
email/Resend dependency. See `docs/STATUS.md` under "Auth" for the full shape, and
`docs/todo-privatliv.md` for the open privacy/legal questions before wider rollout (signup has no
verification; no formal retention policy).

**Deployed on Vercel.** Deployed and QA'd end-to-end 2026-09-03, including a
dedicated security pass — see `docs/STATUS.md` for the findings and what got fixed.

**2026-09-21 — the three remaining engine/UI gaps are closed:** multi-year `timeline.ts` is wired
into `solve()`, the pricing/cost-stack UI is built into `/beregner`, and Princip 6 (PI
teaching-credit for postdoc grants) is implemented as its own standalone calculation + card.
Details in `docs/STATUS.md`.

**Consultant feedback is now coming in.** Six rounds landed and were incorporated 2026-09-22
(R27–R32 in `docs/open-questions.md`) — label wording, explanatory text, audience framing, the
kostpris/løn distinction, a Vipomatic rounding confirmation, and a trace-density cleanup. Expect
more; see `docs/open-questions.md` for the running log and `docs/STATUS.md` under "Next" for the
remaining, not-yet-consultant-driven items (deployment/privacy follow-ups mainly).

---

## What this is

An internal web calculator for **research consultants (forskningskonsulenter) at Aarhus
University, Faculty of ARTS**.

They budget **frikøb** — buying out a researcher's time so it can go to an externally funded
project instead of teaching. The arithmetic is confusing because it runs in **both directions** and
mixes kroner, months and hours across **three incompatible hour bases**.

The product is not the number. **The product is the derivation** — a cited, step-by-step breakdown
a consultant can paste into a project budget and defend to a funder.

---

## Domain glossary (Danish → meaning)

| Term | Meaning |
|---|---|
| **frikøb** | Buy-out. External funds pay for a researcher's time. |
| **fuldt frikøb** | Full buy-out. Institute compensated the full cost; researcher commits **all** work time (teaching + research) to the project. |
| **frikøbsprocent** | The share of a person's full time bought. Partial frikøb is a *lower percentage at full cost*, not a cheaper month. |
| **undervisningsfrikøb** | Funder buys only the teaching obligation; institute compensated 60% of salary. The calculator's default ("Frikøb (standard)"), per practitioner input. See `docs/open-questions.md` R26. |
| **kostpris** | ⚠️ Formally an **HOURLY** rate: `(månedsløn / 160,33) × feriefaktor + bidrag`. Individual per employee, lives in Navision. AU also publishes it converted to a monthly figure. |
| **månedsløn** | Monthly salary. An *input* to the kostpris formula, not the same thing. |
| **medfinansiering** | AU's contribution. Narrow sense (frikøb notes): the researcher's own research time in kind. Broad sense (FSE): also salary, equipment, premises, software. |
| **ydelsesforpligtelse** | = institutarbejdsforpligtelse = the obligation frikøb reduces. Used interchangeably with undervisningsforpligtelse. |
| **VIP / DVIP / TAP / DTAP** | Academic staff / part-time academic / technical-admin / part-time TA. |
| **Vipomatic** | AU's hours-accounting system. **Registers teaching + administration only** — never research. |
| **myndighedsbetjening** | Authority/government service work — a *different* obligation category from frikøb-for-research, out of this calculator's scope. Registered **1:1** in Vipomatic (no 60/40 split) when it's a "strategisk ydelse", not a "kerneydelse". Don't confuse hours registered 1:1 with a bug in the frikøb model. |
| **timeregnskab** | The hours account. Carries balances across semesters (≤986 t rebalance in 2 yrs, >986 t in 4 yrs). |
| **årsnorm** | Annual work-hours norm, excluding holiday. |
| **tilskudsfinansieret forskning** | Grant-funded (DFF, Carlsberg, ERC…). Overhead set by the **funder**. |
| **rekvireret forskning / IDV** | Contract research; a company pays AU. Market floor, VAT, AU-set overhead. |
| **samfinansieret forskning** | Co-financed collaboration. Rates negotiable, quoted **inclusive of overhead**. |
| **overhead** | Indirect costs. Rate *and base* differ by mechanism — see rule 5. |
| **overskudsgrad / EBIT-margin** | Profit margin required on IDV. ≥10%, or 0% under monopoly. |
| **afdelingsleder / institutleder** | Approve placement / approve all budgets. |
| **P/L-regulering** | Wage indexation. **2%/år** for budgeting; actual rates differ. |

---

## Rules that must never be violated

### 1. Vipomatic registers teaching + admin only
Research time is **never** registered. The single most important rule in the domain.

### 2. The teaching share is per category — never hardcode 0,6

Authoritative table, Arbejdstidsaftale Bilag B 13.1–13.2:

| Stillingskategori | Registered | Not registered |
|---|---|---|
| Adjunkt (tidsbegr. & TT) · Lektor · Professor | **60% – 493 t/sem** | 40% – 329 t |
| Studieadjunkt/-lektor · vid.ass. m. underv.pligt | **80% – 657 t/sem** | 20% – 165 t |
| Ph.d.-studerende | 840 t **total** over the programme | — |
| **Postdoc** | ⚠️ **No fixed norm** — individually agreed with institutleder | — |
| DVIP | Per ministerial circular | — |

Adjunkt drops 60% → **50%** beyond three years (§6.1) — that is why 411 t/sem appears.

> ⚠️ **A previous session got this wrong.** It recorded "postdoc ≈ 20% teaching" from a web table.
> The 165 t belongs to studieadjunkt/-lektor and is their *non-registered* share. Postdocs have no
> norm at all. The engine now throws rather than defaulting. Do not re-introduce a postdoc default.

### 3. Constants are versioned by DATE, not by institute

| | pre-2024 | 2024+ |
|---|---|---|
| Annual | 1643 | 1650 |
| Per semester | **822** | 825 |
| Per month | 136,9 | 137,5 |

Arbejdstidsaftale §5 forbids local deviation, so institutes cannot differ. The apparent IKS/IKK
difference is a vintage difference. Note **822**, not 821,5 — AU publishes the rounded figure.

### 4. Three annual-hour bases. They are not interchangeable.

| Basis | Purpose | Holiday |
|---|---|---|
| **1924** | Payroll. The kostpris denominator (160,33/md). | included |
| **1650** | ARTS workload norm → **Vipomatic registration** | excluded |
| **1485** (ARTS) | Productive hours → **what you bill a funder**. TECH 1460, others 1580, DR2 ≤1580. | excluded |

Mixing them is not a rounding error. A kr/hour figure is meaningless without naming its divisor.

### 5. Overhead differs in **rate and base** between mechanisms

| | Rate | Applied to |
|---|---|---|
| **IDV / DR2** | **105%** (2026–27; 110% 2023–25) | **direct salary only** — 0% on drift |
| **Tilskudsfinansieret** | **44%** statslige; varies; often 0 private | **all direct costs** |

So `directSalary` and `directOperating` must stay separate. IDV also carries **≥10% margin on all
costs** (0% under monopoly), and the prescribed rate + priskalkulationsskema are **mandatory**.

Some quoted rates already include overhead — applying it again is the likeliest real-world error
this tool could cause. Make it structurally visible.

### 6. Never invent a number

Unknown constants stay `null` and surface as "mangler data". **Do not use the 2022 notat's
"lektor ≈ 50.000 kr/md"** — the real 2026 figure is **~70.000**, about 40% higher. Use
`Kostpris_takstkatalog_2026.pdf`.

### 7. Rounding always favours the institute
Every rounding in every source document truncates: 986×4/12 → 328 (not 329), 136,9×0,4 → 54,7
(not 54,8), 493/2 → 246 (not 247). Never register more hours than the buy-out funded.

### 8. Every number carries its derivation
The core emits the trace. The UI **renders** it and never does arithmetic of its own.

---

## Key formulas

```
A = annualWorkHours   s = registeredShare   C = monthly kostpris   F = gross-up

workHours(m)     = m × A / 12
teachingHours(m) = workHours(m) × s          ← the only part Vipomatic registers
direct(m)        = m × C
m ← money        = beløb / C
m ← hours        = hReg × 12 / (A × s)
m ← percentage   = frikøbsprocent × varighed    ← validated by IKK policy eksempel c

Kostpris = (månedsløn / 160,33) × feriefaktor + bidrag
2026: feriefaktor 1,03 · bidrag 5,18 kr/t
```

## Formatting

Danish: `1.234,56 kr`, `Intl` with `da-DK`. Hours 1 dp, Vipomatic integers 0 dp (floored), money
whole kroner. UI Danish by default with an English toggle; **domain terms stay Danish** in both.

---

## Architecture

```
src/lib/frikoeb/     PURE. No react/next/fs (ESLint-enforced). Canonical unit: FTE-months.
  types.ts           branded types, mechanisms, UndervisningsBasis
  rounding.ts        canonical + three legacy profiles reproducing the PDFs byte-for-byte
  convert.ts         traced arithmetic primitives
  trace.ts           TraceBuilder — built BEFORE the arithmetic, deliberately
  solve.ts           solve() — the bidirectional funnel
  config/norms.ts    date-versioned årsnorm, per-category norms, productive-hour bases
  __tests__/         golden fixtures + solver behaviour + properties
src/app/             /beregner, /satser, /om   (not built yet)
```

## Commands

```bash
npm run dev · npm test · npm run lint · npm run typecheck · npm run build
```

---

## Source documents — `rules/`

Topic-prefixed. Every config constant cites one via `DocumentRef`.

- `Arbejdstid_*` — the ARTS arbejdstidsaftale (**outranks institute notes**), ph.d. work rules
- `Frikoeb_*` — IKS notat + FAQ (2022), IKK notat (2026), **IKK politik** (the frikøb policy)
- `Kostpris_*` — procesdokument, historiske formler, takstkatalog 2024/25/**26**, hvad koster en
- `IDV_*` — overheadsats 2026/27, vejledning, miniguide, priskalkulationsskema, AU Cetera prisliste
- `Loen_*` — Arts lønaftale 2025
- `NOTES-*.md` — analysis per topic. **Verified facts are kept separate from unverified ones.**

**`public/kilder/` mirrors the downloadable ones** (PDFs + the one `.xlsm`, not the `NOTES-*.md`
analysis files) so `Cite` (`_components/reference.tsx`) can link a citation's title straight to the
source document — gated behind the same login as the rest of the site. Adding a new PDF to `rules/`
and citing it via `DocumentRef.file` needs a matching copy in `public/kilder/`, or the link 404s.

**In this public repo the PDFs/xlsm themselves are not committed** (AU material, some staff-only,
some naming staff) — `rules/*.pdf`, `rules/*.xlsm` and `public/kilder/*` are git-ignored. See README.

`docs/` — `STATUS.md` (resume here) · `open-questions.md` · `rounding-policy.md`

## Known conflicts to be aware of

- **Three overhead figures appear in AU material.** The IKK policy gives 113%, a central-AU miniguide
  gives 116%, and AU Økonomi's dated annual notat gives 105% (2026–27). The engine uses AU Økonomi's
  dated, mandatory rate. Overhead only applies to indtægtsdækket virksomhed (rare) and has no
  bearing on hour registration, so the impact is small.
- **Resolved 2026-08-31 — undervisningsfrikøb pricing.** A consultant confirmed with a worked AUFF
  example that a teaching-only buy-out costs `kostpris × andel` per month (`salary_scaled`), not a
  full salary month (`full_month_equivalent`) — the institute self-funds the remaining research
  share, so the same beløb buys *more* months than a normal frikøb, not the same. Default flipped
  accordingly. See `rules/NOTES-frikoebspolitik.md`.
- **2026-09-04 (R26) — the default variant.** The calculator defaults to the 60%-scaled model, labelled "Frikøb (standard)". That follows practitioner input and the IKK staff page (`cc.medarbejdere.au.dk/…/frikoeb`: "Langt de fleste på instituttet er ansat til at undervise 60% og forske 40%"). Full kostpris remains available as "Fuld kostpris".
  See `docs/open-questions.md` R26.
- **Relabeled again 2026-09-22 (R27), per consultant feedback — the word "fuldt" itself was
  confusing, not the underlying default.** A consultant asked to drop "fuldt frikøb" and mark the
  60%-variant as "standard" instead. Shipped as **"Frikøb (standard)"** and **"Fuld kostpris"**
  (not "Frikøb (60%)" — the user preferred keeping the plain "Frikøb" label and only adding the
  "(standard)" tag, matching the existing `"...(standard)"` convention already used one level down
  for `undervisningsBasis`). `DEFAULT_FORM.variant` and the underlying `FrikoebVariant` type/values
  (`'undervisning'` / `'fuldt'`) are unchanged — this is UI copy only. See `docs/open-questions.md`
  R27.
- **Resolved in substance 2026-09-01 — DPU's practice.** Practitioner input describes DPU's own
  model directly: a 60/40 split
  identical to the engine's existing `registeredShare`. DPU is not a deviation case; the physical
  frikøbsnotat is still nice-to-have for citation but no longer blocks anything.
- **Confirmed 2026-09-01 — a full Vipomatic work day is 7,24 timer.** Used to express a frikøb's
  total arbejdstid as arbejdsdage (`HoursBreakdown.workDays`), never as an input to any
  money/hours/months conversion. Applies to the current (2024+) årsnorm only.
- **Not actually a conflict, corrected 2026-08-31:** the IKK policy's "postdocs owe 20% teaching"
  never sets a postdoc's *own* teaching share — it's background inside a different rule (Princip 6)
  that credits a senior researcher's *own* obligation for postdoc grants they've secured. The
  arbejdstidsaftale's "individually agreed, no fixed norm" for the postdoc's own frikøb was never
  really contradicted. Engine still correctly refuses to default a postdoc's own share; the PI
  credit mechanism itself is simply unbuilt. See `rules/NOTES-frikoebspolitik.md`.
- **The 2019 timetakster** are almost certainly stale — AU Cetera's 2026 rates are 4–17% higher.
  Shipped flagged `provisional`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
