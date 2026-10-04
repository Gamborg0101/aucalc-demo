/**
 * The frikøb calculation engine — public surface.
 *
 * Everything here is pure: no React, no Next, no I/O (ESLint-enforced). The UI
 * imports from this file and nothing deeper.
 *
 * Quick start:
 *
 *   const result = solve({
 *     asOf: '2026-01-01',
 *     category: 'lektor',
 *     variant: 'undervisning',
 *     undervisningsBasis: 'salary_scaled',
 *     monthlyCostKr: takstFor('121', 2026, 'middel')!,   // 70.000
 *     solveFor: 'months',
 *     given: { moneyKr: 210_000 },
 *   });
 *   console.log(traceToMarkdown(result.trace));
 */

// --- solving ---------------------------------------------------------------
export { solve } from './solve';
export type { Scenario, FrikoebResult, SolveTarget, CalcWarning } from './solve';

// --- conversion primitives -------------------------------------------------
export {
  hoursFromMonths,
  monthsFromRegisteredHours,
  monthsFromMoney,
  moneyFromMonths,
  priceCoefficient,
} from './convert';
export type { HoursBreakdown } from './convert';

// --- pricing ---------------------------------------------------------------
export {
  computePrice,
  directSalaryFromTotal,
  salaryGrossUpFactor,
  operatingContribution,
  checkMarketFloor,
} from './pricing';
export type { DirectCosts, PricingPolicy, PriceBreakdown, PriceWarning } from './pricing';

// --- trace -----------------------------------------------------------------
export { traceToMarkdown, TraceBuilder, da, daLoose } from './trace';
export type { CalcTrace, TraceStep, TraceSection, TraceValue } from './trace';

// --- rounding --------------------------------------------------------------
export { roundTo, ROUNDING_PROFILES, CANONICAL } from './rounding';
export type { RoundingProfile, RoundingProfileId, RoundMode } from './rounding';

// --- domain types ----------------------------------------------------------
export { DEFAULT_UNDERVISNINGS_BASIS } from './types';
export type {
  DocumentRef,
  FundingMechanism,
  FrikoebVariant,
  UndervisningsBasis,
  InstituteId,
  ISODate,
} from './types';

// --- config ----------------------------------------------------------------
export {
  AARSNORM_PERIODS,
  CATEGORY_NORMS,
  PRODUCTIVE_HOURS_BASES,
  WORKDAY_HOURS,
  selectAarsnormAt,
  selectCategoryNorm,
} from './config/norms';
export type { AarsnormPeriod, CategoryNorm, EmploymentCategory } from './config/norms';

export {
  OVERHEAD_POLICIES,
  MARGIN_POLICIES,
  MOMS_RATE,
  selectOverheadAt,
} from './config/overhead';
export type { OverheadPolicy, MarginPolicy, OverheadBase } from './config/overhead';

export {
  TAKSTKATALOG,
  KOSTPRIS_PARAMS,
  SU_SATSER,
  MAANEDENS_TIMER,
  PAYROLL_ANNUAL_HOURS,
  takstFor,
  kostprisPerHour,
  kostprisPerMonth,
  kostprisParamsFor,
  suPhdKostprisPerHour,
} from './config/kostpris';
export type { TakstRow, KostprisParams, Kvartil } from './config/kostpris';

export {
  RATE_TABLES,
  AU_CETERA_2026,
  STALE_AFTER_MONTHS,
  selectRateTable,
  guidingRate,
  isStale,
  rateCategoryFor,
} from './config/rates';
export type { RateTable, RateCategory } from './config/rates';

export { INDEXATION_POLICIES, selectIndexation, indexFactor } from './config/indexation';
export type { IndexationPolicy } from './config/indexation';

// --- multi-year timelines ----------------------------------------------------
export { buildSegments, monthsFromBudget, monthsFromRegisteredHoursTimeline, aggregateHours } from './timeline';
export type { TimelineSegment, TimelineResult } from './timeline';

// --- Princip 6: PI teaching-credit for postdoc grants captured --------------
export { computePiCredit, PI_CREDIT_RATE } from './piCredit';
export type { PiCreditInput, PiCreditResult } from './piCredit';
