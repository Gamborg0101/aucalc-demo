/**
 * Bridges the form's UI state to `solve()`.
 *
 * `solve()` always computes all three of {months, moneyKr, hours} regardless
 * of `solveFor` — that flag only picks which one is treated as the given
 * input. So the form asks one question, "what do you already know?", rather
 * than "what should be computed" followed by "out of what": `knownField`
 * is the one thing the consultant actually has a number for; `solveFor` is
 * derived from it, never asked directly.
 *
 * The one bit of arithmetic that isn't a straight pass-through is frikøbsprocent →
 * months (see `docs/STATUS.md` — `solve()` has three real axes; frikøbsprocent is a
 * unit for entering måneder, matching how the IKK politik itself phrases some
 * scenarios ("halvt frikøb i to semestre") — not a fourth axis the engine owns.
 * The other is beskæftigelsesgrad → employmentFraction, which can be entered as a
 * percent or as weekly hours against `FULL_TIME_WEEKLY_HOURS`.
 */
import {
  solve,
  selectCategoryNorm,
  DEFAULT_UNDERVISNINGS_BASIS,
  type EmploymentCategory,
  type FrikoebVariant,
  type UndervisningsBasis,
  type FundingMechanism,
  type Scenario,
  type FrikoebResult,
} from '@/lib/frikoeb';

export type KnownField = 'moneyKr' | 'months' | 'hoursRegistered';

/** Standard Danish full-time work week — the reference for Beskæftigelsesgrad. */
export const FULL_TIME_WEEKLY_HOURS = 37;

export interface FormState {
  asOf: string;
  category: EmploymentCategory;
  variant: FrikoebVariant;
  undervisningsBasis: UndervisningsBasis;
  monthlyCostKr: string;
  /** Percent, e.g. "20". Only used when the category has no fixed norm. */
  registeredShareOverride: string;
  /** The one quantity the consultant already has a number for. */
  knownField: KnownField;
  moneyKr: string;
  hoursRegistered: string;
  /** Only used when `knownField === 'months'`. */
  months: string;
  monthsEntryMode: 'months' | 'fte';
  fteShare: string;
  varighedMonths: string;
  snapToWholeMonths: boolean;
  beskaeftigelsesgradEntryMode: 'percent' | 'weeklyHours';
  /** Percent, e.g. "81". Only used when `beskaeftigelsesgradEntryMode === 'percent'`. Default "100". */
  beskaeftigelsesgrad: string;
  /** E.g. "30" for a 30-timers uge. Only used when entry mode is 'weeklyHours'. */
  weeklyHours: string;
  /**
   * Off by default — a plain frikøb calculation ("how many months does this
   * grant buy") already treats the funder's beløb as the salary cost. Turn on
   * only when the beløb itself needs to be derived through overhead/margin/moms
   * — e.g. quoting an IDV price to a company.
   */
  pricingEnabled: boolean;
  mechanism: FundingMechanism;
  /** Id from OVERHEAD_POLICIES. */
  overheadId: string;
  /** Id from MARGIN_POLICIES, or '' for none. */
  marginId: string;
  applyMoms: boolean;
  /** Travel, materials, publication. Kr, digits only like other Kr fields. */
  operatingKr: string;
  /** Id from RATE_TABLES, or '' to skip the market-floor check. */
  marketFloorTableId: string;
}

export const DEFAULT_FORM: FormState = {
  asOf: new Date().toISOString().slice(0, 10),
  category: 'lektor',
  variant: 'undervisning',
  undervisningsBasis: DEFAULT_UNDERVISNINGS_BASIS,
  monthlyCostKr: '70000',
  registeredShareOverride: '',
  knownField: 'moneyKr',
  moneyKr: '210000',
  hoursRegistered: '',
  months: '',
  monthsEntryMode: 'months',
  fteShare: '',
  varighedMonths: '6',
  snapToWholeMonths: false,
  beskaeftigelsesgradEntryMode: 'percent',
  beskaeftigelsesgrad: '100',
  weeklyHours: String(FULL_TIME_WEEKLY_HOURS),
  pricingEnabled: false,
  mechanism: 'tilskudsfinansieret',
  overheadId: 'tilskud-44',
  marginId: '',
  applyMoms: false,
  operatingKr: '',
  marketFloorTableId: '',
};

/** Short keys keep the shareable link tidy. */
const QUERY_KEYS = {
  asOf: 'd',
  category: 'cat',
  variant: 'v',
  undervisningsBasis: 'ub',
  monthlyCostKr: 'kp',
  registeredShareOverride: 'so',
  knownField: 'kf',
  moneyKr: 'm',
  hoursRegistered: 'h',
  months: 'md',
  monthsEntryMode: 'me',
  fteShare: 'fte',
  varighedMonths: 'var',
  snapToWholeMonths: 'snap',
  beskaeftigelsesgradEntryMode: 'bgm',
  beskaeftigelsesgrad: 'bg',
  weeklyHours: 'wh',
  pricingEnabled: 'pe',
  mechanism: 'mech',
  overheadId: 'oh',
  marginId: 'mg',
  applyMoms: 'moms',
  operatingKr: 'op',
  marketFloorTableId: 'mft',
} as const;

