/**
 * Guiding hourly rates (timetakster).
 *
 * ⚠️ These are the ONLY rates we have, and they are dated **1 April 2019**. AU
 * Cetera's 2026 prices are 4–17% higher across the same categories, which suggests
 * the 2019 table is stale but structurally sound. They ship flagged `provisional`
 * and the engine warns when used far from their effective date.
 *
 * They exist mainly so the IDV market-floor check has something to compare against:
 * "AU må ikke underbyde markedet."
 */

import type { DocumentRef } from '../types';

export const SRC_IKK_POLITIK: DocumentRef = {
  title: 'Politik for frikøb til forskning ved eksterne midler (IKK)',
  org: 'IKK',
  dated: '2019-01-01',
  file: 'rules/Frikoeb_IKK_politik.pdf',
  locator: 'Princip 7',
};

export const SRC_AU_CETERA: DocumentRef = {
  title: 'Prisliste til brug ved køb af VIP- og TAP-ressourcer (AU Cetera)',
  org: 'AU_ARTS',
  dated: '2025-02-21',
  file: 'rules/IDV_prisliste_AU_Cetera_2025-2026.pdf',
};

/** Rate categories. Coarser than the Takstkatalog's stillingstyper. */
export type RateCategory =
  | 'professor'
  | 'lektor'
  | 'adjunkt_postdoc_phd'
  | 'phd_uden_phd'
  | 'studerende';

export interface RateTable {
  id: string;
  label: string;
  /** Commercial IDV, or grant-funded/co-financed. */
  kind: 'kommerciel' | 'samfinansieret';
  effectiveFrom: string;
  effectiveTo: string | null;
  /** True when the figures are known-dated and unconfirmed as current. */
  provisional: boolean;
  /** Whether the quoted rate already contains overhead and administration. */
  includesOverhead: boolean;
  rates: Record<RateCategory, number>;
  source: DocumentRef;
  note?: string;
}

export const RATE_TABLES: RateTable[] = [
  {
    id: 'kommerciel-2019',
    label: 'Kommerciel virksomhed — vejledende timetakster (2019)',
    kind: 'kommerciel',
    effectiveFrom: '2019-04-01',
    effectiveTo: null,
    provisional: true,
    includesOverhead: false,
    rates: {
      professor: 1539,
      lektor: 1220,
      adjunkt_postdoc_phd: 1007,
      phd_uden_phd: 850,
      studerende: 385,
    },
    source: SRC_IKK_POLITIK,
    note:
      'Kun vejledende. Frikøbspolitikken princip 7: "Ved kommerciel virksomhed skal de ' +
      'konkrete lønudgifter altid pålægges et overhead" — den konkrete beregning går forud ' +
      'for taksterne.',
  },
  {
    id: 'samfinansieret-2019',
    label: 'Samfinansieret forskning — timetakster (2019)',
    kind: 'samfinansieret',
    effectiveFrom: '2019-04-01',
    effectiveTo: null,
    provisional: true,
    includesOverhead: true,
    rates: {
      professor: 932,
      lektor: 788,
      adjunkt_postdoc_phd: 695,
      phd_uden_phd: 566,
      studerende: 329,
    },
    source: SRC_IKK_POLITIK,
    note:
      'Taksterne er angivet inklusive dækning af generalieudgifter — der må IKKE pålægges ' +
      'yderligere overhead. Kan undtagelsesvis fraviges efter aftale med institutleder.',
  },
];

/**
 * AU Cetera's internal transfer prices, 2026. NOT the ARTS guiding rates — a
 * different arrangement — but current, and useful as a sanity check on how stale
 * the 2019 table is.
 */
export const AU_CETERA_2026: Partial<Record<RateCategory, number>> = {
  professor: 1700,
  lektor: 1350,
  adjunkt_postdoc_phd: 1100,
  phd_uden_phd: 900,
  studerende: 450,
};

/** Months after `effectiveFrom` beyond which a rate table is called stale. */
export const STALE_AFTER_MONTHS = 24;

export function selectRateTable(id: string): RateTable {
  const hit = RATE_TABLES.find((t) => t.id === id);
  if (!hit) throw new Error(`Ukendt taksttabel: ${id}`);
  return hit;
}

/** Guiding rate for a category, or `null` when the table does not cover it. */
export function guidingRate(tableId: string, category: RateCategory): number | null {
  return selectRateTable(tableId).rates[category] ?? null;
}

/** Whether a table is far enough past its effective date to warrant a warning. */
export function isStale(table: RateTable, asOf: string): boolean {
  const from = new Date(table.effectiveFrom);
  const at = new Date(asOf);
  const months = (at.getFullYear() - from.getFullYear()) * 12 + (at.getMonth() - from.getMonth());
  return months > STALE_AFTER_MONTHS;
}

/**
 * Maps an employment category to a rate category. The rate tables are coarser than
 * the norm table, so this is many-to-one — and deliberately explicit rather than a
 * clever string match.
 */
export function rateCategoryFor(
  category:
    | 'adjunkt' | 'lektor' | 'professor' | 'studieadjunkt_studielektor'
    | 'videnskabelig_assistent_underv' | 'postdoc' | 'phd' | 'dvip',
): RateCategory | null {
  switch (category) {
    case 'professor': return 'professor';
    case 'lektor': return 'lektor';
    case 'adjunkt':
    case 'postdoc': return 'adjunkt_postdoc_phd';
    case 'phd': return 'phd_uden_phd';
    case 'videnskabelig_assistent_underv': return 'adjunkt_postdoc_phd';
    // No guiding rate is published for these; the caller must not invent one.
    case 'studieadjunkt_studielektor':
    case 'dvip': return null;
  }
}
