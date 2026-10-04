# Grant budgeting — overhead, salary rates, co-financing

**Source:** AU staff portal, *Støtte til din forskningspraksis → Forskningsstøtte → Råd og
værktøjer til din fondsansøgning*. Revised 2026-07-03. Pasted by the user 2026-08-30.
Owned by Forskningsstøtteenheden.

---

## ⭐ Overhead for tilskudsfinansieret forskning — answered

> "Statslige fonde/bevillingsgivere såsom **Det Frie Forskningsråd giver 44% i overhead** til
> universiteter."
>
> "Overhead bliver beregnet som en **procentsats af projektets direkte udgifter** (fx løn,
> materialer, studieafgift, udlandsophold, konferencedeltagelse og publicering/formidling).
> Procentsatsen varierer fra fond til fond og kan også afhænge af, hvilken institution der skal
> administrere bevillingen. **Brug altid den procentsats, der er specificeret i fondens opslag.
> Mange private fonde giver ikke overhead.**"

AU's own worked example:

| Post | Beløb |
|---|---|
| Rotteforsøg | 50.000 |
| Biokemiske analyser | 35.000 |
| Publicering | 15.000 |
| **Direkte udgifter i alt** | **100.000** |
| Overhead (44%) | 44.000 |
| **Ansøgt beløb i alt** | **144.000** |

### ⚠️ The overhead BASE differs from IDV — this is the important part

| | Overhead rate | Applied to |
|---|---|---|
| **IDV / DR2** | 105% | **direct salary only** (0% on driftsomkostninger) |
| **Tilskudsfinansieret** | 44% (statslige), varies, often 0 for private | **all direct costs** — salary *and* materials, travel, publication… |

So the two mechanisms differ in **both** the rate and the base. A single `overhead` field applied
to a single `direct` total cannot express both. This confirms the cost-stack design, and it means
`directSalary` and `directOperating` must stay separate fields with a per-mechanism base selector.

**Also note:** overhead is set **per funder**, and *"brug altid den procentsats, der er
specificeret i fondens opslag"*. So the tool must treat it as an input with a funder catalogue,
never a fixed constant. 44% is the statslige default, not a universal one.

## ⭐ Which salary figure to budget against — answered

> "Du skal så vidt muligt bruge **faktiske lønomkostninger** i dit budget."
>
> "Søger du om lønmidler til en person, der er **ansat på AU p.t.**? → Få oplyst
> lønomkostningerne af din **forskningsrådgiver**."
>
> "Søger du om lønmidler til en **unavngiven person**? → Brug **den gennemsnitlige lønomkostning
> for en given stillingstype**. Se listen over gennemsnitlige lønomkostninger for stillingstyper
> på Aarhus Universitet. **Listen opdateres én gang årligt (april/maj).**"

This settles the design question directly: **two modes.**

1. **Named person** → the consultant obtains actual lønomkostninger. The tool takes it as input.
2. **Unnamed person** → use the average-per-stillingstype list. The tool can offer this as a
   default, clearly labelled as an average.

Health uses a separate, higher average calculation; special rules apply to ph.d. on Health.

📌 **Still to obtain:** "listen over gennemsnitlige lønomkostninger for stillingstyper". It may be
the same as the Priskalkulationsskema's Takstkatalog or a separate list — worth confirming, since
the Takstkatalog is a DR2/IV artefact and this is a grant-budgeting one.

## ⭐ Budget indexation — answered

> "**Økonomisekretariatet på Aarhus Universitet anbefaler at opregulere lønninger med 2% årligt**
> i budgetter for at tage højde for fremtidige lønstigninger."

So for *budgeting*, the recommended uplift is a flat **2% per year**. Note this is distinct from
the Takstkatalog's actual P/L-regulering rates (4,6% / 2,9% / 0% / 2,5% / 2,0% …), which record
what actually happened. Budgeting uses the 2% convention; the Takstkatalog records reality.

The tool should default multi-year budgets to 2%/year, cite this recommendation, and let it be
overridden.

## Medfinansiering is broader than the frikøb notes suggest

> "Medfinansiering betegner det økonomiske bidrag, din arbejdsplads yder til projektet. Det vil
> ofte dreje sig om: **lønmidler til projektets VIP og TAP · drift og vedligeholdelse af udstyr ·
> lokaler · softwarelicenser**"

The frikøb notes describe medfinansiering narrowly as the researcher's own *research time* in
kind. This page defines it much more broadly — salary, equipment, premises, software licences.
Both are true; they are different scopes. If the tool ever models AU's contribution as a total, it
must be clear which sense is meant.

Some funders **require** co-financing as a condition of the grant.

## Typical budget structure

VIP-lønninger · TAP-lønninger · apparatur/udstyr · drift · overhead.

VIP and TAP salaries are normally specified **per individual**. Equipment definitions vary by
funder — for DFF, equipment under 500.000 kr. counts as drift.

---

# IKK frikøb page

**Source:** IKK staff portal, *Medarbejderforhold → Ansættelsesforhold → Frikøb*.
Revised 2026-07-04 by the forskningskonsulent named in the IKK notat.

Confirms the IKK notat is current and in force:

- Samlet årlig arbejdstid **1650 timer** ekskl. ferier og fridage
- 60% undervisning / 40% forskning → **990 t/år**, **495 t/semester**
- The same three worked examples (6 md → 495 t · 1 md → 82,5 t · 4 md → 330 t)

New or reinforced:

- **"Ved ansøgning til fonde skal du som udgangspunkt søge om fuld løndækning og i videst mulig
  udstrækning søge frikøb til fulde lønmåneder."** — supports whole-month snapping as the default.
- **"Når du søger fuld løndækning/fuldt frikøb medfører det, at ydelsesforpligtelsen/
  undervisningsforpligtelsen falder tilsvarende."**
- Introduces the term **ydelsesforpligtelse**, used interchangeably with
  undervisningsforpligtelse. Worth adding to the glossary.
- Actual salary costs come from **Arts Økonomi**; the grant letter goes to your
  **projektcontroller** (the IKS notat said projektøkonom — titles differ by institute).
- Frikøb can also cover travel, publications, workshops, and DTAP/TAP costs.

📌 **Lead worth chasing: the page links "Politik for frikøb til forskning (pdf)".** A dedicated
frikøb *policy* is the most likely place for the undervisningsfrikøb price basis to be written
down. This is now the single best remaining document lead.
