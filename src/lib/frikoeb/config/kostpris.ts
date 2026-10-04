/**
 * Kostpris — what it costs to employ someone.
 *
 * ⚠️ Kostpris is formally an HOURLY rate on the 1924-hour payroll basis:
 *
 *     Kostpris = (månedsløn / 160,33) × feriefaktor + bidrag       (160,33 = 1924/12)
 *
 * AU also publishes it converted to a monthly figure, which is what frikøb budgets
 * actually use. Both are here.
 *
 * Two modes, per AU's own guidance:
 *   - NAMED person   → the real kostpris is already in Navision. The consultant
 *                      supplies it. Nothing here applies.
 *   - UNNAMED person → use the Takstkatalog below, clearly labelled as an average.
 *
 * Do NOT use the 2022 frikøb notat's "lektor ≈ 50.000 kr/md". The 2026 figure is
 * ~70.000 — about 40% higher.
 */

import type { DocumentRef } from '../types';

export const SRC_TAKSTKATALOG_2026: DocumentRef = {
  title: 'Takstkatalog for ressourcekostpriser 2026',
  org: 'AU_ARTS',
  dated: '2026-02-03',
  file: 'rules/Kostpris_takstkatalog_2026.pdf',
};

export const SRC_KOSTPRIS_FORMLER: DocumentRef = {
  title: 'Historiske kostprisformler',
  org: 'AU_ARTS',
  dated: '2026-01-19',
  file: 'rules/Kostpris_historiske_formler_2015-2026.pdf',
};

/** Monthly full-time hours for a resource: 1924/12. The kostpris denominator. */
export const MAANEDENS_TIMER = 160.33;

/** Annual payroll norm. Includes non-productive time. NOT the workload norm. */
export const PAYROLL_ANNUAL_HOURS = 1924;

// ---------------------------------------------------------------------------
// Formula parameters
// ---------------------------------------------------------------------------

export interface KostprisParams {
  year: number;
  /** 1 + særlig feriegodtgørelse + nettoferieafregning. */
  feriefaktor: number;
  /** AES + AUB + fleksjob + barselsfond, per hour on the 1924 basis. */
  bidragKrPerHour: number;
  note?: string;
}

export const KOSTPRIS_PARAMS: KostprisParams[] = [
  { year: 2026, feriefaktor: 1.03, bidragKrPerHour: 5.18, note: 'særlig feriegodtgørelse 1,75% + nettoferieafregning 1,25%. Opr. faktor 1,025 indtil april.' },
  { year: 2025, feriefaktor: 1.03, bidragKrPerHour: 5.20 },
  { year: 2024, feriefaktor: 1.03, bidragKrPerHour: 4.98, note: 'faktor ændret pga. kompensation for st. bededag' },
  { year: 2023, feriefaktor: 1.025, bidragKrPerHour: 4.86 },
  { year: 2022, feriefaktor: 1.02, bidragKrPerHour: 4.86 },
  { year: 2021, feriefaktor: 1.02, bidragKrPerHour: 4.65 },
  { year: 2020, feriefaktor: 1.02, bidragKrPerHour: 4.47, note: 'faktor ændret i september pga. samtidighedsferie' },
  { year: 2019, feriefaktor: 1.03, bidragKrPerHour: 4.54 },
  { year: 2018, feriefaktor: 1.03, bidragKrPerHour: 4.37 },
  { year: 2017, feriefaktor: 1.035, bidragKrPerHour: 2.99 },
  { year: 2016, feriefaktor: 1.035, bidragKrPerHour: 3.05 },
  { year: 2015, feriefaktor: 1.035, bidragKrPerHour: 3.29 },
];

/** SU rates, for the SU-ph.d. kostpris formula `(2 × SU) / 160,33`. */
export const SU_SATSER: Record<number, number> = {
  2026: 7426, 2025: 7086, 2024: 6820, 2023: 6589, 2022: 6397, 2021: 6321,
  2020: 6243, 2019: 6166, 2018: 6090, 2017: 6015, 2016: 5941, 2015: 5903,
};

// ---------------------------------------------------------------------------
// Takstkatalog — månedsløn per stillingstype
// ---------------------------------------------------------------------------

export type Kvartil = 'lav' | 'median' | 'hoej';

export interface TakstRow {
  /** AU stillingstype code. */
  code: string;
  label: string;
  /** Monthly figures in kr by year, per quartile. Rounded up to whole thousands by AU. */
  byYear: Record<number, { lav: number; median: number; hoej: number; middel?: number }>;
}

