/**
 * Work-time norms for ARTS.
 *
 * Every entry is date-versioned. This is not over-engineering: the norm already
 * changed once (1643 → 1650, i.e. semester norm 493 → 495 from 2024), and the
 * arbejdstidsaftale is extended only to end-2026 and under active revision.
 *
 * Norms do NOT vary by institute. Arbejdstidsaftale §5:
 *   "Der må ikke lokalt aftales timenormer, som afviger fra timenormerne angivet
 *    i arbejdstidsaftalen."
 * The apparent IKS/IKK difference is a vintage difference, not an institute one.
 */

import type { DocumentRef } from '../types';

// ---------------------------------------------------------------------------
// Sources
// ---------------------------------------------------------------------------

export const SRC_ARBEJDSTIDSAFTALE_2023: DocumentRef = {
  title: 'Arbejdstidsaftale på Faculty of Arts (2023-2025)',
  org: 'AU_ARTS',
  dated: '2023-01-01',
  file: 'rules/Arbejdstid_aftale_Arts_2023-2025.pdf',
  locator: '§3 og Bilag B 13.1',
};

export const SRC_IKK_2026: DocumentRef = {
  title: 'Notat vedr. frikøb på IKK',
  org: 'IKK',
  dated: '2026-06-23',
  file: 'rules/Frikoeb_IKK_notat_2026.pdf',
};

export const SRC_IKS_2022: DocumentRef = {
  title: 'Notat vedr. frikøb på IKS',
  org: 'IKS',
  dated: '2022-08-30',
  file: 'rules/Frikoeb_IKS_notat_2022.pdf',
};

export const SRC_WORKDAY_HOURS: DocumentRef = {
  title: 'AU/Vipomatic full-workday length',
  org: 'AU_ARTS',
  dated: '2026-09-01',
  locator:
    'Confirmed directly, not a written document. Applies to the current (2024+) årsnorm; ' +
    'no distinct pre-2024 figure has been confirmed.',
};

/**
 * A full ("1:1") Vipomatic work day, in hours — distinct from a calendar day.
 * Used only to express a frikøb's total arbejdstid as arbejdsdage, never as an
 * input to any money/hours/months conversion.
 */
export const WORKDAY_HOURS = 7.24;

// ---------------------------------------------------------------------------
// Årsnorm — the workload basis (excludes holiday)
// ---------------------------------------------------------------------------

export interface AarsnormPeriod {
  id: string;
  effectiveFrom: string;
  effectiveTo: string | null;
  /** Canonical basis for all computation. */
  annualWorkHours: number;
  /**
   * Figures as AU publishes them. Used ONLY by legacy rounding profiles and for
   * display — never as an input to the canonical compute path.
   *
   * Note `semesterWorkHours: 822`, not 821,5: 1643/2 = 821,5 but the aftale
   * publishes 822.
   */
  published: {
    semesterWorkHours: number;
    monthlyWorkHours: number;
    annualTeachingHours: number;
    semesterTeachingHours: number;
    semesterResearchHours: number;
  };
  source: DocumentRef;
  note?: string;
}

// Note: neither period below carries a runtime `note` — the arithmetic
// derivation and provenance detail are internal/maintainer concerns, not
// something a consultant reading the trace needs. Kept here as comments.
export const AARSNORM_PERIODS: AarsnormPeriod[] = [
  {
    id: 'arts-1643',
    effectiveFrom: '2023-01-01',
    effectiveTo: '2023-12-31',
    annualWorkHours: 1643,
    // Fem ugers ferie + en uges særlige feriedage fratrukket. 493+329=822, 986+657=1643.
    published: {
      semesterWorkHours: 822,
      monthlyWorkHours: 136.9,
      annualTeachingHours: 986,
      semesterTeachingHours: 493,
      semesterResearchHours: 329,
    },
    source: SRC_ARBEJDSTIDSAFTALE_2023,
  },
  {
    id: 'arts-1650',
    effectiveFrom: '2024-01-01',
    effectiveTo: null,
    annualWorkHours: 1650,
    // Aritmetisk ren: 1650/12 = 137,5 præcist. Startdatoen 2024-01-01 stammer fra
    // AU's Vipomatic-sider (493→495 fra 2024) og er IKKE bekræftet mod en
    // underskrevet aftale — se docs/open-questions.md Q2.
    published: {
      semesterWorkHours: 825,
      monthlyWorkHours: 137.5,
      annualTeachingHours: 990,
      semesterTeachingHours: 495,
      semesterResearchHours: 330,
    },
    source: SRC_IKK_2026,
  },
];

