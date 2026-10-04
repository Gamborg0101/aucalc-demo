# Research notes — AU public sources

**Retrieved:** 2026-08-30
**Method:** Web search + fetch of public AU pages.

> ## ⚠️ Read this first
>
> Everything in **Part B** was gathered from AU web pages, **not** from the primary PDFs in this
> folder. Search-result summaries and page extracts can compress or paraphrase. Treat Part B as
> *leads to verify*, not as authority.
>
> **No constant from Part B may be committed to `src/lib/frikoeb/config/` without first being
> confirmed against a primary document or by a research consultant.**

---

## Part A — Verified against the primary PDFs in this folder

These are read directly from the source documents and are safe to rely on.

### Årsnorm

| | IKS notat (2022-08-30) | IKK notat (2026-06-23) |
|---|---|---|
| Annual hours | 1643 | 1650 |
| Per semester | 821,5 | 825 |
| Per month | 136,9 | 137,5 |
| Teaching+admin per semester | 493 | 495 |
| Research per semester | — | 330 |
| 1 month → Vipomatic | 82,1 t | 82,5 t |

### Mechanisms

- **Fuldt frikøb** — institute compensated the researcher's full kostpris; researcher commits all
  work time (teaching *and* research) to the project.
- **Undervisningsfrikøb** — funder buys only the teaching obligation; institute compensated
  **60% of salary**. Permitted only in very limited scope; requires institut- and afdelingsleder
  approval before the application is submitted.
- **Medfinansiering** — in-kind. Always the researcher's *research* time, contributed on top of
  the frikøb months. Not registered in the timeregnskab.

### Money → time

`months = granted amount / monthly kostpris`. Lektor ≈ **50.000 kr/md** is given as a rough
default; the source explicitly says forskningsstøtteenheden computes a concrete per-person figure.

### Guiding hourly rates — stated as "pr. 1. april 2019"

| Kategori | IDV / rekvireret | Tilskudsfinansieret |
|---|---|---|
| Professor | 1.539 | 932 |
| Lektor | 1.220 | 788 |
| Adjunkt / postdoc / vid.ass. m. ph.d. | 1.007 | 695 |
| Ph.d.-stud. / vid.ass. u. ph.d. | 850 | 566 |
| Studerende | 385 | 329 |

Rationale given: *"universitetet må ikke underbyde markedet"* — AU may not undercut the market.
For samfinansieret forskning the rates are negotiable and often quoted **inclusive of overhead
and administration**.

### Named contacts

- IKS: a forskningskonsulent and a forskningskoordinator (named in the IKS notat)
- IKK: a postawardkoordinator, a forskningskonsulent and a Vipomatic contact (named in the IKK notat)

---

## Part B — From AU web pages. NOT yet verified against primary documents.

### B1. The 1643 → 1650 change is a *year* change, not an institute difference

**This corrects a natural misreading of the two PDFs.**

AU's Vipomatic pages list semester norms per position:

| Position | 2023 | 2024+ |
|---|---|---|
| Adjunkt (tenure track) | 493 | 495 |
| Lektor | 493 | 495 |
| Professor | 493 | 495 |
| Studieadjunkt | 657 | 660 |
| Studielektor | 657 | 660 |
| Forsker / Postdoc | 164,5 | 165 |

493 corresponds to the 1643 basis and 495 to the 1650 basis. The IKS note is from 2022 (old
basis); the IKK note is from June 2026 (new basis). So the constants appear to be **time-versioned,
not institute-versioned.**

*Confidence: high — but the per-position table itself is Part B and needs confirmation.*
Source: <https://cc.medarbejdere.au.dk/en/it-systemer/vipomatic-working-hours>

### ~~B2. The 60/40 split is not universal~~ — ❌ SUPERSEDED AND PARTLY WRONG

> **Do not use this entry.** It has been replaced by the primary source. See
> **`NOTES-arbejdstidsaftale.md`** for the verified norm table.
>
> The headline conclusion held — 60/40 is *not* universal — but my per-category reading was wrong:
> I recorded "postdoc ≈ 20% teaching" when the 165-hour figure actually belongs to
> studieadjunkt/-lektor and is their **non-registered** 20%, not a teaching norm. Their registered
> norm is 657 t (80%). **Postdocs have no fixed norm at all.**
>
> The 411 t/semester figure for 3-year adjunkter *was* right, and is now explained: the
> arbejdstidsaftale §6.1 drops the teaching obligation from 60% to 50% beyond three years.

Original sources: <https://cc.medarbejdere.au.dk/en/it-systemer/vipomatic-working-hours> ·
<https://cas.medarbejdere.au.dk/en/practical-information/working-hours-and-tasks>

### B3. The faculty work-time agreement outranks the institute notes

`Arbejdstidsaftale på Faculty of Arts (2023–2025)` has been **extended through end of 2026**, with
a revision underway explicitly intended to simplify it and ensure that VIP "without special
administrative functions or buy-out of teaching" can meet their hour norms and obtain regular
research semesters.

