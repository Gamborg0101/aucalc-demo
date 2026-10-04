# Rounding policy

## The problem

The source PDFs contain worked examples that appear mutually inconsistent. Two examples from the
same IKS notat, both for a lektor at 50.000 kr/md:

- **Example 4:** 75.000 kr → `(75000/50000)/12 × 1643 × 0,6` = **123 t**
- **Example 5:** 100.000 kr → 2 md → `2 × 136,9` = 273,8 t → `× 0,6` = **164,2 t**

Example 4 gives whole hours; example 5 gives one decimal. Scaling example 4 up to 100.000 kr gives
164 t, not 164,2 t. Which is right?

## The cause

**The documents compute from pre-rounded published constants.**

```
1643 / 12  = 136,9166…   but IKS prints 136,9
1643 × 0,6 = 985,8       but IKS prints 986
```

IKK does not have this problem, because `1650 / 12 = 137,5` exactly and `1650 × 0,6 = 990`
exactly. That is why none of the IKK examples conflict.

The IKS notat then uses **two different bases for two different kinds of report**, both
truncating:

| Path | Basis | Precision | Rounding | Examples |
|---|---|---|---|---|
| Vipomatic registration figure | 986 t/år | 0 dp | floor | 1, 2, 3, 4 |
| Work-time breakdown | 136,9 t/md | 1 dp | floor | 5, 6, 7 |
| IKK (clean arithmetic) | exact | 1 dp | — | 8, 9 |

### Verification

Truncation is **proven, not assumed** — half-up rounding contradicts the documents in two places:

| Check | Computed | Floor | Half-up | Document says |
|---|---|---|---|---|
| `986 × 0,5` | 493,0 | 493 | 493 | 493 ✓ |
| `986 / 12` | 82,1667 | 82 | 82 | 82 ✓ |
| `986 × 4/12` | 328,667 | **328** | 329 | **328** ✓ |
| `986 × 0,125` | 123,25 | 123 | 123 | 123 ✓ |
| `136,9 × 2 × 0,6` | 164,28 | **164,2** | 164,3 | **164,2** ✓ |
| `136,9 × 0,4` | 54,76 | **54,7** | 54,8 | **54,7** ✓ |
| `136,9 × 6 × 0,4` | 328,56 | 328,5 | 328,6 | 328,5 ✓ |

Rows 3, 5 and 6 discriminate: only truncation reproduces the published figures.

**Conclusion: examples 4 and 5 are not two formulas. They are two different reports.**

## The policy

### Canonical profile — what the tool uses

**Compute exactly from `annualWorkHours`. Round once, at the presentation boundary, per output
field. No intermediate rounding. No pre-rounded constants in the compute path.**

| Field | dp | Mode | Rationale |
|---|---|---|---|
| workHours, teachingHours, researchHours | 1 | half-up | matches how the notater present hours |
| hoursToRegister | 1 | half-up | the honest figure |
| **hoursToRegisterWhole** | 0 | **floor** | the integer typed into Vipomatic |
| months | 2 (display) | half-up | exact internally |
| money | 0 | half-up | Danish budgets are quoted in whole kroner |

**Why floor for the Vipomatic integer:** never register more teaching hours than the buy-out
actually funded. It is also what the IKS notat itself does. The trace surfaces the discarded
fraction explicitly, so nothing disappears silently.

### Legacy profiles — for matching a circulated notat

- `legacy-iks-2022` — basis 986 t/år, 0 dp, floor. Reproduces examples 1–4 exactly.
- `legacy-iks-2022-breakdown` — basis 136,9 t/md, 1 dp, floor. Reproduces examples 5–7 exactly.
- `legacy-ikk-2026` — exact basis, 1 dp. Reproduces examples 8–9 exactly.

These exist so a consultant can match a number in a document already in circulation. They are
selectable, never the default.

### Known deviation

Maximum canonical-vs-published deviation across all nine fixtures is **0,6 t (< 0,2%)**:

| Example | Published | Canonical |
|---|---|---|
| 1 | 493 | 492,9 |
| 2 | 82 | 82,2 |
| 3 | 328 | 328,6 |
| 4 | 123 | 123,2 |
| 5 | 164,2 | 164,3 |
| 6 | 82,1 / 54,7 | 82,2 / 54,8 |
| 7 | 492,8 / 328,5 | 492,9 / 328,6 |

**Surface this in the UI.** It pre-empts the "your tool says 492,9 but the notat says 493"
support ticket, which will otherwise be the first thing anyone reports.

### Floating point

`number` is fine. Errors are ~1e-9 kr against documents that disagree by 0,6 t. Do not add
`decimal.js`. The one real hazard is `Math.floor` on values like `164.28000000000003`, so the
rounding helper carries an epsilon guard.

## Resolved — whole hours, and it matters more than it looked like

Does Vipomatic accept decimals, or only whole hours? This determines whether
`hoursToRegisterWhole` is the headline figure or a footnote.

**Confirmed 2026-09-22: whole hours, and for a load-bearing reason, not just convention.**
Vipomatic applies standard rounding to figures *it* computes internally (247,5 → 248), but a
manually-typed entry is stored exactly as typed — Vipomatic does not round it. Since this
calculator's whole job on the hours side is telling a consultant what to type into Vipomatic by
hand, handing over the unrounded decimal instead of the floored whole number would have Vipomatic
register that exact fraction — silently over-crediting past what "rounding always favours the
institute" (above) intends, with no downstream safety net. `hoursToRegisterWhole` was already the
headline figure the engine emits; this confirms it has to stay that way. See
`docs/open-questions.md` R31.
