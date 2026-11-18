/**
 * The bidirectional solver.
 *
 * Every relation in this domain is affine and single-degree-of-freedom, so one
 * canonical unit (FTE-months) plus closed-form inverses solves all four directions.
 * No numeric solver: a bisection trace reads "I guessed 6,0001 months", and nobody
 * can put that in an email to a funder.
 *
 *   beløb ─────────┐
 *   timer ─────────┼──► toMonths() ──► months ──► fromMonths() ──► result
 *   FTE% ──────────┤
 *   måneder ───────┘
 */

import {
  hoursFromMonths,
  monthsFromMoney,
  monthsFromRegisteredHours,
  moneyFromMonths,
  priceCoefficient,
  type HoursBreakdown,
} from './convert';
import {
  selectAarsnormAt,
  selectCategoryNorm,
  scaleNorm,
  SRC_IKK_2026,
  type EmploymentCategory,
  type AarsnormPeriod,
} from './config/norms';
import {
  buildSegments,
  monthsFromBudget,
  monthsFromRegisteredHoursTimeline,
  aggregateHours,
  type TimelineResult,
} from './timeline';
import { selectIndexation } from './config/indexation';
import { CANONICAL, ROUNDING_PROFILES, roundTo, type RoundingProfileId } from './rounding';
import {
  TraceBuilder,
  da,
  daLoose,
  factor,
  hours as hoursVal,
  kr,
  krPerMonth,
  months as monthsVal,
  percent,
  type CalcTrace,
} from './trace';
import type { FrikoebVariant, ISODate, UndervisningsBasis } from './types';

export type SolveTarget = 'months' | 'money' | 'hoursRegistered';

export interface Scenario {
  asOf: ISODate;
  category: EmploymentCategory;
  variant: FrikoebVariant;
  /** Required when variant is 'undervisning'. The engine will not guess. */
  undervisningsBasis?: UndervisningsBasis;
  /** Monthly cost price. Only lektor (~50.000) is documented; everything else is an input. */
  monthlyCostKr: number;
  /**
   * Overrides the category norm. Required for categories with no fixed norm
   * (postdoc, ph.d., DVIP) — see arbejdstidsaftale Bilag B 13.2.
   */
  registeredShareOverride?: number;
  solveFor: SolveTarget;
  /**
   * `workHours` is the frikøb's total arbejdstid — research and teaching together.
   * Only `andel` of it is registered in Vipomatic (60% for lektor/adjunkt/professor);
   * the rest is research time that is never registered.
   */
  given: Partial<{ months: number; moneyKr: number; hoursRegistered: number; workHours: number }>;
  profile?: RoundingProfileId;
  snapToWholeMonths?: 'off' | 'down';
  /**
   * Fraction of full-time employment, e.g. 0,81 for a 30-timers uge on a
   * 37-timers fuldtidsnorm. Scales the effective annual work hours — and the
   * semester teaching norm used in the residual-obligation check — proportionally.
   * The registered share (teaching vs. research split) is unaffected; only the
   * total hours scale. Defaults to 1 (fuldtid). Must be in (0, 1].
   */
  employmentFraction?: number;
  /**
   * Enables multi-year segmentation. When present, months are split into
   * per-calendar-year segments — indexed cost and per-year Vipomatic hours,
   * via `timeline.ts` — instead of one flat calculation on a single norm.
   *
   * Omit for a project that starts and ends inside one calendar year: the
   * result is identical either way (a single segment with an index factor of
   * 1), so this exists to surface the year-by-year breakdown a consultant
   * actually needs to type into Vipomatic, not to change short-project output.
   */
  timeline?: { indexationId?: string };
}

export interface CalcWarning {
  code:
    | 'NO_FIXED_NORM_FOR_CATEGORY'
    | 'DEFAULT_KOSTPRIS_USED'
    | 'NOT_WHOLE_SALARY_MONTHS';
  severity: 'info' | 'warn' | 'block';
  message: string;
}

/** One semester of the frikøb, assuming it starts at a semester start. */
export interface SemesterSlot {
  /** 1-based. */
  index: number;
  /** Frikøb months falling in this semester, 0 < months ≤ 6. */
  months: number;
  /** Whole Vipomatic hours credited in this semester. All slots sum to `hours.hoursToRegisterWhole`. */
  hours: number;
  /** The semester's teaching norm (495 t on the 2024+ basis, scaled for part-time). */
  normHours: number;
  /** Teaching the researcher still owes in this semester: normHours − hours, never negative. */
  remainingHours: number;
  /** months / 6 — how full the semester is, 0–1. */
  fill: number;
}

