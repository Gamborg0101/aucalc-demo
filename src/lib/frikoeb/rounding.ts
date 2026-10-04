/**
 * Rounding for frikøb calculations.
 *
 * The source PDFs compute from *pre-rounded published constants*, which is why their
 * worked examples look mutually inconsistent. See `docs/rounding-policy.md` for the
 * full reconciliation. In short:
 *
 *   1643 / 12  = 136,9166…  but IKS publishes 136,9
 *   1643 × 0,6 = 985,8      but IKS publishes 986
 *
 * and the notat then uses two different bases for two different kinds of report,
 * both truncating. We compute exactly and round once, at the presentation boundary —
 * but keep legacy profiles that reproduce each PDF byte-for-byte, so a consultant can
 * match a notat already in circulation.
 */

export type RoundMode = 'halfUp' | 'halfEven' | 'floor' | 'ceil';

/**
 * Guards against float representation error before truncating.
 *
 * Without this, 164.28000000000003 and 164.27999999999997 floor to different values
 * at 1 dp. Both arise legitimately from `136.9 * 2 * 0.6` depending on evaluation
 * order, and the documents expect 164,2.
 */
const EPS = 1e-9;

export function roundTo(x: number, dp: number, mode: RoundMode): number {
  if (!Number.isFinite(x)) return x;
  const f = 10 ** dp;
  const v = x * f;

  switch (mode) {
    case 'floor':
      return Math.floor(v + EPS) / f;
    case 'ceil':
      return Math.ceil(v - EPS) / f;
    case 'halfUp':
      return (Math.sign(v) * Math.round(Math.abs(v) + EPS)) / f;
    case 'halfEven': {
      const r = Math.round(v);
      // Exactly .5 and the rounded result is odd → step toward even.
      const isTie = Math.abs(Math.abs(v % 1) - 0.5) < EPS;
      return (isTie && r % 2 !== 0 ? r - Math.sign(v) : r) / f;
    }
  }
}

/**
 * Which constant a figure is computed from.
 *
 * `annualExact` is the honest path: derive everything from the årsnorm and never
 * touch a pre-rounded constant. The two `published*` bases exist only to reproduce
 * the PDFs.
 */
export type CalcBasis =
  /** Derive from annualWorkHours. Canonical. */
  | 'annualExact'
  /** Use the published monthly figure (136,9 / 137,5). */
  | 'publishedMonthly'
  /** Use the published annual teaching figure (986 / 990). */
  | 'publishedAnnualTeaching';

export interface OutputRounding {
  basis: CalcBasis;
  dp: number;
  mode: RoundMode;
}

export type RoundingProfileId =
  | 'canonical'
  | 'legacy-iks-2022'
  | 'legacy-iks-2022-breakdown'
  | 'legacy-ikk-2026';

export interface RoundingProfile {
  id: RoundingProfileId;
  label: string;
  /** Structurally always false — we never round mid-calculation. */
  readonly intermediateRounding: false;
  outputs: {
    workHours: OutputRounding;
    teachingHours: OutputRounding;
    researchHours: OutputRounding;
    /** The honest Vipomatic figure, one decimal. */
    hoursToRegister: OutputRounding;
    /** The integer actually typed into Vipomatic. Always floored. */
    hoursToRegisterWhole: OutputRounding;
    months: OutputRounding;
    money: OutputRounding;
  };
}

const exact = (dp: number, mode: RoundMode): OutputRounding => ({
  basis: 'annualExact',
  dp,
  mode,
});

export const CANONICAL: RoundingProfile = {
  id: 'canonical',
  label: 'Kanonisk (beregnet fra årsnormen)',
  intermediateRounding: false,
  outputs: {
    workHours: exact(1, 'halfUp'),
    teachingHours: exact(1, 'halfUp'),
    researchHours: exact(1, 'halfUp'),
    hoursToRegister: exact(1, 'halfUp'),
    // Floor, deliberately: never register more teaching hours than the buy-out funded.
    // The trace surfaces the discarded fraction rather than letting it vanish.
    hoursToRegisterWhole: exact(0, 'floor'),
    months: exact(2, 'halfUp'),
    money: exact(0, 'halfUp'),
  },
};

/** Reproduces IKS 2022 examples 1–4 (the Vipomatic registration figures). */
export const LEGACY_IKS_2022: RoundingProfile = {
  id: 'legacy-iks-2022',
  label: 'IKS-notat 2022 — Vipomatic-tal (986 t/år, hele timer)',
  intermediateRounding: false,
  outputs: {
    ...CANONICAL.outputs,
    teachingHours: { basis: 'publishedAnnualTeaching', dp: 0, mode: 'floor' },
    hoursToRegister: { basis: 'publishedAnnualTeaching', dp: 0, mode: 'floor' },
    hoursToRegisterWhole: { basis: 'publishedAnnualTeaching', dp: 0, mode: 'floor' },
  },
};

/** Reproduces IKS 2022 examples 5–7 (the work-time breakdown). */
export const LEGACY_IKS_2022_BREAKDOWN: RoundingProfile = {
  id: 'legacy-iks-2022-breakdown',
  label: 'IKS-notat 2022 — arbejdstidsopdeling (136,9 t/md, 1 decimal)',
  intermediateRounding: false,
  outputs: {
    ...CANONICAL.outputs,
    workHours: { basis: 'publishedMonthly', dp: 1, mode: 'floor' },
    teachingHours: { basis: 'publishedMonthly', dp: 1, mode: 'floor' },
    researchHours: { basis: 'publishedMonthly', dp: 1, mode: 'floor' },
    hoursToRegister: { basis: 'publishedMonthly', dp: 1, mode: 'floor' },
  },
};

/** IKK 2026. Its arithmetic is clean (1650/12 = 137,5 exactly), so nothing special is needed. */
export const LEGACY_IKK_2026: RoundingProfile = {
  id: 'legacy-ikk-2026',
  label: 'IKK-notat 2026',
  intermediateRounding: false,
  outputs: { ...CANONICAL.outputs },
};

export const ROUNDING_PROFILES: Record<RoundingProfileId, RoundingProfile> = {
  canonical: CANONICAL,
  'legacy-iks-2022': LEGACY_IKS_2022,
  'legacy-iks-2022-breakdown': LEGACY_IKS_2022_BREAKDOWN,
  'legacy-ikk-2026': LEGACY_IKK_2026,
};
