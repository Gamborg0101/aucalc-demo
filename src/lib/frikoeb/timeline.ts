/**
 * Multi-year projects.
 *
 * Two things force a project to be split into segments rather than treated as one
 * lump:
 *
 *  1. **Indexation compounds**, so a month in year 3 costs more than a month in
 *     year 1. A single "months × kostpris" understates a multi-year budget.
 *  2. **Vipomatic is registered per year.** A consultant needs "82 t in 2026, 165 t
 *     in 2027", not "247 t total" — that is literally what gets typed in.
 *
 * The cost curve stays strictly increasing in months, so the inverse
 * (budget → duration) is still exact: walk the segments, close the form in the last
 * one. No iteration, and the derivation stays readable.
 */

import { hoursFromMonths, type HoursBreakdown } from './convert';
import { selectAarsnormAt, scaleNorm, WORKDAY_HOURS, type AarsnormPeriod } from './config/norms';
import { indexFactor, selectIndexation, type IndexationPolicy } from './config/indexation';
import { roundTo, type RoundingProfile } from './rounding';

export interface TimelineSegment {
  index: number;
  year: number;
  /** Months of frikøb falling in this year. May be fractional. */
  months: number;
  /** Compounded uplift applied to this year's cost. */
  indexFactor: number;
  /** Monthly cost after indexation. */
  monthlyCostKr: number;
  costKr: number;
  /** The årsnorm in force this year — it can change mid-project. Employment-fraction-scaled. */
  norm: AarsnormPeriod;
  /** Full hours breakdown for this year alone. */
  hours: HoursBreakdown;
  /** Hours to register in Vipomatic *for this year*. Same as `hours.hoursToRegister`. */
  hoursToRegister: number;
  hoursToRegisterWhole: number;
}

export interface TimelineResult {
  segments: TimelineSegment[];
  totalMonths: number;
  totalCostKr: number;
  totalHoursToRegister: number;
  indexation: IndexationPolicy;
}

/** Month index (0-based) → calendar year, given a start date. */
function yearAt(startISO: string, monthOffset: number): number {
  const d = new Date(startISO);
  return new Date(d.getFullYear(), d.getMonth() + monthOffset, 1).getFullYear();
}

/**
 * Splits `months` of frikøb starting at `startISO` into per-calendar-year segments.
 *
 * Segment boundaries are calendar years. Norm and indexation are both resolved
 * per year, so a mid-project norm revision is handled by the same machinery.
 */
export function buildSegments(
  months: number,
  startISO: string,
  baseMonthlyCostKr: number,
  share: number,
  profile: RoundingProfile,
  indexationId = 'budget-2pct',
  employmentFraction = 1,
): TimelineResult {
  if (months < 0) throw new Error('Antal måneder kan ikke være negativt.');

  const indexation = selectIndexation(indexationId);
  const baseYear = new Date(startISO).getFullYear();

  // Bucket months by calendar year, keeping fractional remainders intact.
  const byYear = new Map<number, number>();
  let remaining = months;
  let offset = 0;
  while (remaining > 1e-9) {
    const chunk = Math.min(1, remaining);
    const y = yearAt(startISO, offset);
    byYear.set(y, (byYear.get(y) ?? 0) + chunk);
    remaining -= chunk;
    offset += 1;
  }

  const segments: TimelineSegment[] = [];
  let i = 0;
  for (const [year, m] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const f = indexFactor(indexation, baseYear, year);
    const monthlyCostKr = baseMonthlyCostKr * f;
    // The norm in force that year — resolved per segment, not once for the
    // project — and scaled for beskæftigelsesgrad, same as the single-period path.
    const norm = scaleNorm(selectAarsnormAt(`${year}-06-01`), employmentFraction);
    const h = hoursFromMonths(m, norm, share, profile);

    segments.push({
      index: i++,
      year,
      months: roundTo(m, 4, 'halfUp'),
      indexFactor: roundTo(f, 6, 'halfUp'),
      monthlyCostKr: roundTo(monthlyCostKr, 0, 'halfUp'),
      costKr: roundTo(m * monthlyCostKr, 0, 'halfUp'),
      norm,
      hours: h,
      hoursToRegister: h.hoursToRegister,
      hoursToRegisterWhole: h.hoursToRegisterWhole,
    });
  }

  return {
    segments,
    totalMonths: roundTo(months, 4, 'halfUp'),
    totalCostKr: roundTo(
      segments.reduce((a, s) => a + s.costKr, 0),
      0,
      'halfUp',
    ),
    totalHoursToRegister: roundTo(
      segments.reduce((a, s) => a + s.hoursToRegister, 0),
      1,
      'halfUp',
    ),
    indexation,
  };
}

/**
 * Inverse: how many months does `budgetKr` buy, once indexation is accounted for?
 *
 * Walks year by year, consuming budget at that year's rate, and closes the form
 * inside the year the money runs out. Exact — no bisection.
 */
