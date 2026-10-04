# Arbejdstidsaftale på Faculty of Arts (2023–2025) — verified extract

**Source:** `Arbejdstid_aftale_Arts_2023-2025.pdf`, signed.
**Status:** ✅ **Primary source, verified.** This document **outranks the institute frikøb notes.**
Extended through end of 2026 and under revision.

⚠️ **Vintage caveat:** the figures below are the **2023** vintage. AU's Vipomatic pages show the
semester norm moving 493 → 495 from 2024 onward (i.e. the 1643 basis → 1650). This signed PDF
therefore confirms the *structure* authoritatively, but its absolute numbers are one revision
behind. IKK's June 2026 note uses the 1650 basis. **Config must carry both, keyed by date.**

---

## Årsnorm (§3)

> "For fuldtidsansatte VIP beløber (ved afholdelse af fem ugers ferie og en uges særlige
> feriedage) et fuldt årsværk sig til **1.643 timer** svarende til **822 timer pr. semester**."

Note **822**, not 821,5 — AU rounds the half hour up. My earlier plan said 821,5 (from 1643 ÷ 2);
the official figure is 822. Use the published figure.

Consistency check: 493 + 329 = 822 ✓ · 657 + 165 = 822 ✓ · 986 + 657 = 1643 ✓

## Bilag B 13.1 — the authoritative norm table

### 13.1.1 Hovedstillinger

| Stillingskategori | Uddannelse, administration, rekruttering, ph.d.-relateret | Forskning, videnudveksling, myndighedsbetjening, forskningsadmin. |
|---|---|---|
| Tidsbegrænset og tenure track-adjunkt · **Lektor** · **Professor** | **60% – 493 timer** | **40% – 329 timer** |

Per year: 986 t registered / 657 t not registered.

### 13.1.2 Øvrige, generelle stillinger uden forskningsforpligtelse

| Stillingskategori | Uddannelse | Faglig udvikling og basisopgaver |
|---|---|---|
| Studieadjunkt og -lektor · Videnskabelig assistent **med undervisningsforpligtelse** | **80% – 657 timer** | **20% – 165 timer** |

Per year: 1.314 t / 330 t.

### 13.2 Ph.d.-studerende, postdoc og DVIP

| Stillingskategori | Norm |
|---|---|
| **Ph.d.-studerende** | Governed by *"Retningslinjer: Ph.d.-studerendes lønnede institutarbejde (de 840 timer)"*. Balance must be reached by completion within normed study time. |
| **Postdoc med institutforpligtelser** | **No fixed norm.** "Efter aftale med institutleder under iagttagelse af, at stillingens indhold fortrinsvis er forskning, og at denne type ansættelse ofte er eksternt finansieret og kan være forbundet med særlige krav." |
| **DVIP** (ekstern lektor, undervisningsassistent) | Per the ministerial *Cirkulære om aftale om eksterne lektorer og undervisningsassistenter*. |

---

## ❌ Correction to an earlier claim in this repo

An earlier note (`NOTES-web-research.md` §B2, now superseded) recorded:

> "Forsker / Postdoc — 165 t/semester — 20% teaching"

**That was wrong, on two counts:**

1. The **165 timer belongs to studieadjunkt/-lektor and vid.ass.**, not to postdocs — and it is
   their *faglig udvikling og basisopgaver* allocation, i.e. the **non-registered 20%**. Their
   *registered* norm is **657 timer (80%)**, the opposite end of the scale from what I recorded.
2. **Postdocs have no fixed norm at all.** It is individually agreed with the institutleder.

The AU web table I inferred it from listed "Researcher/Postdoc 164.5 / 165" without saying which
column it belonged to, and I attached it to the wrong row. **This is exactly the failure mode the
"never invent a number" rule exists to prevent** — the figure was real, but the interpretation was
mine, and it was wrong.

**Engine consequence:** a postdoc must NOT get a default teaching share. Selecting postdoc has to
prompt for an individually agreed split, or block — the same treatment as DPU's missing constants.

---

## Frikøb — the authoritative rule (§6.1)

> "For aktiviteter finansieret af **eksterne bevillinger** beregnes en reduktion af timer til
> arbejdsopgaver omfattet af nærværende arbejdstidsaftale **svarende til de forudsætninger, der er
> beskrevet i den pågældende finansieringsaftale**. Den tidsmæssige placering af sådanne frikøb
> aftales med afdelingslederen."

**This bears directly on the undervisningsfrikøb ambiguity (Q3).** The hour reduction is calculated
*according to the assumptions described in the financing agreement itself* — not by a fixed
AU-wide conversion. That suggests the answer to "what does the money buy" may legitimately be
**per grant**, which would mean the tool should let the consultant state the basis rather than
infer it. Still worth confirming, but it reframes the question.

## Other rules worth encoding

- **Balance tolerances (§6):** deficits are deferred teaching, surpluses deferred research.
  Swings **up to and including 986 timer** → rebalance within **2 years**; swings **over 986 timer**
  → within **4 years**.
- **Adjunkt beyond 3 years (§6.1):** teaching obligation drops **60% → 50%** for the portion of
  employment beyond three years. *This explains the 411-hour figure* seen on the IKS page
  (50% × 822 = 411). ✅ Now accounted for.
- **Forskningssemester (§6.1):** lektorer and professorer may agree a self-financed research
  semester roughly every 7th semester. Adjunkter get an institute-financed one.
- **Registered absence (§6.2):** semester obligation reduced by **7,4 timer per absence day**,
  distributed proportionally to the employee's work-time split.
- **Externally remunerated work (§5) is NOT registered** — external assessment work, co-supervision
  at other universities, external censor duties.
- **Teaching hour (§7.1):** konfrontationstime = 45 minutes. Two preparation categories, norms of
  **3 timer** and **1,5 timer**.
- **No local deviation (§5):** "Der må ikke lokalt aftales timenormer, som afviger fra timenormerne
  angivet i arbejdstidsaftalen." → institute-level variation in the *norms* is not permitted, which
  supports modelling constants as **date-versioned, not institute-versioned**.
- **Timeregnskab (§6.4):** kept for adjunkter, lektorer, professorer, studieadjunkter and
  studielektorer. Registration is handled by the institutes.
