/**
 * The cost stack: direct costs → overhead → margin → moms.
 *
 * The whole point of this module is that **overhead and margin have different
 * bases**, and the base differs by mechanism:
 *
 *   IDV:      overhead = 105% × directSalary          (NOT operating costs)
 *             margin   =  10% × total costs
 *             + 25% moms
 *
 *   Tilskud:  overhead =  44% × (salary + operating)
 *             no margin, no moms
 *
 * Because every layer is affine in the two direct components, the stack still
 * inverts in closed form — see `directSalaryFromTotal`. That is what keeps
 * "budget → how many months" exact rather than iterative.
 */

import { roundTo } from './rounding';
import {
  MOMS_RATE,
  selectOverheadAt,
  MARGIN_POLICIES,
  type MarginPolicy,
  type OverheadPolicy,
} from './config/overhead';
import type { FundingMechanism, ISODate } from './types';

export interface DirectCosts {
  /** Salary. The only thing IDV overhead applies to. */
  salaryKr: number;
  /** Travel, materials, publication, equipment. Grant overhead applies to these too. */
  operatingKr: number;
}

export interface PricingPolicy {
  mechanism: FundingMechanism;
  asOf: ISODate;
  /** Id from OVERHEAD_POLICIES. */
  overheadId: string;
  /** Id from MARGIN_POLICIES. Omit for anything that is not commercial IDV. */
  marginId?: string;
  /** Danish VAT. Commercial IDV only. */
  applyMoms?: boolean;
}

export interface PriceBreakdown {
  directSalaryKr: number;
  directOperatingKr: number;
  directTotalKr: number;
  overheadKr: number;
  /** Costs before margin: direct + overhead. */
  totalCostsKr: number;
  marginKr: number;
  subtotalExMomsKr: number;
  momsKr: number;
  totalIncMomsKr: number;
  /** The figure to quote. Ex moms for grants, inc moms for commercial IDV. */
  headlineKr: number;
  headlineLabel: string;
  overhead: OverheadPolicy;
  margin: MarginPolicy | null;
  warnings: PriceWarning[];
}

export interface PriceWarning {
  code:
    | 'OVERHEAD_INCLUDED_IN_RATE'
    | 'NO_OVERHEAD_REQUIRES_AGREEMENT'
    | 'MARGIN_BASE_UNCONFIRMED'
    | 'BELOW_MARKET_FLOOR';
  severity: 'info' | 'warn' | 'block';
  message: string;
}

function resolveMargin(policy: PricingPolicy): MarginPolicy | null {
  if (!policy.marginId) return null;
  const m = MARGIN_POLICIES.find((x) => x.id === policy.marginId);
  if (!m) throw new Error(`Ukendt overskudsgradpolitik: ${policy.marginId}`);
  return m;
}

/** The base an overhead rate applies to, in kroner. */
function overheadBaseKr(direct: DirectCosts, oh: OverheadPolicy): number {
  return oh.base === 'direct_salary' ? direct.salaryKr : direct.salaryKr + direct.operatingKr;
}

