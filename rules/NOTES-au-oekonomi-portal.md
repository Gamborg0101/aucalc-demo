# AU Økonomiportalen — external funding & IDV

**Retrieved:** 2026-08-30, pasted from the AU staff portal by the user (the domain 403s automated
requests; `staff.au.dk` 301-redirects to `medarbejdere.au.dk`).
**Status:** page text is verbatim from AU. The *linked documents* below are confirmed to exist but
have **not** been obtained yet.

---

## 1. Confirmed to exist: the documents we actually need

From **Økonomiportalen → Projekthåndtering**:

> **"Prisliste til brug ved køb af VIP- og TAP-ressourcer samt takster for lokaleleje på AU"**

⭐ This is a price list for *buying VIP and TAP resources* — structurally the exact thing a frikøb
calculator needs. **Best candidate to close the kostpris gap.**

From **Projekthåndtering → Indtægtsdækket Virksomhed (IV)**:

| Document | Why it matters |
|---|---|
| **Priskalkulationsskema 2025 / 2026** | A price-calculation form. Likely encodes AU's official cost build-up — direct costs, overhead, margin — i.e. our gross-up stack, as AU actually defines it. |
| **Kommerciel IV – overheadsats og overskudsgrad for 2026** | The overhead rate **and profit margin** for commercial IDV. Published per year as a separate document. |
| **Kommerciel IV – overheadsats og overskudsgrad for 2027** | Same, next year → confirms these are annually versioned. |
| **Vejledning for Indtægtsdækket Virksomhed (IV)** | The IV rulebook. |
| **Miniguide: Kommerciel eller ikke-kommerciel aktivitet** | Decides which mechanism a project falls under. |
| Budgetvejledning 2021 · Instruks eksterne midler · Delegationsbestemmelse | Governing instructions. |

From **Instructions regarding external funding → Useful information**:

> **"Appointments using external funding – including working hour standards"**
> **"Working hour standards"**

⭐ A working-hour-standards page specifically in the *external funding* context. Could confirm the
per-category norms (495 / 411 / 660 / 165) directly.

---

## ⭐ 1b. Working hour standards — THREE different annual bases, for three different purposes

Verbatim from *Instructions regarding external funding → Useful information → Working hour standards*:

> "The standard number of working hours for full-time employees at AU is **1,924** per year.
> However, in connection with external projects, the following applies:
> **1,460** is the basic number of working hours used when all time registration in connection with
> the external project takes place in ProMark.
> **1,485** is the number of working hours used in connection with settlement of accounts for H2020
> projects when time registration takes place in ProMark and spreadsheets.
> **1,580** (alternatively 1,485) is the number of working hours used in connection with settlement
> of accounts for other projects when time registration in spreadsheets is required.
> For a number of external projects, other specific working hour standards may be laid down in the
> contract.
> The difference is that the number 1,924 covers **productive as well as non-productive hours**
> e.g. holiday, whereas the number 1,460/1,485/1,580 only covers **productive hours**."

### This is the most important structural finding so far

Three bases, and **they are not interchangeable**:

| Basis | Value | Purpose | Includes holiday? |
|---|---|---|---|
| **Payroll / employment** | **1.924 t/år** | AU's full-time standard (52 × 37 t). The basis for what an employee *costs*. | ✅ yes — productive *and* non-productive |
| **Workload norm (ARTS)** | **1.643 / 1.650 t/år** | The arbejdstidsaftale årsværk. Basis for teaching obligation and **Vipomatic registration**. Excludes 5 weeks holiday + 1 week særlige feriedage. | ❌ no |
| **External project accounting** | **1.460 / 1.485 / 1.580 t/år** | What you may charge and report to a funder. **Productive hours only.** Which one applies depends on the time-registration regime (ProMark vs. spreadsheets) and the funder. | ❌ no |

**Engine consequences — these are easy to get wrong and expensive when wrong:**

1. **An hourly rate derived from a salary depends on which divisor you use.** Annual cost ÷ 1.460
   is ~32% higher than annual cost ÷ 1.924. Deriving a kr/t figure without stating the basis is
   meaningless. The trace must name the divisor and why it was chosen.