export function monthsFromBudget(
  budgetKr: number,
  startISO: string,
  baseMonthlyCostKr: number,
  indexationId = 'budget-2pct',
  maxYears = 25,
): number {
  if (budgetKr <= 0) return 0;
  if (baseMonthlyCostKr <= 0) throw new Error('Kostpris skal være positiv.');

  const indexation = selectIndexation(indexationId);
  const baseYear = new Date(startISO).getFullYear();
  const startMonth = new Date(startISO).getMonth();

  let remaining = budgetKr;
  let months = 0;
  let offset = 0;

  for (let guard = 0; guard < maxYears * 12; guard++) {
    const year = new Date(baseYear, startMonth + offset, 1).getFullYear();
    const perMonth = baseMonthlyCostKr * indexFactor(indexation, baseYear, year);

    // Months remaining in this calendar year from the current offset.
    const monthInYear = new Date(baseYear, startMonth + offset, 1).getMonth();
    const monthsLeftInYear = 12 - monthInYear;
    const chunkCost = perMonth * monthsLeftInYear;

    if (remaining >= chunkCost) {
      remaining -= chunkCost;
      months += monthsLeftInYear;
      offset += monthsLeftInYear;
    } else {
      // Closes here: the fractional remainder within this year.
      months += remaining / perMonth;
      return months;
    }
  }

  throw new Error(
    `Budgettet rækker ud over ${maxYears} år. Kontrollér kostprisen — det er sjældent en realistisk frikøbsperiode.`,
  );
}

/**
 * Inverse on the *hours* axis: how many months of frikøb produce exactly
 * `targetHoursRegistered` Vipomatic-timer, once a mid-project norm change is
 * accounted for?
 *
 * Same year-by-year walk as `monthsFromBudget`, but the per-year rate is
 * `annualWorkHours(year)/12 × registeredShare`, not a cost price — indexation
 * never enters here, because Vipomatic hours never depend on money (confirmed
 * by a real case, R22 in docs/open-questions.md).
 */
export function monthsFromRegisteredHoursTimeline(
  targetHoursRegistered: number,
  startISO: string,
  registeredShare: number,
  employmentFraction = 1,
  maxYears = 25,
): number {
  if (targetHoursRegistered <= 0) return 0;
  if (registeredShare <= 0) throw new Error('Andel skal være positiv.');

  const baseYear = new Date(startISO).getFullYear();
  const startMonth = new Date(startISO).getMonth();

  let remaining = targetHoursRegistered;
  let months = 0;
  let offset = 0;

  for (let guard = 0; guard < maxYears * 12; guard++) {
    const year = new Date(baseYear, startMonth + offset, 1).getFullYear();
    const norm = scaleNorm(selectAarsnormAt(`${year}-06-01`), employmentFraction);
    const perMonth = (norm.annualWorkHours / 12) * registeredShare;

    const monthInYear = new Date(baseYear, startMonth + offset, 1).getMonth();
    const monthsLeftInYear = 12 - monthInYear;
    const chunkHours = perMonth * monthsLeftInYear;

    if (remaining >= chunkHours) {
      remaining -= chunkHours;
      months += monthsLeftInYear;
      offset += monthsLeftInYear;
    } else {
      months += remaining / perMonth;
      return months;
    }
  }

  throw new Error(
    `${targetHoursRegistered} Vipomatic-timer rækker ud over ${maxYears} år. Kontrollér tallet.`,
  );
}

/**
 * Sums per-year hour breakdowns into one project-wide figure — for the
 * headline numbers, alongside the per-year segments a consultant actually
 * types into Vipomatic.
 *
 * Sums the per-year *floored* registration figures rather than flooring the
 * sum: never register more teaching hours in any single year than that
 * year's segment actually funded (same rounding-favours-the-institute rule
 * as everywhere else). `workDays` is recomputed from the summed work hours,
 * not summed per segment, to avoid compounding floor error across years.
 */
export function aggregateHours(segments: TimelineSegment[]): HoursBreakdown {
  const sum = (f: (h: HoursBreakdown) => number) => segments.reduce((a, s) => a + f(s.hours), 0);

  const workHours = roundTo(sum((h) => h.workHours), 1, 'halfUp');
  const hoursToRegister = roundTo(sum((h) => h.hoursToRegister), 1, 'halfUp');
  const hoursToRegisterWhole = sum((h) => h.hoursToRegisterWhole);

  return {
    workHours,
    workDays: roundTo(workHours / WORKDAY_HOURS, 0, 'floor'),
    teachingHours: roundTo(sum((h) => h.teachingHours), 1, 'halfUp'),
    researchHours: roundTo(sum((h) => h.researchHours), 1, 'halfUp'),
    hoursToRegister,
    hoursToRegisterWhole,
    discardedByFlooring: roundTo(hoursToRegister - hoursToRegisterWhole, 4, 'halfUp'),
  };
}
