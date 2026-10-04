# Kostpris — complete

**Sources:** ✅ **All primary, verified.**
- `Kostpris_procesdokument_2026.pdf` — AU Ressourceenheden, 2025-05-15, the process definition
- `Kostpris_historiske_formler_2015-2026.pdf` — Ressourceenheden, 2026-01-19, all parameters 2015–2026
- `Kostpris_takstkatalog_2026.pdf` — Ressourceenheden, 2026-02-03, **the recommended budgeting table**
- `Kostpris_hvad_koster_en_2025-2032.pdf` — computed kostpris per month/year, 2025–2032

---

## The three quantities, finally disentangled

An earlier note in this repo treated the frikøb notat's "kostpris ca. 50.000 kr/md" and the
Priskalkulationsskema's "68.000 månedsløn" as contradictory. They are not — and the resolution is
now fully documented:

| | What it is | Lektor 2026 |
|---|---|---|
| **Månedsløn** | The salary itself | ~68.000 kr/md (median) |
| **Kostpris** | Full employment cost. Formally an **hourly** rate; AU also publishes it converted to a monthly figure on the 1924-basis | ~442 kr/t ≈ **70.000 kr/md** |
| Frikøb notat's "kostpris" | A 2022 rough planning figure | "ca. 50.000 kr/md" — **badly stale** |

**The 2022 figure of 50.000 understates the 2026 reality by roughly 40%.** It must not be a default.

## The formula, fully evaluable

From `Kostpris_procesdokument_2026.pdf` and `Kostpris_historiske_formler_2015-2026.pdf`:

```
Kostpris (1924-timenorm) = (Månedens løn / Månedens timer) × feriefaktor + bidragssats
```

with `Månedens timer` = **160,33** (= 1924/12).

### Parameters by year

| År | Feriefaktor | Bidrag (kr/t) | Note |
|---|---|---|---|
| **2026** | **1,03** | **5,18** | særlig feriegodtgørelse 1,75% + nettoferieafregning 1,25%. Opr. faktor 1,025 applied until April. |
| 2025 | 1,03 | 5,20 | |
| 2024 | 1,03 | 4,98 | faktor changed — kompensation for st. bededag |
| 2023 | 1,025 | 4,86 | |
| 2022 | 1,02 | 4,86 | |
| 2021 | 1,02 | 4,65 | |
| 2020 (fra sept.) | 1,02 | 4,47 | ændring pga. samtidighedsferie |
| 2020 (t.o.m. aug.) | 1,03 | 4,47 | |
| 2019 | 1,03 | 4,54 | |
| 2018 | 1,03 | 4,37 | |
| 2017 | 1,035 | 2,99 | |
| 2016 | 1,035 | 3,05 | |
| 2015 | 1,035 | 3,29 | |

**Worked example — lektor, 2026, median månedsløn 68.000:**

```
(68.000 / 160,33) × 1,03 + 5,18 = 424,12 × 1,03 + 5,18 = 442,03 kr/time
× 160,33  →  ≈ 70.870 kr/md
```

which lands on the Takstkatalog's published 70.000 kr/md (rounded up to whole thousands). ✅

### Two other formulas

**Tidsregistrerende ressourcer (1460-timenorm) — discontinued after 2025:**
```
Kostpris = (Månedens løn / (Månedens timer × 1460/1924)) × faktor × estimeret faktor + bidragssats
2025: faktor 1,0175 · bidrag 6,85 kr/t · estimeret faktor 1,025
```

**SU-ph.d.:**
```
Kostpris allokering      = (2 × SU) / 160,33
Kostpris tidsregistrerende = (2 × SU) / 121,67        (121,67 = 1460/12)
```
SU-sats: 2026 **7.426** · 2025 7.086 · 2024 6.820 · 2023 6.589 · 2022 6.397 · 2021 6.321 ·
2020 6.243 · 2019 6.166 · 2018 6.090 · 2017 6.015 · 2016 5.941 · 2015 5.903.

→ 2026 SU-ph.d. allokering = 2 × 7.426 / 160,33 = **92,63 kr/time**.

## ⭐ The budgeting table — `Kostpris_takstkatalog_2026.pdf`

This is the one to ship as the default. Its own guidance:

> "I ansøgningsbudgetter om inddækning af løn for **ikke-navngivne medarbejdere** anbefales det at
> tage udgangspunkt i enten den nedenstående tabel, eller i det mere detaljerede bilag.
> **Kostpriser for eksisterende medarbejdere vil allerede være indarbejdet i Navision**, og kan med
> fordel benyttes i ansøgningen."

Which confirms the two-mode design: **named person → Navision; unnamed → this table.**

### Middel, månedsløn i april (kr., løbende priser)