**Implication: the ground truth is moving. Date-versioned config is required, not optional.**

Source: <https://medarbejdere.au.dk/fakulteter/arts/aktuelt/single-nyhed/artikel/vip-arbejdstidsaftalen-forlaenges-til-2026>

### B4. Frikøb for forskningsledelse is always taken from teaching time

*"Buy-out for research leadership will always be buy-out in teaching time."*
A concrete special-case rule. Whether other special cases exist is an open question.

Source: ARTS Arbejdstidsaftale (via search summary — **primary PDF not yet obtained**)

### B5. Vipomatic registers teaching and administration only

Research and knowledge exchange are explicitly outside the system. Confirms the mechanism behind
the 60% rule.

Source: <https://cc.medarbejdere.au.dk/en/it-systemer/vipomatic-working-hours>

### B6. The hours account carries balances across semesters

Teaching deficits are treated as *deferred teaching obligations*; surpluses as *deferred research
obligations*. Reviewed at the annual MUS. Balance is expected "over several semesters", not within
a single one.

**Implication:** a frikøb does not settle in isolation. Consultants may need to see its effect on a
running balance — open question.

Source: <https://cc.medarbejdere.au.dk/en/it-systemer/vipomatic-working-hours>

### B7. Ph.d. work obligation

**840 hours in total** over the programme (≈280/year), apparently uniform across ARTS institutes.
Does not fit the monthly-norm model — needs its own treatment.

Source: <https://phd.arts.au.dk/fileadmin/phd.arts.au.dk/AR/Institutarbejdsregler_DK.pdf>

### B8. Miscellaneous

- Teaching hour (konfrontationstime) = 45 minutes. Two preparation categories, norms of 3 h and
  1,5 h; conversion factor 4.
- 1/1924 is AU's divisor for overtime compensation.

### B9. A lønkatalog is NOT a source of kostpris — verified

Originally checked against the Health faculty lønkatalog (valid 2026-04-01 → 2029-03-31), obtained
as a structural proxy for the Arts VIP lønkataloger. **That file has since been removed from
`rules/`** — it was a different faculty and is fully superseded by `Loen_aftale_Arts_2025.pdf`,
which is Arts-specific, signed, and demonstrates the same point. The finding below stands and is
confirmed by the Arts document (see §B9b).

A lønkatalog is a **negotiation** document, not a **budgeting** document. It contains:

- **Basisløn** — not stated. Delegated out: *"Løntrin iht. overenskomst for Akademikere i staten"*.
- **Tillæg** (kvalifikations-, funktions-, stillingstillæg) — stated, but *"angivet i årligt
  31.3.2012-niveau"*, i.e. a 2012 price level requiring indexation to current kroner.
- **Pension** — only the rule (*"ydes af basisløn og tillæg"*), no rate.
- No holiday pay, no employer overheads, **no total employment cost anywhere**.

So a full kostpris would have to be assembled as: basisløn (AC overenskomst, by anciennitet)
+ tillæg (2012-level, indexed) + pension + feriepenge/særlig feriegodtgørelse + other employer
costs. That build-up is precisely why the frikøb notat says forskningsstøtteenheden computes a
concrete figure per person.

**Consequence:** requesting the Arts VIP lønkataloger would not have unblocked Q2. What we
actually need is either a set of standard **budgeting rates** (kostprissatser) per category, or
confirmation that it is always case-by-case. The question has been rewritten accordingly.

*Confidence: high. Health's catalogue is a different faculty, but the document class and the
governing framework (Nye lønsystemer, AC overenskomst) are AU-wide.*

Source: `rules/IDV_prisliste_AU_Cetera_2025-2026.pdf`, §2.5, §2.7, §4.1–4.2

### B9b. Arts lønaftale (2025-09-17) — the salary *composition*, but still not kostpris

Source: `rules/Loen_aftale_Arts_2025.pdf`, Bilag 2.
Signed by the dean and the FTR. **This is the Arts-specific document** and it is
current. It confirms the Health finding but adds real structure.

> "Nettoløn for VIP består af: Grundløn i henhold til AC-overenskomsten: trin 4 (toårigt), trin 5,
> trin 6 og trin 8 · Overenskomstfastsatte stillingstillæg · Evt. kvalifikationstillæg ·
> Evt. funktionstillæg"

**All amounts below are annual, 2012-level (31.3.2012), and EXCLUDE pension.**

