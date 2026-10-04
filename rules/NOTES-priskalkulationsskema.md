# Priskalkulationsskema DR2 2026 — extracted

**Source:** ✅ **Primary, verified.** `rules/IDV_priskalkulationsskema_2026.xlsm`
AU's mandatory IV pricing form ("Den fastlagte overheadsats og priskalkulationsskema **skal
anvendes**"). Sheet last updated 2025-09-17.

Sheets: `Vejledning` · `Projekt` · `Nøgletal` · `Institutter` · `Takstkatalog` · notes.

---

## ⭐ Månedsløn per stillingstype — pr. 1/4-2026 (kr.)

From the `Takstkatalog` sheet. **This is the closest thing to an official kostpris table we have.**

| Kode | Stillingstype | Lav | Median | Høj |
|---|---|---|---|---|
| 111 | Professor | 81.000 | **85.000** | 90.000 |
| 114 | Professor MSO | 76.000 | **78.000** | 81.000 |
| 121 | Lektor | 65.000 | **68.000** | 73.000 |
| 124 | Seniorforsker | 68.000 | **71.000** | 74.000 |
| 131 | Adjunkt | 53.000 | **55.000** | 57.000 |
| 137 | Post doc. | 53.000 | **53.000** | 54.000 |
| 154 | Videnskabelig assistent | 43.000 | **43.000** | 50.000 |
| 212 | Lønnet ph.d.-stipendiat | 40.000 | **43.000** | 46.000 |
| 212 | Lønnet ph.d. Klinisk Medicin | 43.000 | **48.000** | 51.000 |
| 421 | Chef-/specialkonsulent | 62.000 | **65.000** | 69.000 |
| 422 | Fuldmægtig | 51.000 | **56.000** | 58.000 |
| 431 | Kontor m.fl. | 41.000 | **46.000** | 50.000 |
| 451 | AC-personale m.fl. | 49.000 | **54.000** | 59.000 |
| 461 | Tekniker | 45.000 | **49.000** | 53.000 |
| 465 | Laborant m.fl. | 41.000 | **45.000** | 48.000 |
| 466 | IT-medarbejder | 41.000 | **49.000** | 57.000 |

"Månedsløn taksterne ændres sidst i marts" — updated annually, in force from 1 April.

### ✅ RESOLVED — this data matches the official Takstkatalog

This sheet's figures are identical to the quartile bilag of
`Kostpris_takstkatalog_2026.pdf` (lektor 65/68/73 in both). Same data, two carriers.

The apparent conflict with the frikøb notat's *"kostpris ca. 50.000 kr/md"* was a
category error on my part: **kostpris is formally an hourly rate**, månedsløn is a salary, and the
notat used "kostpris" loosely for monthly employment cost. See `NOTES-kostpris.md` for the full
resolution. The short version: for a lektor in 2026 the real monthly figure is **~70.000 kr**, so
the 2022 notat's 50.000 is roughly **40% low** and must not be a default.

## ⭐ ARTS uses 1.485 timer for DR2

From the sheet's own maintenance notes:

> "**ARTS og BSS anvender 1485**, som kostpris på deres DR2 projekter"
> "TECH anvender 1460, som kostpris på deres DR2 projekter"
> "Øvrige institutter anvender 1580, som kostpris på deres DR2 projekter"
> "For delregnskab 2 gælder stadig, at kostprisen skal være mindre end eller lig med 1580."
> "Der kan lokalt træffes beslutning om anvendelse af en aftalt kostpris, den skal dog være
> mindre end 1580."

So the productive-hours divisor is **faculty-specific**, and **ARTS = 1.485**. That resolves which
of 1.460/1.485/1.580 applies to us. A locally agreed figure is permitted but must be ≤ 1.580.

The `Institutter` sheet carries per-institute columns `Navision Kostpris DR2` and
`Navision Kostpris DR4 og DR5`, i.e. the divisor differs by delregnskab too.

## ⭐ Pris- og lønregulering — the indexation rates

From the `Takstkatalog` lookup table (A28:H33):

| Pr. | Regulering | Faktor |
|---|---|---|
| 1/4-2025 | 4,6% | 1,046 |
| 1/4-2026 | 2,9% | 1,029 |
| 1/4-2027 | 0% | 1,000 |
| 1/4-2028 | 2,5% | 1,025 |
| 1/4-2029 | 2,0% | 1,020 |
| 1/4-2030 | 2,0% | 1,020 |

⚠️ A second block in the same sheet (F5:H10) lists the 2026 and 2027 values **swapped**
(2026 → 0%, 2027 → 2,9%). One block is the live lookup and the other appears to be worked
examples, but the extraction is ambiguous about which. **Verify against the open workbook before
using.** Multi-year budgets are sensitive to the ordering.

The sheet also documents compounding explicitly — "Eksempel 2 - Rentes rente formel":
`(200,00) × (1+0,000) × (1+0,029) × (1+0,025) × (1+0,020) = 220,65`. So indexation **compounds**
across years rather than applying to a fixed base. Our timeline model must do the same.

Maintenance note in the sheet: *"regulering i procent opdateres i de gule celler 1. april, eller
når de nye tal foreligger"*.

## The official cost stack

Line items on the `Projekt` sheet, in order:

```
A) Direkte lønomkostninger
   ( + overhead, at Overheadprocent )
C.1) Drift i alt
C.2) Beregnede omkostninger i alt
D)   Drift (C1 + C2)
E+F) …
G)   Omkostninger i alt inklusiv EBIT-avance (E+F)
     = "svarende til en minimumspris på kr"
H)   Aftalt pris
I)   Forventet resultat
```

`Nøgletal` summary columns: `Timer · Løn · OH · Drift · Pris · Resultat · Ebit kr. · Ebit %`,
with EBIT % defaulting to **0,1** (10%) — matching the AU Økonomi notat.

Confirms the two-different-bases structure: **overhead on løn only**, **EBIT on the whole**.

Also on the form: monopoly is a checkbox — *"hvis Ja … EBIT-margin ændres automatisk til 0,0%"* —
plus gating questions on whether AU has hjemmel, whether the activity was tendered, and whether it
is a natural extension of the institute's core activities.

---

## What this closes

- ✅ **Kostpris per category** — we now have a real, current, AU-official table (subject to the
  månedsløn-vs-kostpris question below).
- ✅ **Which productive-hours divisor ARTS uses** — 1.485.
- ✅ **P/L-regulering rates**, and that they compound.
- ✅ **The IDV cost stack order.**

## What it does not close

- ❓ **Undervisningsfrikøb price basis.** The only remaining blocker.

*(Both of the other questions once listed here are now answered: kostpris in `NOTES-kostpris.md`,
and grant overhead — 44% for statslige funders, on all direct costs — in
`NOTES-fondsansoegning-overhead.md`.)*