/**
 * Månedsløn i april (kr., løbende priser).
 *
 * Assumptions AU states: based on January 2026 salary, uplifted 2,5% per 1 April
 * 2026 per the OK26 forligstekst, then a further 2,5% annually. Rounded UP to whole
 * thousands.
 *
 * Includes: løbende løndele incl. pension, ferieafregning ved fratrædelse,
 * seniorbonus, særlig feriegodtgørelse, bidragssats.
 * Excludes: engangsudbetalinger (overarbejde, engangstillæg), barsel og sygdom.
 */
export const TAKSTKATALOG: TakstRow[] = [
  { code: '111', label: 'Professor', byYear: {
    2026: { lav: 81_000, median: 85_000, hoej: 90_000, middel: 87_000 },
    2027: { lav: 83_000, median: 87_000, hoej: 93_000, middel: 89_000 },
    2028: { lav: 85_000, median: 89_000, hoej: 95_000, middel: 92_000 },
    2029: { lav: 89_000, median: 93_000, hoej: 100_000, middel: 96_000 } } },
  { code: '114', label: 'Professor MSO', byYear: {
    2026: { lav: 76_000, median: 78_000, hoej: 81_000, middel: 79_000 },
    2027: { lav: 78_000, median: 80_000, hoej: 83_000, middel: 81_000 },
    2028: { lav: 80_000, median: 82_000, hoej: 85_000, middel: 83_000 },
    2029: { lav: 84_000, median: 86_000, hoej: 89_000, middel: 87_000 } } },
  { code: '121', label: 'Lektor', byYear: {
    2026: { lav: 65_000, median: 68_000, hoej: 73_000, middel: 70_000 },
    2027: { lav: 66_000, median: 70_000, hoej: 74_000, middel: 71_000 },
    2028: { lav: 68_000, median: 72_000, hoej: 76_000, middel: 73_000 },
    2029: { lav: 71_000, median: 75_000, hoej: 80_000, middel: 77_000 } } },
  { code: '124', label: 'Seniorforsker', byYear: {
    2026: { lav: 68_000, median: 71_000, hoej: 74_000, middel: 71_000 },
    2027: { lav: 70_000, median: 73_000, hoej: 76_000, middel: 73_000 },
    2028: { lav: 72_000, median: 75_000, hoej: 78_000, middel: 75_000 },
    2029: { lav: 75_000, median: 79_000, hoej: 82_000, middel: 79_000 } } },
  { code: '131', label: 'Adjunkt', byYear: {
    2026: { lav: 53_000, median: 55_000, hoej: 57_000, middel: 55_000 },
    2027: { lav: 54_000, median: 56_000, hoej: 58_000, middel: 57_000 },
    2028: { lav: 56_000, median: 58_000, hoej: 60_000, middel: 58_000 },
    2029: { lav: 59_000, median: 61_000, hoej: 63_000, middel: 61_000 } } },
  { code: '137', label: 'Post doc.', byYear: {
    2026: { lav: 53_000, median: 53_000, hoej: 54_000, middel: 54_000 },
    2027: { lav: 54_000, median: 54_000, hoej: 56_000, middel: 55_000 },
    2028: { lav: 56_000, median: 56_000, hoej: 57_000, middel: 56_000 },
    2029: { lav: 59_000, median: 59_000, hoej: 60_000, middel: 59_000 } } },
  { code: '154', label: 'Videnskabelig assistent', byYear: {
    2026: { lav: 43_000, median: 43_000, hoej: 50_000, middel: 46_000 },
    2027: { lav: 44_000, median: 45_000, hoej: 51_000, middel: 47_000 },
    2028: { lav: 46_000, median: 46_000, hoej: 53_000, middel: 49_000 },
    2029: { lav: 48_000, median: 48_000, hoej: 55_000, middel: 51_000 } } },
  { code: '212', label: 'Lønnet ph.d.-stipendiat', byYear: {
    2026: { lav: 40_000, median: 43_000, hoej: 46_000, middel: 43_000 },
    2027: { lav: 41_000, median: 44_000, hoej: 47_000, middel: 44_000 },
    2028: { lav: 42_000, median: 45_000, hoej: 48_000, middel: 45_000 },
    2029: { lav: 44_000, median: 48_000, hoej: 50_000, middel: 48_000 } } },
  { code: '421', label: 'Chef-/specialkonsulent', byYear: {
    2026: { lav: 62_000, median: 65_000, hoej: 69_000, middel: 67_000 },
    2027: { lav: 64_000, median: 66_000, hoej: 71_000, middel: 68_000 },
    2028: { lav: 65_000, median: 68_000, hoej: 73_000, middel: 70_000 },
    2029: { lav: 68_000, median: 72_000, hoej: 76_000, middel: 74_000 } } },
  { code: '422', label: 'Fuldmægtig', byYear: {
    2026: { lav: 51_000, median: 56_000, hoej: 58_000, middel: 54_000 },
    2027: { lav: 52_000, median: 57_000, hoej: 60_000, middel: 55_000 },
    2028: { lav: 54_000, median: 58_000, hoej: 61_000, middel: 57_000 },
    2029: { lav: 56_000, median: 61_000, hoej: 64_000, middel: 60_000 } } },
  { code: '431', label: 'Kontor m.fl.', byYear: {
    2026: { lav: 41_000, median: 46_000, hoej: 50_000, middel: 46_000 },
    2027: { lav: 42_000, median: 47_000, hoej: 51_000, middel: 47_000 },
    2028: { lav: 43_000, median: 48_000, hoej: 53_000, middel: 48_000 },
    2029: { lav: 45_000, median: 51_000, hoej: 55_000, middel: 51_000 } } },
  { code: '451', label: 'AC-personale m.fl.', byYear: {
    2026: { lav: 49_000, median: 54_000, hoej: 59_000, middel: 53_000 },
    2027: { lav: 50_000, median: 56_000, hoej: 60_000, middel: 55_000 },
    2028: { lav: 51_000, median: 57_000, hoej: 62_000, middel: 56_000 },
    2029: { lav: 54_000, median: 60_000, hoej: 65_000, middel: 59_000 } } },
  { code: '461', label: 'Tekniker', byYear: {
    2026: { lav: 45_000, median: 49_000, hoej: 53_000, middel: 50_000 },
    2027: { lav: 46_000, median: 50_000, hoej: 54_000, middel: 51_000 },
    2028: { lav: 47_000, median: 51_000, hoej: 55_000, middel: 52_000 },
    2029: { lav: 50_000, median: 54_000, hoej: 58_000, middel: 55_000 } } },
  { code: '465', label: 'Laborant m.fl.', byYear: {
    2026: { lav: 41_000, median: 45_000, hoej: 48_000, middel: 44_000 },
    2027: { lav: 42_000, median: 46_000, hoej: 50_000, middel: 46_000 },
    2028: { lav: 43_000, median: 48_000, hoej: 51_000, middel: 47_000 },
    2029: { lav: 45_000, median: 50_000, hoej: 53_000, middel: 49_000 } } },
  { code: '466', label: 'IT-medarbejder', byYear: {
    2026: { lav: 41_000, median: 49_000, hoej: 57_000, middel: 49_000 },
    2027: { lav: 42_000, median: 50_000, hoej: 58_000, middel: 51_000 },
    2028: { lav: 43_000, median: 51_000, hoej: 60_000, middel: 52_000 },
    2029: { lav: 45_000, median: 54_000, hoej: 63_000, middel: 54_000 } } },
];

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