// ---------------------------------------------------------------------------
// Per-category split — Arbejdstidsaftale Bilag B 13.1–13.2
// ---------------------------------------------------------------------------

export type EmploymentCategory =
  | 'adjunkt'
  | 'lektor'
  | 'professor'
  | 'studieadjunkt_studielektor'
  | 'videnskabelig_assistent_underv'
  | 'postdoc'
  | 'phd'
  | 'dvip';

export interface CategoryNorm {
  category: EmploymentCategory;
  label: string;
  /**
   * Share of work time registered in Vipomatic (uddannelse, administration,
   * rekruttering, ph.d.-relaterede opgaver).
   *
   * `null` means there is no fixed norm — it must be supplied per person. The UI
   * must prompt or block; it must never substitute a default.
   */
  registeredShare: number | null;
  source: DocumentRef;
  note?: string;
}

export const CATEGORY_NORMS: CategoryNorm[] = [
  {
    category: 'adjunkt',
    label: 'Adjunkt (tidsbegrænset og tenure track)',
    registeredShare: 0.6,
    source: SRC_ARBEJDSTIDSAFTALE_2023,
    note:
      'Falder til 50% for den del af ansættelsen, der ligger ud over tre år ' +
      '(§6.1). Det forklarer tallet 411 t/semester (0,5 × 822).',
  },
  {
    category: 'lektor',
    label: 'Lektor',
    registeredShare: 0.6,
    source: SRC_ARBEJDSTIDSAFTALE_2023,
  },
  {
    category: 'professor',
    label: 'Professor',
    registeredShare: 0.6,
    source: SRC_ARBEJDSTIDSAFTALE_2023,
  },
  {
    category: 'studieadjunkt_studielektor',
    label: 'Studieadjunkt og studielektor',
    registeredShare: 0.8,
    source: SRC_ARBEJDSTIDSAFTALE_2023,
    note: '80% – 657 t/semester uddannelse, 20% – 165 t faglig udvikling og basisopgaver.',
  },
  {
    category: 'videnskabelig_assistent_underv',
    label: 'Videnskabelig assistent med undervisningsforpligtelse',
    registeredShare: 0.8,
    source: SRC_ARBEJDSTIDSAFTALE_2023,
  },
  {
    category: 'postdoc',
    label: 'Postdoc med institutforpligtelser',
    registeredShare: null,
    source: SRC_ARBEJDSTIDSAFTALE_2023,
    note:
      'INGEN fast norm. Bilag B 13.2: aftales med institutlederen, "under iagttagelse ' +
      'af, at stillingens indhold fortrinsvis er forskning". Må ikke defaultes til 0,6.',
  },
  {
    category: 'phd',
    label: 'Ph.d.-studerende',
    registeredShare: null,
    source: SRC_ARBEJDSTIDSAFTALE_2023,
    note:
      'Underlagt "Retningslinjer: Ph.d.-studerendes lønnede institutarbejde (de 840 timer)". ' +
      'Passer ikke ind i månedsnormmodellen — kræver egen behandling.',
  },
  {
    category: 'dvip',
    label: 'Ekstern lektor / undervisningsassistent (DVIP)',
    registeredShare: null,
    source: SRC_ARBEJDSTIDSAFTALE_2023,
    note: 'Timer efter ministeriets cirkulære om eksterne lektorer og undervisningsassistenter.',
  },
];

// ---------------------------------------------------------------------------
// Productive-hour bases for external project accounting
// ---------------------------------------------------------------------------