/** Serializes only the fields relevant to the current mode — no dead params. */
export function formToQueryString(form: FormState): string {
  const p = new URLSearchParams();
  const k = QUERY_KEYS;

  p.set(k.asOf, form.asOf);
  p.set(k.category, form.category);
  p.set(k.variant, form.variant);
  if (form.variant === 'undervisning') p.set(k.undervisningsBasis, form.undervisningsBasis);
  p.set(k.monthlyCostKr, form.monthlyCostKr);
  if (form.registeredShareOverride) p.set(k.registeredShareOverride, form.registeredShareOverride);
  p.set(k.knownField, form.knownField);

  if (form.knownField === 'moneyKr') {
    p.set(k.moneyKr, form.moneyKr);
  } else if (form.knownField === 'hoursRegistered') {
    p.set(k.hoursRegistered, form.hoursRegistered);
  } else {
    p.set(k.monthsEntryMode, form.monthsEntryMode);
    if (form.monthsEntryMode === 'fte') {
      p.set(k.fteShare, form.fteShare);
      p.set(k.varighedMonths, form.varighedMonths);
    } else {
      p.set(k.months, form.months);
    }
  }

  if (form.snapToWholeMonths) p.set(k.snapToWholeMonths, '1');
  if (form.beskaeftigelsesgradEntryMode === 'weeklyHours') {
    p.set(k.beskaeftigelsesgradEntryMode, 'weeklyHours');
    p.set(k.weeklyHours, form.weeklyHours);
  } else if (form.beskaeftigelsesgrad !== DEFAULT_FORM.beskaeftigelsesgrad) {
    p.set(k.beskaeftigelsesgrad, form.beskaeftigelsesgrad);
  }

  if (form.pricingEnabled) {
    p.set(k.pricingEnabled, '1');
    p.set(k.mechanism, form.mechanism);
    p.set(k.overheadId, form.overheadId);
    if (form.marginId) p.set(k.marginId, form.marginId);
    if (form.applyMoms) p.set(k.applyMoms, '1');
    if (form.operatingKr) p.set(k.operatingKr, form.operatingKr);
    if (form.marketFloorTableId) p.set(k.marketFloorTableId, form.marketFloorTableId);
  }
  return p.toString();
}

/** Inverse of `formToQueryString`. Missing fields fall back to `DEFAULT_FORM`. */
export function formFromQueryString(queryString: string): FormState {
  const p = new URLSearchParams(queryString);
  const k = QUERY_KEYS;
  const str = (key: string, fallback: string) => p.get(key) ?? fallback;

  if ([...p.keys()].length === 0) return DEFAULT_FORM;

  return {
    asOf: str(k.asOf, DEFAULT_FORM.asOf),
    category: str(k.category, DEFAULT_FORM.category) as EmploymentCategory,
    variant: str(k.variant, DEFAULT_FORM.variant) as FrikoebVariant,
    undervisningsBasis: str(k.undervisningsBasis, DEFAULT_FORM.undervisningsBasis) as UndervisningsBasis,
    monthlyCostKr: str(k.monthlyCostKr, DEFAULT_FORM.monthlyCostKr),
    registeredShareOverride: str(k.registeredShareOverride, DEFAULT_FORM.registeredShareOverride),
    knownField: str(k.knownField, DEFAULT_FORM.knownField) as KnownField,
    moneyKr: str(k.moneyKr, DEFAULT_FORM.moneyKr),
    hoursRegistered: str(k.hoursRegistered, DEFAULT_FORM.hoursRegistered),
    months: str(k.months, DEFAULT_FORM.months),
    monthsEntryMode: str(k.monthsEntryMode, DEFAULT_FORM.monthsEntryMode) as FormState['monthsEntryMode'],
    fteShare: str(k.fteShare, DEFAULT_FORM.fteShare),
    varighedMonths: str(k.varighedMonths, DEFAULT_FORM.varighedMonths),
    snapToWholeMonths: p.get(k.snapToWholeMonths) === '1',
    beskaeftigelsesgradEntryMode: str(
      k.beskaeftigelsesgradEntryMode,
      DEFAULT_FORM.beskaeftigelsesgradEntryMode,
    ) as FormState['beskaeftigelsesgradEntryMode'],
    beskaeftigelsesgrad: str(k.beskaeftigelsesgrad, DEFAULT_FORM.beskaeftigelsesgrad),
    weeklyHours: str(k.weeklyHours, DEFAULT_FORM.weeklyHours),
    pricingEnabled: p.get(k.pricingEnabled) === '1',
    mechanism: str(k.mechanism, DEFAULT_FORM.mechanism) as FundingMechanism,
    overheadId: str(k.overheadId, DEFAULT_FORM.overheadId),
    marginId: str(k.marginId, DEFAULT_FORM.marginId),
    applyMoms: p.get(k.applyMoms) === '1',
    operatingKr: str(k.operatingKr, DEFAULT_FORM.operatingKr),
    marketFloorTableId: str(k.marketFloorTableId, DEFAULT_FORM.marketFloorTableId),
  };
}