export interface FrikoebResult {
  months: number;
  monthsSnapped: number | null;
  hours: HoursBreakdown;
  /** Direct salary cost — the frikøb figure itself. */
  moneyKr: number;
  /**
   * What the researcher still owes the institute in the affected semester:
   * semesternorm − credited hours. All three IKK policy examples state this.
   */
  residual: {
    semesterNormHours: number;
    creditedThisSemesterHours: number;
    remainingObligationHours: number;
  };
  /**
   * The frikøb laid out semester by semester: full semesters first, the last one
   * possibly partial. Assumes the frikøb starts at a semester start.
   */
  semesters: SemesterSlot[];
  registeredShare: number;
  norm: AarsnormPeriod;
  /** Present only when `scenario.timeline` was supplied — the per-year segments. */
  timeline: TimelineResult | null;
  warnings: CalcWarning[];
  trace: CalcTrace;
}

function resolveShare(s: Scenario, warnings: CalcWarning[]): number {
  if (s.registeredShareOverride !== undefined) return s.registeredShareOverride;

  const norm = selectCategoryNorm(s.category);
  if (norm.registeredShare === null) {
    // Arbejdstidsaftale Bilag B 13.2 gives postdoc/ph.d./DVIP no fixed norm.
    // Defaulting to 0,6 here would produce a confident wrong number — the exact
    // failure this project's rules exist to prevent.
    throw new Error(
      `${norm.label} har ingen fast timenorm — den aftales individuelt med institutlederen ` +
        `(arbejdstidsaftalen, Bilag B 13.2). Angiv registeredShareOverride.`,
    );
  }
  void warnings;
  return norm.registeredShare;
}