/**
 * NOT the same thing as the årsnorm, and not interchangeable with it.
 *
 * - 1924 is AU's full-time standard and includes non-productive time (holiday).
 *   It is the payroll basis.
 * - 1643/1650 is the ARTS workload norm and drives Vipomatic registration.
 * - 1460/1485/1580 are *productive hours only*, used for what may be charged and
 *   reported to a funder. Which applies depends on the time-registration regime.
 *
 * Deriving a kr/hour figure without naming the basis is meaningless: annual cost
 * ÷ 1460 is ~32% higher than ÷ 1924.
 */
export interface ProductiveHoursBasis {
  id: string;
  label: string;
  annualHours: number;
  appliesWhen: string;
}

export const SRC_AU_WORKING_HOUR_STANDARDS: DocumentRef = {
  title: 'Working hour standards (Instructions regarding external funding)',
  org: 'AU_ARTS',
  dated: '2026-07-03',
  file: 'rules/NOTES-au-oekonomi-portal.md',
  locator: '§1b',
};

export const PRODUCTIVE_HOURS_BASES: ProductiveHoursBasis[] = [
  {
    id: 'payroll-1924',
    label: '1.924 t — AU\'s fuldtidsnorm (inkl. ikke-produktiv tid)',
    annualHours: 1924,
    appliesWhen: 'Lønmæssig fuldtidsnorm. Dækker både produktiv og ikke-produktiv tid, fx ferie.',
  },
  {
    id: 'promark-1460',
    label: '1.460 t — al tidsregistrering i ProMark',
    annualHours: 1460,
    appliesWhen: 'Når al tidsregistrering på det eksterne projekt sker i ProMark.',
  },
  {
    id: 'h2020-1485',
    label: '1.485 t — H2020-afregning',
    annualHours: 1485,
    appliesWhen: 'Afregning af H2020-projekter, hvor tidsregistrering sker i ProMark og regneark.',
  },
  {
    id: 'spreadsheet-1580',
    label: '1.580 t — øvrige projekter med regnearksregistrering',
    annualHours: 1580,
    appliesWhen: 'Øvrige projekter, hvor tidsregistrering i regneark er påkrævet. Alternativt 1.485.',
  },
];

// ---------------------------------------------------------------------------
// Selectors
// ---------------------------------------------------------------------------

export function selectAarsnormAt(isoDate: string): AarsnormPeriod {
  const hit = AARSNORM_PERIODS.find(
    (p) => isoDate >= p.effectiveFrom && (p.effectiveTo === null || isoDate <= p.effectiveTo),
  );
  if (!hit) {
    throw new Error(
      `Ingen årsnorm er defineret for ${isoDate}. Tilføj en periode i config/norms.ts.`,
    );
  }
  return hit;
}

export function selectCategoryNorm(category: EmploymentCategory): CategoryNorm {
  const hit = CATEGORY_NORMS.find((c) => c.category === category);
  if (!hit) throw new Error(`Ukendt stillingskategori: ${category}`);
  return hit;
}

/**
 * Scales a full-time norm down for part-time staff (beskæftigelsesgrad).
 *
 * Scales the total hours proportionally — it does not change the
 * teaching/research split, which stays whatever the category norm says.
 * `published` is scaled too: several call sites (the residual-obligation
 * check, legacy rounding profiles) read `published.*` directly, and a
 * part-time semesternorm is not the full-time figure.
 */
export function scaleNorm(norm: AarsnormPeriod, employmentFraction: number): AarsnormPeriod {
  if (employmentFraction === 1) return norm;
  return {
    ...norm,
    annualWorkHours: norm.annualWorkHours * employmentFraction,
    published: {
      semesterWorkHours: norm.published.semesterWorkHours * employmentFraction,
      monthlyWorkHours: norm.published.monthlyWorkHours * employmentFraction,
      annualTeachingHours: norm.published.annualTeachingHours * employmentFraction,
      semesterTeachingHours: norm.published.semesterTeachingHours * employmentFraction,
      semesterResearchHours: norm.published.semesterResearchHours * employmentFraction,
    },
  };
}