export type Outcome = { result: FrikoebResult; error?: undefined } | { result?: undefined; error: string };

function toNumber(raw: string): number | null {
  if (raw.trim() === '') return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

export function computeOutcome(form: FormState): Outcome {
  const monthlyCostKr = toNumber(form.monthlyCostKr);
  if (monthlyCostKr === null || monthlyCostKr <= 0) {
    return { error: 'Angiv en gyldig månedlig kostpris (større end 0).' };
  }

  let beskaeftigelsesgradPct: number | null;
  if (form.beskaeftigelsesgradEntryMode === 'weeklyHours') {
    const wh = toNumber(form.weeklyHours);
    if (wh === null || wh <= 0 || wh > FULL_TIME_WEEKLY_HOURS) {
      return { error: `Angiv et gyldigt ugentligt timetal (over 0, højst ${FULL_TIME_WEEKLY_HOURS}).` };
    }
    beskaeftigelsesgradPct = (wh / FULL_TIME_WEEKLY_HOURS) * 100;
  } else {
    beskaeftigelsesgradPct = toNumber(form.beskaeftigelsesgrad);
    if (beskaeftigelsesgradPct === null || beskaeftigelsesgradPct <= 0 || beskaeftigelsesgradPct > 100) {
      return { error: 'Angiv en gyldig beskæftigelsesgrad (over 0%, højst 100%).' };
    }
  }

  const norm = selectCategoryNorm(form.category);
  let registeredShareOverride: number | undefined;
  if (norm.registeredShare === null) {
    const pct = toNumber(form.registeredShareOverride);
    if (pct === null || pct < 0 || pct > 100) {
      return { error: `${norm.label} har ingen fast timenorm — angiv andelen registreret i Vipomatic (0–100%).` };
    }
    registeredShareOverride = pct / 100;
  }

  const given: Scenario['given'] = {};

  if (form.knownField === 'moneyKr') {
    const v = toNumber(form.moneyKr);
    if (v === null || v < 0) return { error: 'Angiv et gyldigt beløb.' };
    given.moneyKr = v;
  } else if (form.knownField === 'hoursRegistered') {
    const v = toNumber(form.hoursRegistered);
    if (v === null || v < 0) return { error: 'Angiv et gyldigt antal Vipomatic-timer.' };
    given.hoursRegistered = v;
  } else {
    let monthsValue: number | null;
    if (form.monthsEntryMode === 'fte') {
      const fte = toNumber(form.fteShare);
      const span = toNumber(form.varighedMonths);
      if (fte === null || fte < 0 || span === null || span <= 0) {
        return { error: 'Angiv en gyldig FTE% og varighed.' };
      }
      monthsValue = (fte / 100) * span;
    } else {
      monthsValue = toNumber(form.months);
    }
    if (monthsValue === null || monthsValue < 0) return { error: 'Angiv et gyldigt antal måneder.' };
    given.months = monthsValue;
  }

  let operatingKr: number | undefined;
  if (form.pricingEnabled) {
    operatingKr = toNumber(form.operatingKr) ?? 0;
    if (operatingKr < 0) return { error: 'Angiv gyldige direkte driftsomkostninger (0 eller derover).' };
  }

  const scenario: Scenario = {
    asOf: form.asOf,
    category: form.category,
    variant: form.variant,
    undervisningsBasis: form.variant === 'undervisning' ? form.undervisningsBasis : undefined,
    monthlyCostKr,
    registeredShareOverride,
    // When months is the known field, either 'money' or 'hoursRegistered'
    // works — solve() computes both regardless. 'money' just picks the
    // trace's money-step label ("beløb der skal budgetteres").
    solveFor: form.knownField === 'months' ? 'money' : 'months',
    given,
    snapToWholeMonths: form.snapToWholeMonths ? 'down' : 'off',
    employmentFraction: beskaeftigelsesgradPct / 100,
    pricing: form.pricingEnabled
      ? {
          mechanism: form.mechanism,
          asOf: form.asOf,
          overheadId: form.overheadId,
          marginId: form.marginId || undefined,
          applyMoms: form.applyMoms,
        }
      : undefined,
    operatingKr,
    marketFloorTableId: form.pricingEnabled && form.marketFloorTableId ? form.marketFloorTableId : undefined,
  };

  try {
    return { result: solve(scenario) };
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Der opstod en uventet fejl.' };
  }
}