export function solve(scenario: Scenario): FrikoebResult {
  const warnings: CalcWarning[] = [];
  const profileId = scenario.profile ?? 'canonical';
  const profile = ROUNDING_PROFILES[profileId] ?? CANONICAL;
  const t = new TraceBuilder(profileId);

  const fullTimeNorm = selectAarsnormAt(scenario.asOf);
  const employmentFraction = scenario.employmentFraction ?? 1;
  if (employmentFraction <= 0 || employmentFraction > 1) {
    throw new Error('Beskæftigelsesgrad skal være over 0% og højst 100%.');
  }
  // Part-time scales the person's total hours down proportionally — it does
  // not change the teaching/research split, which stays whatever the
  // category norm says. Scaling `published` too matters: the residual
  // obligation below reads `norm.published.semesterTeachingHours` directly,
  // and a part-time semesternorm is not the full-time figure.
  const norm: AarsnormPeriod = scaleNorm(fullTimeNorm, employmentFraction);
  const share = resolveShare(scenario, warnings);
  const categoryNorm = selectCategoryNorm(scenario.category);
  const k = priceCoefficient(scenario.variant, scenario.undervisningsBasis, share);

  const timelineRequested = scenario.timeline !== undefined;
  const indexationId = scenario.timeline?.indexationId ?? 'budget-2pct';
  const indexation = timelineRequested ? selectIndexation(indexationId) : null;

  // --- forudsætninger ---
  t.section('forudsaetninger');
  t.constant(
    'const.aarsnorm',
    employmentFraction === 1 ? 'Årsnorm' : 'Årsnorm (fuldtid)',
    hoursVal(fullTimeNorm.annualWorkHours, 0),
    fullTimeNorm.source,
  );
  if (employmentFraction !== 1) {
    t.step({
      id: 'forudsaetninger.beskaeftigelsesgrad',
      kind: 'input',
      label: 'Beskæftigelsesgrad',
      inputs: [],
      output: percent(employmentFraction * 100),
    });
    t.step({
      id: 'forudsaetninger.aarsnorm.deltid',
      kind: 'derived',
      label: 'Effektiv årsnorm',
      formula: 'årsnorm (fuldtid) × beskæftigelsesgrad',
      substituted: `${da(fullTimeNorm.annualWorkHours)} t × ${daLoose(employmentFraction)}`,
      inputs: [
        { label: 'Årsnorm (fuldtid)', value: hoursVal(fullTimeNorm.annualWorkHours, 0), ref: 'const.aarsnorm' },
        {
          label: 'Beskæftigelsesgrad',
          value: percent(employmentFraction * 100),
          ref: 'forudsaetninger.beskaeftigelsesgrad',
        },
      ],
      output: hoursVal(norm.annualWorkHours, 0),
    });
  }
  t.constant(
    'const.andel',
    `Andel registreret i Vipomatic (${categoryNorm.label})`,
    percent(share * 100),
    categoryNorm.source,
    categoryNorm.note,
  );

  // --- tid: everything funnels through months ---
  t.section('tid');
  t.input('input.kostpris', 'Månedlig kostpris', krPerMonth(scenario.monthlyCostKr));
  if (k !== 1) {
    t.step({
      id: 'assumption.uf.basis',
      kind: 'assumption',
      label: 'Grundlag for undervisningsfrikøb',
      inputs: [],
      output: factor(k),
      note: 'Instituttet finansierer selv resten — bevillingen rækker derfor længere.',
    });
  }

  let months: number;
  let monthsSourceStepId: string;

  switch (scenario.solveFor) {
    case 'months': {
      if (scenario.given.moneyKr !== undefined) {
        const amount = scenario.given.moneyKr;
        t.input('input.beloeb', 'Eksternt bidrag', kr(amount));
        monthsSourceStepId = 'tid.maaneder.fraBeloeb';
        months = t.step({
          id: 'tid.maaneder.fraBeloeb',
          kind: 'derived',
          label: 'Bevilling omregnet til lønmåneder',
          formula: timelineRequested
            ? 'beløb fordelt år for år mod (månedlig kostpris × k), indekseret pr. år'
            : 'beløb ÷ (månedlig kostpris × k)',
          substituted: timelineRequested
            ? `${da(amount)} kr fra ${scenario.asOf}, ${indexation!.label}`
            : `${da(amount)} kr ÷ (${da(scenario.monthlyCostKr)} kr/md × ${daLoose(k)})`,
          inputs: [
            { label: 'Eksternt bidrag', value: kr(amount), ref: 'input.beloeb' },
            { label: 'Månedlig kostpris', value: krPerMonth(scenario.monthlyCostKr), ref: 'input.kostpris' },
          ],
          output: monthsVal(
            timelineRequested
              ? monthsFromBudget(amount, scenario.asOf, scenario.monthlyCostKr * k, indexationId)
              : monthsFromMoney(amount, scenario.monthlyCostKr, k),
          ),
          sourceRef: timelineRequested ? indexation!.source : undefined,
          note: timelineRequested
            ? 'Se den flerårige fordeling nedenfor for beløb og timer år for år.'
            : undefined,
        });
      } else if (scenario.given.hoursRegistered !== undefined) {
        const h = scenario.given.hoursRegistered;
        t.input('input.timer', 'Timer i Vipomatic', hoursVal(h));
        monthsSourceStepId = 'tid.maaneder.fraTimer';
        months = t.step({
          id: 'tid.maaneder.fraTimer',
          kind: 'derived',
          label: 'Vipomatic-timer omregnet til lønmåneder',
          formula: timelineRequested
            ? 'timer fordelt år for år mod (årsnorm × andel), år for år'
            : 'timer × 12 ÷ (årsnorm × andel)',
          substituted: timelineRequested
            ? `${daLoose(h)} t fra ${scenario.asOf}`
            : `${daLoose(h)} t × 12 ÷ (${da(norm.annualWorkHours)} t × ${daLoose(share)})`,
          inputs: [{ label: 'Timer i Vipomatic', value: hoursVal(h), ref: 'input.timer' }],
          output: monthsVal(
            timelineRequested
              ? monthsFromRegisteredHoursTimeline(h, scenario.asOf, share, employmentFraction)
              : monthsFromRegisteredHours(h, norm, share),
          ),
          note: timelineRequested
            ? 'Se den flerårige fordeling nedenfor for beløb og timer år for år.'
            : undefined,
        });
      } else if (scenario.given.workHours !== undefined) {
        const w = scenario.given.workHours;
        t.input('input.arbejdstimer', 'Samlet arbejdstid', hoursVal(w));
        monthsSourceStepId = 'tid.maaneder.fraArbejdstimer';
        months = t.step({
          id: 'tid.maaneder.fraArbejdstimer',
          kind: 'derived',
          label: 'Arbejdstid omregnet til lønmåneder',
          formula: timelineRequested ? 'arbejdstimer fordelt år for år mod årsnormen' : 'arbejdstimer × 12 ÷ årsnorm',
          substituted: timelineRequested
            ? `${daLoose(w)} t fra ${scenario.asOf}`
            : `${daLoose(w)} t × 12 ÷ ${da(norm.annualWorkHours)} t`,
          inputs: [{ label: 'Samlet arbejdstid', value: hoursVal(w), ref: 'input.arbejdstimer' }],
          // A share of 1 turns the registered-hours inverse into the work-hours inverse.
          output: monthsVal(
            timelineRequested
              ? monthsFromRegisteredHoursTimeline(w, scenario.asOf, 1, employmentFraction)
              : monthsFromRegisteredHours(w, norm, 1),
          ),
          note: timelineRequested
            ? 'Se den flerårige fordeling nedenfor for beløb og timer år for år.'
            : undefined,
        });
      } else {
        throw new Error('solveFor "months" kræver moneyKr, hoursRegistered eller workHours.');
      }
      break;
    }
    case 'money':
    case 'hoursRegistered': {
      if (scenario.given.months === undefined) {
        throw new Error(`solveFor "${scenario.solveFor}" kræver months.`);
      }
      monthsSourceStepId = 'input.maaneder';
      months = t.input('input.maaneder', 'Ønsket frikøb', monthsVal(scenario.given.months));
      break;
    }
  }

  // --- optional whole-month snapping, always visible ---
  let monthsSnapped: number | null = null;
  if (scenario.snapToWholeMonths === 'down' && !Number.isInteger(months)) {
    const before = months;
    monthsSnapped = Math.floor(months);
    const residual = moneyFromMonths(before - monthsSnapped, scenario.monthlyCostKr, k);
    t.step({
      id: 'tid.maaneder.afrundet',
      kind: 'rounding',
      label: 'Afrundet til hele lønmåneder',
      inputs: [{ label: 'Før afrunding', value: monthsVal(before) }],
      output: monthsVal(monthsSnapped),
      rounding: { mode: 'floor', dp: 0, before, after: monthsSnapped, discarded: before - monthsSnapped },
      note:
        `Restbeløb ${da(Math.round(residual))} kr indgår ikke i frikøbet. ` +
        'Instituttet anbefaler at søge til fulde lønmåneder.',
    });
    months = monthsSnapped;
    monthsSourceStepId = 'tid.maaneder.afrundet';
  } else if (!Number.isInteger(months)) {
    warnings.push({
      code: 'NOT_WHOLE_SALARY_MONTHS',
      severity: 'info',
      message: 'Resultatet er ikke hele lønmåneder. Instituttet anbefaler at søge fuldt frikøb til fulde lønmåneder.',
    });
  }

  // --- multi-year segmentation, when requested ------------------------------
  const timelineResult: TimelineResult | null = timelineRequested
    ? buildSegments(months, scenario.asOf, scenario.monthlyCostKr * k, share, profile, indexationId, employmentFraction)
    : null;

  // --- hours ---
  const h = timelineResult ? aggregateHours(timelineResult.segments) : hoursFromMonths(months, norm, share, profile);

  t.section('vipomatic');
  t.step({
    id: 'vipomatic.arbejdstimer',
    kind: 'derived',
    label: 'Samlet arbejdstid i frikøbet',
    formula: timelineResult ? undefined : 'måneder × årsnorm ÷ 12',
    substituted: timelineResult ? undefined : `${daLoose(months)} md × ${da(norm.annualWorkHours)} t ÷ 12`,
    inputs: [{ label: 'Måneder', value: monthsVal(months) }],
    output: hoursVal(h.workHours),
    note: timelineResult
      ? 'Summeret på tværs af årene — årsnormen kan ændre sig undervejs. Se den flerårige fordeling nedenfor.'
      : undefined,
  });
  t.step({
    id: 'vipomatic.timer',
    kind: 'rounding',
    label: 'Timer til registrering i Vipomatic',
    formula: 'arbejdstimer × andel, nedrundet',
    substituted: `${daLoose(h.workHours)} t × ${daLoose(share)} = ${daLoose(h.hoursToRegister)} t`,
    inputs: [{ label: 'Arbejdstimer', value: hoursVal(h.workHours), ref: 'vipomatic.arbejdstimer' }],
    output: hoursVal(h.hoursToRegisterWhole, 0),
    rounding: {
      mode: 'floor',
      dp: 0,
      before: h.hoursToRegister,
      after: h.hoursToRegisterWhole,
      discarded: h.discardedByFlooring,
    },
    sourceRef: { ...SRC_IKK_2026, locator: 'eksemplet 137,5 × 0,6 = 82,5 timer' },
    note: 'Vipomatic runder ikke manuelt indtastede tal — skriv dette tal ind.',
  });
  t.step({
    id: 'vipomatic.forskningstimer',
    kind: 'derived',
    label: 'Forskningstid i projektet (registreres ikke)',
    formula: 'arbejdstimer × (1 − andel)',
    inputs: [{ label: 'Arbejdstimer', value: hoursVal(h.workHours), ref: 'vipomatic.arbejdstimer' }],
    output: hoursVal(h.researchHours),
    note: 'Registreres ikke nogen steder — forskeren bruger tiden på projektet.',
  });

  // --- money ---
  t.section('oekonomi');
  const givenMoneyDirectly = scenario.solveFor === 'months' && scenario.given.moneyKr !== undefined;
  const rawMoney = givenMoneyDirectly
    ? scenario.given.moneyKr!
    : timelineResult
      ? timelineResult.totalCostKr
      : moneyFromMonths(months, scenario.monthlyCostKr, k);
  const moneyKr = roundTo(rawMoney, profile.outputs.money.dp, profile.outputs.money.mode);

  t.step({
    id: 'oekonomi.beloeb',
    kind: 'derived',
    label: scenario.solveFor === 'money' ? 'Beløb der skal budgetteres' : 'Eksternt bidrag',
    formula: timelineResult && !givenMoneyDirectly ? undefined : 'måneder × månedlig kostpris × k',
    substituted:
      timelineResult && !givenMoneyDirectly
        ? undefined
        : `${daLoose(months)} md × ${da(scenario.monthlyCostKr)} kr/md × ${daLoose(k)}`,
    inputs: [
      { label: 'Måneder', value: monthsVal(months) },
      { label: 'Månedlig kostpris', value: krPerMonth(scenario.monthlyCostKr), ref: 'input.kostpris' },
    ],
    output: kr(moneyKr),
    note:
      timelineResult && !givenMoneyDirectly
        ? 'Summeret på tværs af årene, inkl. prisregulering. Se den flerårige fordeling nedenfor.'
        : undefined,
  });

  // --- multi-year breakdown, one row per calendar year ----------------------
  if (timelineResult) {
    t.section('flerarig');
    for (const seg of timelineResult.segments) {
      t.step({
        id: `flerarig.aar.${seg.year}`,
        kind: 'derived',
        label: `${seg.year}`,
        formula: 'måneder dette år × kostpris dette år (indekseret)',
        substituted: `${daLoose(seg.months)} md × ${da(seg.monthlyCostKr)} kr/md`,
        inputs: [],
        output: kr(seg.costKr),
        sourceRef: seg.indexFactor !== 1 ? indexation!.source : undefined,
        note:
          (seg.indexFactor !== 1
            ? `Indeksfaktor ${daLoose(seg.indexFactor)} ift. startåret (${indexation!.label}). `
            : '') + `${da(seg.hoursToRegisterWhole, 0)} t til registrering i Vipomatic dette år.`,
      });
    }
    t.step({
      id: 'flerarig.total',
      kind: 'derived',
      label: 'Samlet, alle år',
      inputs: [],
      output: kr(timelineResult.totalCostKr),
      note:
        `${daLoose(timelineResult.totalMonths)} md fordelt over ${timelineResult.segments.length} ` +
        `kalenderår, ${da(timelineResult.totalHoursToRegister, 1)} t til registrering i alt ` +
        '(se årene ovenfor for fordelingen).',
    });
  }

  // --- residual obligation --------------------------------------------------
  // The IKK frikøbspolitik states this in all three of its examples, so it is
  // evidently what consultants actually need to know: what does the researcher
  // still owe the department this semester?
  const semesterNormHours = norm.published.semesterTeachingHours;
  const monthsThisSemester = Math.min(months, 6);
  const creditedThisSemesterHours = roundTo(
    hoursFromMonths(monthsThisSemester, norm, share, profile).hoursToRegister,
    1,
    'halfUp',
  );
  // Floors, per the policy: 493/2 is printed as 246, not 247 — the researcher is
  // credited the smaller figure and owes the larger remainder.
  const remainingObligationHours = Math.max(
    0,
    roundTo(semesterNormHours - Math.floor(creditedThisSemesterHours), 0, 'floor'),
  );

  t.section('kontrol');
  t.step({
    id: 'kontrol.restforpligtelse',
    kind: 'derived',
    label: 'Restforpligtelse i semestret',
    formula: 'semesternorm − godskrevne timer',
    substituted: `${da(semesterNormHours)} t − ${da(Math.floor(creditedThisSemesterHours))} t`,
    inputs: [
      { label: 'Semesternorm', value: hoursVal(semesterNormHours, 0) },
      { label: 'Godskrevet', value: hoursVal(creditedThisSemesterHours) },
    ],
    output: hoursVal(remainingObligationHours, 0),
    note: 'Forskeren skal fortsat yde instituttet disse timer i det pågældende semester.',
  });

  // --- semester by semester ------------------------------------------------
  // Each semester's hours are cut from the cumulative floored total —
  // floor(H(slut)) − floor(H(start)) — so the slots always sum to exactly the
  // Vipomatic figure, and no semester is credited more than was funded.
  const SEMESTER_MONTHS = 6;
  const semesters: SemesterSlot[] = [];
  const wholeHoursAt = (m: number) => (m <= 0 ? 0 : hoursFromMonths(m, norm, share, profile).hoursToRegisterWhole);
  // The epsilon keeps 12,0000000001 md from opening a third, empty semester.
  const semesterCount = Math.ceil(months / SEMESTER_MONTHS - 1e-9);
  for (let i = 0; i < semesterCount; i++) {
    const start = i * SEMESTER_MONTHS;
    const end = Math.min(months, start + SEMESTER_MONTHS);
    const hoursThis = i === semesterCount - 1 && !timelineResult
      ? h.hoursToRegisterWhole - wholeHoursAt(start)
      : wholeHoursAt(end) - wholeHoursAt(start);
    semesters.push({
      index: i + 1,
      months: end - start,
      hours: hoursThis,
      normHours: semesterNormHours,
      remainingHours: Math.max(0, roundTo(semesterNormHours - hoursThis, 0, 'floor')),
      fill: Math.min(1, (end - start) / SEMESTER_MONTHS),
    });
  }
  if (semesters.length > 0) {
    const full = semesters.filter((x) => x.fill >= 1);
    const last = semesters[semesters.length - 1];
    const partial = last.fill < 1 ? last : null;
    t.step({
      id: 'kontrol.semestre',
      kind: 'derived',
      label: 'Fordeling på semestre',
      formula: 'fulde semestre à 6 md + evt. et delvist semester',
      substituted:
        `${full.length} × ${da(full[0]?.hours ?? semesterNormHours, 0)} t` +
        (partial ? ` + ${da(partial.hours, 0)} t (${daLoose(partial.months)} md)` : ''),
      inputs: [{ label: 'Måneder', value: monthsVal(months) }],
      output: hoursVal(semesters.reduce((sum, x) => sum + x.hours, 0), 0),
      note:
        'Antager at frikøbet starter ved et semesterstart.' +
        (partial
          ? ` I det sidste semester skal forskeren fortsat yde ${da(partial.remainingHours, 0)} t.`
          : ''),
    });
  }

  t.bind('months', monthsSourceStepId);
  t.bind('hours.workHours', 'vipomatic.arbejdstimer');
  t.bind('hours.workDays', 'vipomatic.arbejdstimer');
  t.bind('hours.hoursToRegister', 'vipomatic.timer');
  t.bind('hours.hoursToRegisterWhole', 'vipomatic.timer');
  t.bind('hours.researchHours', 'vipomatic.forskningstimer');
  t.bind('moneyKr', 'oekonomi.beloeb');

  return {
    months,
    monthsSnapped,
    hours: h,
    moneyKr,
    residual: { semesterNormHours, creditedThisSemesterHours, remainingObligationHours },
    semesters,
    registeredShare: share,
    norm,
    timeline: timelineResult,
    warnings,
    trace: t.build(),
  };
}