export function computePrice(direct: DirectCosts, policy: PricingPolicy): PriceBreakdown {
  const warnings: PriceWarning[] = [];
  const oh = selectOverheadAt(policy.overheadId, policy.asOf);
  const margin = resolveMargin(policy);

  const directTotalKr = direct.salaryKr + direct.operatingKr;

  // `included_in_rate` and `none` both contribute zero, but for different reasons,
  // and the consultant needs to know which.
  const overheadKr = oh.mode === 'markup' ? overheadBaseKr(direct, oh) * oh.rate : 0;

  if (oh.mode === 'included_in_rate') {
    warnings.push({
      code: 'OVERHEAD_INCLUDED_IN_RATE',
      severity: 'info',
      message:
        'Timesatsen inkluderer allerede overhead og administration. Der pålægges ikke ' +
        'yderligere overhead — det ville være dobbeltberegning.',
    });
  }
  if (oh.mode === 'none' && oh.rate === 0) {
    warnings.push({
      code: 'NO_OVERHEAD_REQUIRES_AGREEMENT',
      severity: 'warn',
      message:
        'Der er ikke budgetteret med overhead. Ved ansøgninger med ringe eller ingen ' +
        'overhead skal der inden indsendelse aftales med institutlederen, hvordan projektet ' +
        'bidrager til generalieudgifterne (frikøbspolitikken, princip 5).',
    });
  }

  const totalCostsKr = directTotalKr + overheadKr;

  const marginBaseKr = margin === null ? 0 : margin.base === 'total_costs' ? totalCostsKr : directTotalKr;
  const marginKr = margin === null ? 0 : marginBaseKr * margin.rate;

  if (margin !== null && margin.rate > 0) {
    warnings.push({
      code: 'MARGIN_BASE_UNCONFIRMED',
      severity: 'info',
      message:
        `Overskudsgraden er beregnet af ${
          margin.base === 'total_costs' ? 'de samlede omkostninger inkl. overhead' : 'de direkte omkostninger'
        }. Kilderne er ikke helt entydige på dette punkt — se docs/open-questions.md.`,
    });
  }

  const subtotalExMomsKr = totalCostsKr + marginKr;
  const momsKr = policy.applyMoms ? subtotalExMomsKr * MOMS_RATE : 0;
  const totalIncMomsKr = subtotalExMomsKr + momsKr;

  const inclMoms = Boolean(policy.applyMoms);

  return {
    directSalaryKr: roundTo(direct.salaryKr, 0, 'halfUp'),
    directOperatingKr: roundTo(direct.operatingKr, 0, 'halfUp'),
    directTotalKr: roundTo(directTotalKr, 0, 'halfUp'),
    overheadKr: roundTo(overheadKr, 0, 'halfUp'),
    totalCostsKr: roundTo(totalCostsKr, 0, 'halfUp'),
    marginKr: roundTo(marginKr, 0, 'halfUp'),
    subtotalExMomsKr: roundTo(subtotalExMomsKr, 0, 'halfUp'),
    momsKr: roundTo(momsKr, 0, 'halfUp'),
    totalIncMomsKr: roundTo(totalIncMomsKr, 0, 'halfUp'),
    headlineKr: roundTo(inclMoms ? totalIncMomsKr : subtotalExMomsKr, 0, 'halfUp'),
    headlineLabel: inclMoms ? 'Samlet pris inkl. moms' : 'Ansøgt beløb (ekskl. moms)',
    overhead: oh,
    margin,
    warnings,
  };
}

/**
 * The gross-up factor applied to *salary*, holding operating costs fixed.
 *
 * With operating costs held constant, total is affine in salary:
 *   total = salary × k + c
 * so the inverse is one division. This is what lets "budget → months" stay exact.
 */
export function salaryGrossUpFactor(policy: PricingPolicy): number {
  const oh = selectOverheadAt(policy.overheadId, policy.asOf);
  const margin = resolveMargin(policy);

  const ohOnSalary = oh.mode === 'markup' ? oh.rate : 0;
  let k = 1 + ohOnSalary;

  if (margin !== null) {
    k += margin.base === 'total_costs' ? margin.rate * (1 + ohOnSalary) : margin.rate;
  }
  if (policy.applyMoms) k *= 1 + MOMS_RATE;

  return k;
}

/** The part of the total that does not vary with salary. */
export function operatingContribution(operatingKr: number, policy: PricingPolicy): number {
  const oh = selectOverheadAt(policy.overheadId, policy.asOf);
  const margin = resolveMargin(policy);

  const ohOnOperating = oh.mode === 'markup' && oh.base === 'all_direct_costs' ? oh.rate : 0;
  let c = operatingKr * (1 + ohOnOperating);

  if (margin !== null) {
    c += margin.base === 'total_costs'
      ? margin.rate * operatingKr * (1 + ohOnOperating)
      : margin.rate * operatingKr;
  }
  if (policy.applyMoms) c *= 1 + MOMS_RATE;

  return c;
}

/**
 * Inverse: given a total budget and known operating costs, how much direct salary
 * does it cover? Closed form, no iteration.
 */
export function directSalaryFromTotal(
  totalKr: number,
  operatingKr: number,
  policy: PricingPolicy,
): number {
  const k = salaryGrossUpFactor(policy);
  const c = operatingContribution(operatingKr, policy);
  if (k <= 0) throw new Error('Ugyldig opskrivningsfaktor.');
  return (totalKr - c) / k;
}

/**
 * Market floor check for IDV. "AU må ikke underbyde markedet."
 *
 * A post-check, not a formula: compare the effective hourly rate against the
 * guiding table and block if it falls below.
 */
export function checkMarketFloor(
  subtotalExMomsKr: number,
  workHours: number,
  guidingRateKrPerHour: number | null,
): PriceWarning | null {
  if (guidingRateKrPerHour === null || workHours <= 0) return null;
  const effective = subtotalExMomsKr / workHours;
  if (effective >= guidingRateKrPerHour) return null;

  return {
    code: 'BELOW_MARKET_FLOOR',
    severity: 'block',
    message:
      `Den effektive timepris er ${effective.toFixed(0)} kr/t, hvilket er under den ` +
      `vejledende takst på ${guidingRateKrPerHour} kr/t. AU må ikke underbyde markedet — ` +
      'prisen skal hæves, eller en lavere markedspris skal kunne dokumenteres.',
  };
}
