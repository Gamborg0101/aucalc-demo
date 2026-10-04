/**
 * The conversion primitives.
 *
 * Every relation here is affine and single-degree-of-freedom, so one canonical unit
 * (FTE-months) plus closed-form inverses is enough — no numeric solver. Months is
 * the canonical unit because it is what funder applications are written in
 * ("fulde lønmåneder"), what whole-month snapping acts on, and the natural
 * segmentation unit for indexation.
 *
 * Formulas, with A = annualWorkHours, s = registeredShare, C = monthly kostpris:
 *
 *   workHours(m)      = m × A / 12
 *   teachingHours(m)  = workHours(m) × s        ← the only part Vipomatic registers
 *   researchHours(m)  = workHours(m) × (1 − s)
 *   m ← hoursRegistered = hReg × 12 / (A × s)
 *   m ← money           = beløb / (C × k)
 */

import { roundTo, type CalcBasis, type OutputRounding, type RoundingProfile } from './rounding';
import { WORKDAY_HOURS, type AarsnormPeriod } from './config/norms';
import type { UndervisningsBasis } from './types';

/**
 * Resolves the per-month hour figure a given output should be computed from.
 *
 * The canonical path derives from the årsnorm. The `published*` bases exist solely
 * to reproduce the PDFs, which computed from pre-rounded constants.
 */
function monthlyHoursFor(basis: CalcBasis, norm: AarsnormPeriod, registeredShare: number): number {
  switch (basis) {
    case 'annualExact':
      return norm.annualWorkHours / 12;
    case 'publishedMonthly':
      return norm.published.monthlyWorkHours;
    case 'publishedAnnualTeaching':
      // This basis expresses teaching hours directly, so divide out the share to
      // keep the caller's `× share` from double-counting it.
      return norm.published.annualTeachingHours / 12 / registeredShare;
  }
}

function apply(
  rawMonths: number,
  shareMultiplier: number,
  rounding: OutputRounding,
  norm: AarsnormPeriod,
  registeredShare: number,
): number {
  const monthly = monthlyHoursFor(rounding.basis, norm, registeredShare);
  return roundTo(rawMonths * monthly * shareMultiplier, rounding.dp, rounding.mode);
}

export interface HoursBreakdown {
  /** Total work hours committed to the project. */
  workHours: number;
  /** `workHours / WORKDAY_HOURS` — a scheduling convenience, not a Vipomatic input. */
  workDays: number;
  /** Uddannelse + administration. The Vipomatic figure. */
  teachingHours: number;
  /** Forskning. Never registered. */
  researchHours: number;
  /** Same as teachingHours, at Vipomatic display precision. */
  hoursToRegister: number;
  /** The integer actually typed in. Floored — never register more than was funded. */
  hoursToRegisterWhole: number;
  /** Hours discarded by that flooring, surfaced rather than silently dropped. */
  discardedByFlooring: number;
}

export function hoursFromMonths(
  months: number,
  norm: AarsnormPeriod,
  registeredShare: number,
  profile: RoundingProfile,
): HoursBreakdown {
  const o = profile.outputs;
  const s = registeredShare;

  const hoursToRegister = apply(months, s, o.hoursToRegister, norm, s);
  const whole = apply(months, s, o.hoursToRegisterWhole, norm, s);
  const workHours = apply(months, 1, o.workHours, norm, s);

  return {
    workHours,
    workDays: roundTo(workHours / WORKDAY_HOURS, 0, 'floor'),
    teachingHours: apply(months, s, o.teachingHours, norm, s),
    researchHours: apply(months, 1 - s, o.researchHours, norm, s),
    hoursToRegister,
    hoursToRegisterWhole: whole,
    discardedByFlooring: roundTo(hoursToRegister - whole, 4, 'halfUp'),
  };
}

/** Inverse of `hoursFromMonths` on the registered-hours axis. Exact, no rounding. */
export function monthsFromRegisteredHours(
  hoursRegistered: number,
  norm: AarsnormPeriod,
  registeredShare: number,
): number {
  return (hoursRegistered * 12) / (norm.annualWorkHours * registeredShare);
}

/**
 * The undervisningsfrikøb price coefficient.
 *
 * `k = 1` means a krone buys a full salary month. `k = s` (the category's registered
 * share) means it buys a month of *teaching release* at that share of the salary
 * cost — confirmed by a research consultant 2026-08-31 as the correct reading (see
 * `docs/open-questions.md` R18). Callers must still state the basis explicitly
 * rather than relying on a default baked in here — `DEFAULT_UNDERVISNINGS_BASIS`
 * in `types.ts` is the one place that default lives.
 */
export function priceCoefficient(
  variant: 'fuldt' | 'undervisning',
  basis: UndervisningsBasis | undefined,
  registeredShare: number,
): number {
  if (variant === 'fuldt') return 1;
  if (basis === undefined) {
    throw new Error(
      'undervisningsBasis skal angives ved undervisningsfrikøb — de to fortolkninger ' +
        'giver forskellige resultater. Se docs/open-questions.md R18.',
    );
  }
  return basis === 'salary_scaled' ? registeredShare : 1;
}

/** money → months. `k` from `priceCoefficient`. */
export function monthsFromMoney(amountKr: number, monthlyCostKr: number, k: number): number {
  if (monthlyCostKr <= 0) throw new Error('Kostpris skal være positiv.');
  return amountKr / (monthlyCostKr * k);
}

/** months → money. Inverse of `monthsFromMoney`. */
export function moneyFromMonths(months: number, monthlyCostKr: number, k: number): number {
  return months * monthlyCostKr * k;
}