| Stilling | Basisløntrin | Stillingstillæg | Kvalifikationstillæg |
|---|---|---|---|
| AC TAP | — | — | 20.000 (1.), 15.000 (efterfølgende) |
| Videnskabelig assistent | Trin 4 (laveste) – 8 (højeste) | 37.200 | op til 15.000 |
| Post.doc / adjunkt | Trin 6 (laveste) – 8 (højeste) | 49.300 | op til 15.000 |
| Studieadjunkt | — | 34.100; 43.900 efter 3 år | 13.100 efter 3 / 6 / 9 år |
| Studielektor | — | 71.800 | 13.100 efter 3 / 6 / 9 år |
| Lektor A | Trin 8 | 87.900 | 20.400 |
| Lektor B | Trin 8 | 87.900 | 27.400 |
| Lektor C | Trin 8 | 87.900 | 26.600 ⚠️ |
| Professor A | Lønramme 37 | — | 51.400 |
| Professor B | Lønramme 37 | — | 35.900 |

⚠️ **Low confidence on the Lektor C row.** The PDF's table layout is broken on page 15 — the
"Lektor C" label and the "Professor" heading collide, and the third Lektor row carries no visible
label. 26.600 being *lower* than Lektor B's 27.400 is also counter-intuitive for a higher tier.
**Verify before use.**

Also note: **Bilag 4, which "illustrated the actual salary levels at Arts", was deleted** from the
2025 update ("data findes digitalt"). That appendix would have been the most directly useful thing
in the document.

**What is still missing to compute a kostpris:**

1. AC-overenskomst **grundløn** amounts for trin 4/5/6/8 — *public*, published by
   Medarbejder- og Kompetencestyrelsen
2. The **2012 → current indexation factor** (reguleringsprocent for grundbeløbsniveau 31.3.2012)
   — *public*
3. **Pension rate** (AC staff is typically 17,1%) — *public*
4. **Feriepenge / særlig feriegodtgørelse** and other employer costs — partly public
5. Whether AU's own budgeting practice adds anything on top

**This means a kostpris build-up is potentially derivable from public sources**, rather than
requiring an internal rate sheet. Worth confirming with the consultants before we attempt it —
if they already have standard budgeting rates, deriving our own would be worse than useless
(two numbers that disagree).

### B10. No DPU frikøb note found

No DPU-specific frikøb document could be located publicly. Either it does not exist and DPU
follows the faculty agreement, or it sits behind the staff portal. **DPU constants remain `null`
in config.**

---

## Documents still needed

`medarbejdere.au.dk` returns HTTP 403 to automated requests, so these must be downloaded manually
by someone with AU access.

### ⭐ Highest-value leads (found 2026-08-30)

**1. "Prisliste for køb af VIP- og TAP-ressourcer"** — AU Økonomiportalen → Projekthåndtering.
AU's own page description mentions *"a price list for the purchase of VIP and TAP resources, as
well as rates for room rental"*. **This is very likely the direct answer to the kostpris gap
(Q2)** — a rate list for buying staff time is precisely what a frikøb calculator needs.
<https://medarbejdere.au.dk/institutter/oekonomiportalen/projekthaandtering>

**2. "Projektøkonomi og eksterne midler" (Kapitel 3)** — the section governing external funding.
Should carry overhead rates, IDV rules, and moms treatment (Q5).
<https://medarbejdere.au.dk/en/administration/finance/kap3/instructions-regarding-external-funding>
Sub-pages worth grabbing:
- *Værd at vide om eksterne midler* — `.../useful-information-on-external-funding`
- *Retningslinjer for ansatte på Aarhus Universitet* — `.../legislation-guidelines/guidelines-for-au-employees`
- *Retningslinjer for samarbejdsaftaler* — `.../legislation-guidelines/cooperation-agreements`

### Then, in priority order:

1. **Arbejdstidsaftale på Faculty of Arts (2023–2025), signed** — the authoritative source above
   all institute notes.
   <https://medarbejdere.au.dk/fileadmin/www.medarbejdere.au.dk/hovedomraader/Arts/Politikker_og_delstrategier/Arbejdstid_aftale_Arts_2023-2025.pdf>
2. **VIP lønkataloger, Arts** — likely the real source for **kostpris** defaults, our single
   biggest data gap.
   <https://medarbejdere.au.dk/administration/hr/lonadm/loenforhandling/loenforhandling-paa-arts/vip-loenkataloger>
3. **"VIP-arbejdstidsaftalen forlænges til 2026"** — confirms what is currently in force.
   <https://medarbejdere.au.dk/fakulteter/arts/aktuelt/single-nyhed/artikel/vip-arbejdstidsaftalen-forlaenges-til-2026>
4. **Retningslinjer for samarbejdsaftaler / ekstern finansiering** — overhead %, IDV, moms.
   <https://medarbejdere.au.dk/en/administration/finance/kap3/instructions-regarding-external-funding/legislation-guidelines/cooperation-agreements>
5. **Arbejdstidsaftale 2017** — historical comparison of norms.
   <https://medarbejdere.au.dk/fileadmin/user_upload/underskrevet_arbejdstidsaftale_Faculty_of_Arts_15_december_2017.pdf>
6. **DPU's frikøb note**, if one exists — ask the consultants.

When a document arrives, move the relevant claims from Part B to Part A and cite the PDF.
