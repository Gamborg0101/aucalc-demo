# Hourly rates — what we have, and what they mean

## AU Cetera prisliste (2025–2026) ✅ primary, but narrowly scoped

Source: `IDV_prisliste_AU_Cetera_2025-2026.pdf`, AU, 2025-02-21, Bilag 1.

⚠️ **Scope caveat, important:** despite the promising title, this is *not* a general cost-price
table. Its own opening line scopes it:

> "Nærværende takstkatalog anvendes til fastlæggelse af pris, når **AU Cetera** trækker på AU's
> ressourcer i form af personale og lokaler."

AU Cetera is AU's continuing-education arm. These are **internal transfer prices** — what AU Cetera
pays to draw on AU staff. They are **sales prices ex moms**, so they already contain overhead and
margin. **They are not kostpris**, and must not be used as one.

### Takster pr. arbejdstime (kr, ex moms)

| Stillingskategori | 2025 | 2026 |
|---|---|---|
| Professor | 1.650 | 1.700 |
| Professor med særlige opgaver (MSO) | 1.450 | 1.500 |
| Lektor | 1.350 | 1.350 |
| Seniorforsker | 1.350 | 1.350 |
| Adjunkt | 1.050 | 1.100 |
| Post.doc. | 1.000 | 1.050 |
| Videnskabelig assistent | 950 | 1.000 |
| Lønnet ph.d. | 850 | 900 |
| Lønnet ph.d., Klinisk Medicin | 950 | 1.000 |
| Chef-/specialkonsulent | 1.300 | 1.350 |
| Fuldmægtig | 1.100 | 1.150 |
| Kontor m.fl. | 950 | 950 |
| Teknisk AC-personale m.fl. | 1.100 | 1.150 |
| Tekniker | 1.050 | 1.050 |
| Laborant m.fl. | 900 | 950 |
| IT-medarbejder | 1.050 | 1.100 |
| Studentermedarbejder | 400 | 450 |

"Taksterne genberegnes årligt." Note this table gives us **MSO as its own category**, which the
frikøb notat's rate table lacked.

Lokaleleje, dagspris ex moms (incl. bygningsdrift og service): 8–30 pladser 1.250 · 31–75 1.750 ·
76–152 2.350 · 170+ 4.350 (2026).

### Why it is still useful: it dates the 2019 rates

Comparing against the guiding IDV rates in the IKS frikøb notat (stated "pr. 1. april 2019"):

| Kategori | IDV 2019 | AU Cetera 2026 | Δ |
|---|---|---|---|
| Professor | 1.539 | 1.700 | +10% |
| Lektor | 1.220 | 1.350 | +11% |
| Adjunkt / postdoc | 1.007 | 1.100 / 1.050 | +9% / +4% |
| Ph.d. | 850 | 900 | +6% |
| Studerende | 385 | 450 | +17% |

Same structure, same ordering, uniformly ~4–17% higher across ~7 years. That is consistent with
ordinary indexation and **strongly suggests the 2019 table is simply stale rather than wrong in
kind**. It does *not* license us to substitute these numbers for the ARTS guiding rates — different
purpose, different governing arrangement — but it does justify shipping the 2019 table flagged
`provisional` with a visible "satser fra 2019, sandsynligvis forældede" warning.

### ⚠️ Do NOT reverse-engineer kostpris from these

It is tempting: if the IDV stack is `cost × 2,05 × 1,10`, then professor 1.700 kr/t implies
~754 kr/t direct cost, and × 1.460 productive hours ≈ 1,1 mio. kr/år — which is a plausible
professor kostpris. **This is speculation and must not enter config.** AU Cetera's pricing is not
stated to follow the IDV stack, and one plausible-looking back-calculation is exactly the kind of
invented number the project rules forbid. Recorded here only so the next person does not "discover"
it and act on it.

---

## Guiding rates from the IKS frikøb notat (2019) — `provisional`

| Kategori | IDV / rekvireret | Tilskudsfinansieret |
|---|---|---|
| Professor | 1.539 | 932 |
| Lektor | 1.220 | 788 |
| Adjunkt / postdoc / vid.ass. m. ph.d. | 1.007 | 695 |
| Ph.d.-stud. / vid.ass. u. ph.d. | 850 | 566 |
| Studerende | 385 | 329 |

Status: **stale, currency unconfirmed.** Ship flagged; warn when `asOf` is more than 24 months
after `effectiveFrom`.

---

## Still open

- **Kostpris per category** — not closed by this document. Still the biggest gap.
- **Overhead for tilskudsfinansieret forskning** — see `NOTES-idv-overhead.md`. Unlike IDV, this is
  set by the **funder**, not by AU, so there will not be one AU-wide number.