export function kostprisParamsFor(year: number): KostprisParams {
  const hit = KOSTPRIS_PARAMS.find((p) => p.year === year);
  if (!hit) {
    throw new Error(
      `Ingen kostprisparametre for ${year}. Tilføj feriefaktor og bidragssats i config/kostpris.ts.`,
    );
  }
  return hit;
}

/**
 * The official kostpris formula. Returns kr/hour on the 1924 basis.
 *
 * Use this only for *estimates*. A real kostpris is individual and lives in
 * Navision; label anything computed here accordingly.
 */
export function kostprisPerHour(maanedsloenKr: number, year: number): number {
  const { feriefaktor, bidragKrPerHour } = kostprisParamsFor(year);
  return (maanedsloenKr / MAANEDENS_TIMER) * feriefaktor + bidragKrPerHour;
}

/** The same figure expressed monthly — what frikøb budgets actually use. */
export function kostprisPerMonth(maanedsloenKr: number, year: number): number {
  return kostprisPerHour(maanedsloenKr, year) * MAANEDENS_TIMER;
}

/** SU-ph.d. kostpris, kr/hour. Their salary works differently. */
export function suPhdKostprisPerHour(year: number): number {
  const su = SU_SATSER[year];
  if (su === undefined) throw new Error(`Ingen SU-sats for ${year}.`);
  return (2 * su) / MAANEDENS_TIMER;
}

/** Månedsløn from the Takstkatalog. `null` when the year or code is not covered. */
export function takstFor(code: string, year: number, kvartil: Kvartil | 'middel'): number | null {
  const row = TAKSTKATALOG.find((r) => r.code === code);
  const y = row?.byYear[year];
  if (!y) return null;
  return kvartil === 'middel' ? (y.middel ?? y.median) : y[kvartil];
}
