# Politik for frikøb til forskning ved eksterne midler (IKK)

**Source:** ✅ **Primary.** `rules/Frikoeb_IKK_politik.pdf`, Institut for Kommunikation og Kultur.
Dated only *"5. november"* — no year. It uses the **1643** basis and quotes **2019** timetakster,
so it predates the 2024 norm change. Treat the *principles* as current (the IKK staff page still
links it as live) but the *numbers* as dated.

---

## The notat's 60% example is about hours, not price

**Source:** ✅ **Primary**, sibling document. `rules/Frikoeb_IKK_notat_2026.pdf` ("Notat vedr.
frikøb på IKK", dated 2026-06-23 — `SRC_IKK_2026` in `config/norms.ts`).

The notat's worked example — "137,5 x 0,6 = 82,5 timer" — illustrates Vipomatic **hour
registration** (only 60% of hours get logged, because Vipomatic never tracks research time), not a
price equivalence between the two variants. Two different 60%s that happen to share a value for
lektor/adjunkt/professor — see `priceCoefficient` in `convert.ts` for where the code keeps them
separate. Tracked as R25 in `docs/open-questions.md`.

---

## ⭐ This answers the blocking question — partial frikøb is a PERCENTAGE, not a different price basis

**Princip 3:**

> "Ved **fuldt frikøb** fra fonde reduceres ydelsesforpligtelsen for den enkelte forsker med den
> samlede procentsats, der angiver institutarbejdsforpligtelsen for den pågældende
> stillingskategori. **Ved mindre end fuldt frikøb reduceres institutarbejdsforpligtelsen
> tilsvarende med den procentsats, der svarer til arbejdstiden minus forskning.**"

**Princip 1:**

> "Ved ansøgninger til fonde søges der som udgangspunkt dækning af **fuld løn på det faktiske
> niveau, dvs. bruttolønomkostningerne**."

**Princip 2:**

> "Frikøb til forskningsprojekter inkluderer som udgangspunkt **altid finansiering af den enkeltes
> forskningstid**. Eventuelle afvigelser fra denne grundnorm … og en deraf afledt **nødvendighed af
> at sænke frikøbsprocenten** – skal altid forhandles med institutleder inden afsendelse af
> ansøgning."

### What this settles

IKK's policy **does not contemplate a "teaching-only buy-out at 60% of salary" as a pricing
mechanism at all.** The model is:

> You buy a **percentage of a person's full time** for a period, at **full gross salary cost**.
> A "less than full" frikøb is a *lowered frikøbsprocent*, negotiated with the institutleder —
> not a different divisor.

So of the two readings the engine carries, this supports **`full_month_equivalent`**:
`months = beløb / kostpris`, with any partial buy-out expressed as a percentage of time rather
than as a discount on the price. The `salary_scaled` reading — where 60% of a salary month buys a
whole month of teaching release — is **not** how IKK describes it.

⚠️ **The caveat below is now resolved — see the update immediately after it.** This policy never
addresses the specific IKS-2022 scenario of a funder that *only* offers undervisningsfrikøb and
compensates the institute 60% of salary. IKK's answer to that case appears to be "don't — always
seek full løndækning", which is why this document originally recommended defaulting to
`full_month_equivalent` and waiting for a consultant to confirm.

### ✅ Resolved 2026-08-31 — a consultant confirms `salary_scaled`, not `full_month_equivalent`

A live conversation with a research consultant worked through an AUFF example: a funder buying
*only* the teaching obligation pays only for the teaching share of a salary month — the university
self-funds the remaining research share, so the same beløb buys **more** months of
undervisningsfrikøb than it would of fuldt frikøb, not the same or fewer. Concretely: 100.000 kr
that buys exactly 1 month of fuldt frikøb buys roughly 1,67 months of undervisningsfrikøb (at a
60% teaching share), because "de 40% skal ikke finansieres, da det er universitetet som så
finansierer dette."

That is `months = beløb / (kostpris × andel)` — `salary_scaled`. It doesn't contradict Princip
1–3 above (those describe *fuldt* frikøb's percentage-of-time model, which this document correctly
read as ruling out a *discount* on the price) — it answers the separate, genuinely unaddressed
question of what a *teaching-only* buy-out costs per month. `DEFAULT_UNDERVISNINGS_BASIS` is now
`salary_scaled`; `full_month_equivalent` stays selectable for a funder who explicitly insists on
paying full price regardless. See `docs/open-questions.md` R18.

### The worked examples — and they validate our FTE-month model

> **a.** "En lektor eller en adjunkt søger om fuldt frikøb i 6 måneder … godskrives med
> (6/12\*1643\*0,6) = **493 timer** – og er således pligtig til at yde **0 timer** i det pågældende
> semester."
>
> **b.** "En lektor søger om **2 måneders frikøb til projektledelse i tre år** og godskrives med
> (2/12\*1643\*0,6\*3) = **493 timer i alt**, 164 timer årligt og **82 timer pr semester** og skal
> således yde (493-82) **411 timer** i de pågældende semestre."
>
> **c.** "En professor søger om **to semestre med halvt frikøb** og godskrives med
> (3/12\*1643\*0,6\*2) **493 timer i alt**. Medarbejderen godskrives med (493/2) **246 timer pr.
> semester** og skal således yde (493-246) **247 timer** i hvert af de to semestre."

Note example c: *half* frikøb for a semester is computed as **3 months** of full frikøb
(3/12 × 1643 × 0,6). That is exactly `months = fteShare × spanMonths` — the canonical FTE-month
normalisation the engine already uses. ✅

**These are three new golden fixtures**, and b and c are the first that exercise partial frikøb and
the residual obligation (`semesternorm − credited`).

## Overhead: this policy says 113%, AU Økonomi says 105%

**Princip 7:**

> "Ved kommerciel virksomhed skal de konkrete lønudgifter **altid pålægges et overhead på 113%**.
> Nedenstående timetakser for kommerciel virksomhed er derfor **kun vejledende**."

AU Økonomi's current notater say **110% (2023–2025)** and **105% (2026 and 2027)**. 113% matches
none of them, and this document is undated and quotes 2019 rates.

**Resolution: prefer AU Økonomi's published annual rate.** It is the mandatory, dated, centrally
maintained figure ("Den fastlagte overheadsats … skal anvendes"). Record 113% as the
policy's figure only.

### Update 2026-08-31 — a third figure

`IDV_miniguide_kommerciel.pdf` — a central-AU document, not an institute one, and one nobody had
actually read text-by-text before — states in its "OBS punkter" list:

> "Husk at projekter, der er klassificeret som kommerciel aktivitet skal være fuldt
> omkostningsdækket, dvs. at der skal beregnes **116%** i overhead af projektets lønomkostninger +
> EBIT-grad."

Undated in the visible text. Neither 113% nor 116% appears anywhere in AU Økonomi's own five-year
computation table (`IDV_overheadsats_2026.pdf`/`_2027.pdf`: 112/107/105/104/105% for 2020–2024,
107/105/104/105/102% for 2021–2025). The engine uses AU Økonomi's dated 105%.

### Scoping context, 2026-08-31 (research consultant, live conversation)

Overhead is **only relevant for indtægtsdækket virksomhed (IDV)** — described as "yderst
sjældent" (very rare) in practice — and **has nothing to do with the hour registration side** of
a frikøb calculation. This doesn't resolve which of the three rates is current, but confirms this
question can't silently distort an ordinary tilskudsfinansieret frikøb: `pricing.ts` (where all
three rates live) isn't even wired into `/beregner`'s calculation flow yet. See
`docs/open-questions.md` C2.