| Kode | Stillingstype | 2026 | 2027 | 2028 | 2029 |
|---|---|---|---|---|---|
| 111 | Professor | 87.000 | 89.000 | 92.000 | 96.000 |
| 114 | Professor MSO | 79.000 | 81.000 | 83.000 | 87.000 |
| 121 | **Lektor** | **70.000** | 71.000 | 73.000 | 77.000 |
| 124 | Seniorforsker | 71.000 | 73.000 | 75.000 | 79.000 |
| 131 | Adjunkt | 55.000 | 57.000 | 58.000 | 61.000 |
| 137 | Post doc. | 54.000 | 55.000 | 56.000 | 59.000 |
| 154 | Videnskabelig assistent | 46.000 | 47.000 | 49.000 | 51.000 |
| 212 | Lønnet ph.d.-stipendiat | 43.000 | 44.000 | 45.000 | 48.000 |
| 212 | Lønnet ph.d. Klinisk Medicin | 47.000 | 48.000 | 50.000 | 52.000 |
| 421 | Chef-/specialkonsulent | 67.000 | 68.000 | 70.000 | 74.000 |
| 422 | Fuldmægtig | 54.000 | 55.000 | 57.000 | 60.000 |
| 431 | Kontor m.fl. | 46.000 | 47.000 | 48.000 | 51.000 |
| 451 | AC-personale m.fl. | 53.000 | 55.000 | 56.000 | 59.000 |
| 461 | Tekniker | 50.000 | 51.000 | 52.000 | 55.000 |
| 465 | Laborant m.fl. | 44.000 | 46.000 | 47.000 | 49.000 |
| 466 | IT-medarbejder | 49.000 | 51.000 | 52.000 | 54.000 |

### Bilag — kvartiler, 2026

`Lav` = 1. kvartil · `Median` = 2. kvartil · `Høj` = 3. kvartil.

| Kode | Stillingstype | Lav | Median | Høj |
|---|---|---|---|---|
| 111 | Professor | 81.000 | 85.000 | 90.000 |
| 114 | Professor MSO | 76.000 | 78.000 | 81.000 |
| 121 | Lektor | 65.000 | 68.000 | 73.000 |
| 124 | Seniorforsker | 68.000 | 71.000 | 74.000 |
| 131 | Adjunkt | 53.000 | 55.000 | 57.000 |
| 137 | Post doc. | 53.000 | 53.000 | 54.000 |
| 154 | Videnskabelig assistent | 43.000 | 43.000 | 50.000 |
| 212 | Lønnet ph.d.-stipendiat | 40.000 | 43.000 | 46.000 |
| 212 | Lønnet ph.d. Klinisk Medicin | 43.000 | 48.000 | 51.000 |
| 421 | Chef-/specialkonsulent | 62.000 | 65.000 | 69.000 |
| 422 | Fuldmægtig | 51.000 | 56.000 | 58.000 |
| 431 | Kontor m.fl. | 41.000 | 46.000 | 50.000 |
| 451 | AC-personale m.fl. | 49.000 | 54.000 | 59.000 |
| 461 | Tekniker | 45.000 | 49.000 | 53.000 |
| 465 | Laborant m.fl. | 41.000 | 45.000 | 48.000 |
| 466 | IT-medarbejder | 41.000 | 49.000 | 57.000 |

Guidance in the bilag: **Lav** for a newly qualified employee, **Høj** for high anciennitet,
**Median or Middel** when the profile is unknown. Ph.d. på Klinisk Medicin is computed separately
because those are consistently more expensive.

### Assumptions behind the table

- Based on January 2026 salary, uplifted **2,5% per 1 April 2026** per the OK26 forligstekst.
- Overslagsårene uplifted a further **2,5% annually**.
- **Rounded UP to whole thousands.**
- Kostpris **includes**: løbende løndele incl. pension · ferieafregning ved fratrædelser ·
  seniorbonus · særlig feriegodtgørelse · bidragssats (incl. barselsfond).
- Kostpris **excludes**: engangsudbetalinger (overarbejde, engangstillæg) · ekstraudgifter ved
  barsel og sygdom.

## `Kostpris_hvad_koster_en_2025-2032.pdf`

Same quantity, presented as **beregnet kostpris per måned and per år**, Lav/Middel/Høj, 2025–2032.
Annual is simply monthly × 12. Slightly different rounding from the Takstkatalog (lektor middel
67.800 vs 70.000), so the two agree in substance but not to the krone.

**Prefer the Takstkatalog** as the shipped default — it is the one AU's own guidance points
applicants at, and it carries the quartiles.

Historical versions retained: `Kostpris_takstkatalog_2024.pdf`, `_2025.pdf`.

---

## Design consequences

1. **Two input modes**, as AU's own guidance prescribes: *named person* → consultant supplies the
   Navision kostpris; *unnamed* → Takstkatalog default by stillingstype and quartile.
2. **Ship the Takstkatalog as config**, date-versioned, with 2026–2029 projections.
3. **Never default to 50.000 kr/md.** It is ~40% low.
4. Offer the quartile choice (Lav/Median/Høj) with AU's own guidance as helper text.
5. The tool *can* now compute kostpris from a salary if needed — the formula and all parameters are
   known — but should prefer the published table, and label any computed figure as an estimate.
