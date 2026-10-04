# IDV — overhead and profit margin

**Sources:** ✅ **Primary, verified.**
- `IDV_overheadsats_2026.pdf` (AU Økonomi, 2025-06-23, sagsnr. 2025-0848420)
- `IDV_overheadsats_2027.pdf` (AU Økonomi, 2026-06-22, sagsnr. 2026-0963292)

Published **annually** by AU Økonomi. Applies to **indtægtsdækket virksomhed (IV/IDV)** only —
these documents say nothing about tilskudsfinansieret forskning, which still needs its own rates.

---

## The rates

| Type | 2025 | 2026 | 2027 |
|---|---|---|---|
| Overheadsats, **direkte løn** | 110% | **105%** | **105%** |
| Overheadsats, **direkte driftsomkostninger** | — | **0%** | **0%** |
| Minimumsoverskudsgrad (EBIT-margin) | — | **≥10%** | **≥10%** |
| Overskudsgrad, **monopol** | — | **0%** | **0%** |
| Markedsbestemt overskudsgrad | — | >0%, must be documented | >0%, must be documented |

## ⚠️ The two layers have DIFFERENT BASES — this is the critical structural fact

> "Bemærk, at overheadsatsen **kun benyttes for direkte løn**, mens der ikke indregnes overhead for
> eventuelle direkte driftsomkostninger på projektet. **Kravet om overskud gælder for alle
> omkostninger.**" (2026)

> "Overheadsatsen skal kun benyttes for direkte løn … Dette er **i modsætning til overskudsgrad,
> der beregnes ud fra alle løn- og driftsomkostninger**." (2027)

So:

```
overhead = direkte løn × 1,05                    ← salary ONLY
margin   = (direkte løn + driftsomkostninger) × 0,10   ← everything
pris     = direkte løn + driftsomkostninger + overhead + margin
```

**Engine consequence:** direct costs must be split into `directSalary` and `directOperating` as
separate fields. A single lumped `direct` figure **cannot** express this correctly — overhead would
be over-applied to operating costs. The cost-stack design already allowed per-layer bases; this
confirms the two bases are genuinely different and not a hypothetical.

## Rules attached to the rates

- **Mandatory.** "Den fastlagte overheadsats og priskalkulationsskema **skal anvendes**." Using the
  prescribed rate and the priskalkulationsskema is a compliance requirement, not guidance.
- **Market price is the floor.** Where an objective market price exists, it *is* AU's minimum price.
  The 10% minimumsoverskudsgrad is an explicit **fall-back for when no market price can be derived**
  — not a target. If a higher price can be negotiated, it should be.
- **A lower margin is permitted** only if the market's lower margin can be *documented*.
- **Monopoly situations:** margin drops to **0%**, but **overhead still applies**. Pricing is then
  pure cost recovery.
- **Absolute floor:** "Minimumsprisen må dog – uanset markedsforhold - aldrig blive så lav, at den
  ikke kan inddække AU's overhead."

## How the overhead rate itself is derived (for the /satser explainer page)

- `overheadsats = indirekte omkostninger (DR1) ÷ direkte lønudgifter`, on a **5-year average**.
- Covers husleje, støttefunktioner, and general ledelse/administration.
- Plus a **0,75% regulering** for costs private providers bear but AU does not — AU pays neither
  arbejdsskadeforsikring nor ansvarsforsikring, being under the state self-insurance scheme. Added
  for competition-neutrality.
- **Rounded to the nearest 5 percentage points**, with a **bagatelgrænse**: the rate only changes
  if the recomputed figure moves by ≥5 pp. Hence 2026's computed 107% → published **105%**.

Computed vs. published, from the documents' own tables:

| Year computed | 2020 | 2021 | 2022 | 2023 | 2024 | 2025 | 5-yr avg | Published |
|---|---|---|---|---|---|---|---|---|
| For 2026 | 112% | 107% | 105% | 104% | 105% | — | 107% | **105%** |
| For 2027 | — | 107% | 105% | 104% | 105% | 102% | 105% | **105%** |

## Terminology note

The 2026 note calls it "Generelle overskudsgrad (EBIT-margin)". The 2027 note renames it
"Minimumsoverskudsgrad (fall-back hvis markedspris mangler)" — clearer, same thing. Config should
carry the neutral term and cite both.

---

## Still missing

- **Overhead for tilskudsfinansieret forskning** (grant-funded). These documents cover IDV only.
  My earlier 44% assumption remains **unverified** — do not ship it as a default.
- **Moms/VAT treatment.** Not covered here. Referenced elsewhere as a consequence of the
  commercial/non-commercial classification.
- **Priskalkulationsskema 2026** — the actual pricing form. Would confirm the exact cost build-up
  order and whether anything else sits in the stack.