The policy also confirms the 2019 timetakster we already had, and adds context:

- Commercial rates are **only indicative** because the 113% overhead rule governs.
- Samfinansieret rates are the ones "hvori behovet for dækning af generalieudgifter er inkluderet"
  — i.e. **inclusive of overhead**, confirming the `included_in_rate` layer is real.
- For samfinansieret, if the funder will not accept the rates, a negotiated fee is possible
  **but must be approved by the institutleder first**.

## Other concrete rules

**Princip 5 — overhead ownership:**
> "**Overhead tilfalder instituttet.** Ved ansøgninger, hvor det kun er muligt at opnå ringe eller
> ingen overhead, skal der inden ansøgning indsendes, indgås en aftale med institutleder om,
> hvorledes projektet kan bidrage til finansieringen af de generalieudgifter, det medfører."

**Princip 6 — postdoc supervision credit.** A concrete, quantified rule:
> Senior VIP bringing home a collective project containing postdoc positions, where no frikøb for
> seniorforskere is obtainable, may agree a reduction of **10% per semester (or 49 timer) per
> postdoc**, where that postdoc "i sin ansættelse er pligtig til at yde **20 % undervisning**".
> An externally financed **ph.d. does not** trigger additional frikøb for senior researchers.

📌 49 t ≈ 10% of the 493 t semester norm ✅.

### ⚠️ Correction 2026-08-31 — this is not a conflict with the arbejdstidsaftale, it's a missing feature

An earlier pass here read the "20% undervisning" clause as *partially answering* the postdoc
question — implying some tension with the arbejdstidsaftale's "individually agreed, no fixed
norm." That was an overstatement. Princip 6 never computes a postdoc's *own* frikøb at all — the
20% is just descriptive context for a rule about *someone else's* hours: the senior researcher who
brought the grant home. There is no live disagreement between this document and the
arbejdstidsaftale to resolve; `docs/open-questions.md` C3 has been corrected accordingly.

What actually follows from this princip is a **feature the engine doesn't have**: crediting a PI's
own institutarbejdsforpligtelse for postdoc positions they've secured funding for. That's a scope
question (build it or not, and when) rather than an open domain question.

**Princip 4:** the institutleder may agree hourly honorarium for particularly heavy research-admin
tasks — forskningsledelse, large conferences.