2. **Vipomatic hours must come from the 1.643/1.650 basis** — never from 1.924 or 1.460. That is
   the workload norm, and it is what the institute's hour accounting is denominated in.
3. **What the funder is billed** uses the 1.460/1.485/1.580 basis, which is a *different number of
   hours for the same month of work* than what Vipomatic registers. Both are correct; they answer
   different questions. This is very likely part of why consultants find the arithmetic confusing.
4. The project-accounting basis is **selectable, not fixed** — it depends on time-registration
   regime and funder, and "other specific working hour standards may be laid down in the contract".
   So it must be an input with a documented default, not a constant.

This also **answers open question 13** (calendar salary month vs. productive hours): both exist,
they serve different purposes, and the tool must carry all three explicitly rather than picking one.

Source: AU staff portal, *Instructions regarding external funding → Useful information on external
funding → Working hour standards*. Pasted by the user 2026-08-30.

## 2. Rules extracted from the page text (verbatim source, high confidence)

### IDV pricing is legally constrained

> "Som offentlig finansieret institution er AU underlagt kravet om, at universitetet ikke må drive
> unfair priskonkurrence. Prisfastsættelsen skal ske således, at der ikke sker konkurrenceforvridning
> overfor private eller offentlige konkurrenter, og således at **alle såvel direkte som indirekte
> omkostninger dækkes**."

And, as a condition for a project to qualify as IV:

> "Prisen … skal fastsættes således, at … **de langsigtede gennemsnitsomkostninger dækkes.
> Den fastlagte overheadsats og priskalkulationsskema skal anvendes.**"

**Implications for the engine:**
- The market-floor check is not advisory — using the prescribed overheadsats and priskalkulationsskema
  is mandatory for IDV.
- "Langsigtede gennemsnitsomkostninger" (long-run average cost), not marginal cost, is the floor.
- IDV carries an explicit **overskudsgrad** (profit margin) on top of overhead. Our cost stack
  already models `margin` as a distinct layer — this confirms it is real and not speculative.

### Commercial vs. non-commercial classification drives four things we model

> "Det er vigtigt at finde ud af, hvorvidt dit projekt er en kommerciel eller ikke-kommerciel
> aktivitet, da det har indflydelse på … **beregning af overhead** · **mulighed for medfinansiering**
> · **momsforpligtelse**" (plus rights to research data and liability).

This maps almost one-to-one onto our `FundingMechanism` model. The commercial/non-commercial split
may be the *more* fundamental axis than our three named mechanisms — worth reconciling once the
Miniguide is in hand.

### There is a statutory ceiling on how much a researcher can be bought out

University Act §14(6), quoted on the Legislation page:

> "The academic staff may not for extended periods of time have imposed on them assignments that
> take up all their working hours in such a way that they are **essentially deprived of their
> freedom of research**."

**This is a legal limit on sustained 100% frikøb**, distinct from the institute-level "afdelingsleder
must approve" rule. Not a number, but a real constraint — the tool should probably warn on very long
full buy-outs rather than silently computing them. Worth asking the consultants whether this is ever
operationalised as a concrete cap.

### AU co-financing requires a research interest

> "A condition for use of ordinary funds to co-finance a grant-financed research project is that
> Aarhus University must itself have a research-related interest in taking part in the research
> project."

Decided by the dean or head of school. Relevant to the "how much comes from AU" side of the
calculator: AU cash co-financing is not freely available, and is a governance decision rather than a
budgeting lever.

---

## 3. Navigation notes

- `staff.au.dk/...` 301-redirects to `medarbejdere.au.dk/en/en/...` — both blocked to automation.
- The IV page lives at:
  `medarbejdere.au.dk/institutter/oekonomiportalen/projekthaandtering` → *Indtægtsdækket Virksomhed (IV)*
- The external-funding instructions live at:
  `medarbejdere.au.dk/en/administration/finance/kap3/instructions-regarding-external-funding`
- Both pages were revised recently (03.07.2026 and 21.08.2026), so their contents are current.