**Princip 8:** for commercial and samfinansieret work, researchers are credited with the **agreed**
number of hours; the institutleder must always be involved in estimating them.

## Procedure

- Contact the **afdelingsleder before applying** to agree nature, scope and placement of the frikøb.
- Notify the institute's **forskningsrådgiver** as early as possible.
- After an award, send the bevillingsbrev to the **projektøkonom**, who runs ongoing financial
  management.
- A budget is drawn up and **signed by both institutleder and bevillingshaver**. It is **binding**
  and may only be departed from via a formal rebudgettering — because the afdelingsleder plans
  teaching around it.

---

## Actions

1. Add examples a, b and c as **golden fixtures**, including the residual-obligation figures. ✅ done
2. ~~Default `undervisningsBasis` to `full_month_equivalent`~~ — **done 2026-08-31, but the other
   way**: default is now `salary_scaled`, confirmed by a research consultant. See the resolved
   section above.
3. Model **frikøbsprocent** as a first-class input — the policy's own framing — with
   `months = frikøbsprocent × varighed`. ✅ done
4. Add a **residual obligation** output: `semesternorm − credited hours`. All three examples state
   it, so consultants evidently need it. ✅ done
5. Keep AU Økonomi's 105% over this document's 113% (and over the miniguide's 116%). ✅ done in config; the exact rate is still `docs/open-questions.md` C2 — a
   consultant has since confirmed overhead only applies to IDV (rare) and has no bearing on hour
   registration, but not which of the three % is current.
6. **Build Princip 6** (PI teaching-credit for postdoc grants captured) as a distinct, separate
   calculation — it reduces the *grant-winning researcher's* own obligation, not the postdoc's. ✅
   **done 2026-09-21**: `computePiCredit()` in `src/lib/frikoeb/piCredit.ts` (10% of the semester
   teaching norm, floored, per postdoc — not wired into `solve()`, since the postdoc-share question
   this engine already handles correctly by refusing to default is a genuinely different question)
   plus a standalone card on `/beregner`. See `docs/STATUS.md`.

## 2026-09-04 — the default variant (R26)

The calculator defaults to the 60%-scaled model, labelled "Frikøb (standard)". That follows practitioner input and the IKK staff page (`cc.medarbejdere.au.dk/…/frikoeb`: "Langt de fleste på instituttet er ansat til at undervise 60% og forske 40%"). Full kostpris remains available as "Fuld kostpris".

"AUFF" names the teaching-only (`salary_scaled`) case: a fund that pays only for teaching.

**Resulting change (`ScenarioForm.tsx`, `scenario.ts`):** `DEFAULT_FORM.variant` is
`'undervisning'`. `full_month_equivalent` and `salary_scaled` are unchanged, and `salary_scaled`
is still the default sub-basis (R18). Labels were later refined in R27.

## Update 2026-09-01 — practitioner input

Input from practising research consultants (not a written source; nothing identifying is kept
in this repo). Only the generalizable domain facts are recorded:

**DPU's practice (closes out C4 in substance):** externally-funded project time registers on a
**60/40 split** — 60% reduces the arbejdsforpligtelse in Vipomatic, 40% reduces the
forskningsforpligtelse. That is the *same* split the engine already applies via each category's
`registeredShare`. DPU is not a deviation case. An older data point on IDV overhead (113%) was
superseded by the 2026-08-31 confirmation that overhead is IDV-only, rare, and irrelevant to
ordinary frikøb hour registration. See `docs/open-questions.md` R20–R21.

**Hours-registration is independent of pricing model:** the Vipomatic-hours figure is always
`months × årsnorm/12 × andel`, whether the money was priced as a full salary month or a
teaching-scaled amount. Confirms the engine's separation between the price coefficient
(money↔months only) and the hours formula. See R22.

**The FTE-month model (R16) holds in practice:** `varighed` is the actual funded duration, not the
total contract length, and samfinansieret time (the researcher's own research time) is excluded
from the calculation. See R23.

**Myndighedsbetjening (authority/government service work) is a different obligation category —
out of this calculator's scope, but worth recognizing if it comes up:** unlike frikøb-for-research,
Vipomatic registers this kind of work **1:1**, with no 60/40 split, when it's a "strategisk ydelse"
rather than a "kerneydelse". Its VAT/moms treatment turns on whether AU holds a **monopol** on the
specific task — `Projektenheden` (a central AU unit) makes that call case by case.

**Vipomatic's own day-length — confirmed 2026-09-01: a full work day is 7,24 timer.** The project owner
confirmed the 7,24 figure directly. `/beregner` now converts
a frikøb's total arbejdstid into arbejdsdage via `totalWorkHours / 7,24` instead of the earlier
generic calendar-day approximation (365/12). Applies to the current (2024+) årsnorm; no distinct
pre-2024 figure is confirmed, so 7,24 is used regardless of `asOf` as a pragmatic simplification.
See `docs/open-questions.md` R24.
