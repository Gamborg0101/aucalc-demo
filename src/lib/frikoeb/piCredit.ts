/**
 * Princip 6 — PI teaching-credit for postdoc grants captured.
 *
 * A distinct, separate calculation from `solve()`: this reduces the *grant-
 * winning senior researcher's own* institutarbejdsforpligtelse, not the
 * postdoc's. Confirmed 2026-08-31 (see `rules/NOTES-frikoebspolitik.md`,
 * "Princip 6 — postdoc supervision credit") not to be a partial answer to the
 * separate "how is a postdoc's own frikøb computed" question — that one still
 * has no fixed norm and the engine still correctly refuses to default it.
 *
 * The rule, quoted directly from `Frikoeb_IKK_politik.pdf`, Princip 6: a
 * senior VIP who brings home a collective project containing postdoc
 * positions — where frikøb for senior researchers is not otherwise
 * obtainable — may agree a reduction of **10% per semester (49 timer) per
 * postdoc**, where that postdoc "i sin ansættelse er pligtig til at yde 20%
 * undervisning". An externally financed ph.d. does NOT trigger this credit.
 *
 * "49 timer" is that 10% applied to the 2023-2025 493 t semester norm,
 * floored (49,3 → 49) — the rate is the rule, not the figure, so this
 * computes 10% of whichever semester norm is in force at `asOf` rather than
 * hardcoding 49 forever. Under the 2024+ norm (495 t) it still floors to 49,
 * matching the source exactly.
 */

import { selectAarsnormAt, scaleNorm, type AarsnormPeriod } from './config/norms';
import { roundTo } from './rounding';
import { TraceBuilder, da, hours as hoursVal, type CalcTrace, type TraceValue } from './trace';
import type { DocumentRef, ISODate } from './types';

export const SRC_IKK_POLITIK_PRINCIP6: DocumentRef = {
  title: 'Politik for frikøb til forskning ved eksterne midler (IKK)',
  org: 'IKK',
  dated: '2019-01-01',
  file: 'rules/Frikoeb_IKK_politik.pdf',
  locator: 'Princip 6',
};

/** The credit rate: 10% of the semester teaching norm, per postdoc. */
export const PI_CREDIT_RATE = 0.1;

export interface PiCreditInput {
  asOf: ISODate;
  /** Number of postdoc positions secured via the PI's collective grant. A non-negative integer. */
  postdocCount: number;
  /**
   * The PI's own beskæftigelsesgrad. Scales the semester norm the same way a
   * personal frikøb calculation would (`scaleNorm`, shared with `solve()`).
   * Defaults to 1 (fuldtid). Must be in (0, 1].
   */
  employmentFraction?: number;
}

export interface PiCreditResult {
  /** Hours credited per postdoc position, this semester. Floored — see docs/rounding-policy.md. */
  creditHoursPerPostdoc: number;
  /** `creditHoursPerPostdoc × postdocCount`. */
  totalCreditHours: number;
  norm: AarsnormPeriod;
  trace: CalcTrace;
}

const count = (value: number): TraceValue => ({ value, unit: '', dp: 0 });

export function computePiCredit(input: PiCreditInput): PiCreditResult {
  if (!Number.isInteger(input.postdocCount) || input.postdocCount < 0) {
    throw new Error('Antal postdoc-stillinger skal være et heltal, 0 eller derover.');
  }
  const employmentFraction = input.employmentFraction ?? 1;
  if (employmentFraction <= 0 || employmentFraction > 1) {
    throw new Error('Beskæftigelsesgrad skal være over 0% og højst 100%.');
  }

  const fullTimeNorm = selectAarsnormAt(input.asOf);
  const norm = scaleNorm(fullTimeNorm, employmentFraction);

  const t = new TraceBuilder('canonical');

  t.section('forudsaetninger');
  t.constant(
    'const.semesternorm',
    'Semesternorm — undervisning (60%-kategori)',
    hoursVal(norm.published.semesterTeachingHours, 0),
    fullTimeNorm.source,
  );
  t.input('input.postdocCount', 'Antal postdoc-stillinger hjemtaget', count(input.postdocCount));

  t.section('tid');
  const beforeRound = norm.published.semesterTeachingHours * PI_CREDIT_RATE;
  const afterRound = roundTo(beforeRound, 0, 'floor');
  const creditHoursPerPostdoc = t.step({
    id: 'tid.kredit.perPostdoc',
    kind: 'derived',
    label: 'Kredit pr. postdoc',
    formula: 'semesternorm × 10%, nedrundet',
    substituted: `${da(norm.published.semesterTeachingHours)} t × 10%`,
    inputs: [
      { label: 'Semesternorm', value: hoursVal(norm.published.semesterTeachingHours, 0), ref: 'const.semesternorm' },
    ],
    output: hoursVal(afterRound, 0),
    rounding: { mode: 'floor', dp: 0, before: beforeRound, after: afterRound, discarded: beforeRound - afterRound },
    sourceRef: SRC_IKK_POLITIK_PRINCIP6,
    note:
      'Gælder kun, hvis den enkelte postdoc selv er forpligtet til 20% undervisning, og der ikke i ' +
      'øvrigt kan opnås frikøb for seniorforskere på projektet — skal aftales med institutlederen. ' +
      'En eksternt finansieret ph.d.-stilling udløser IKKE denne kredit.',
  });

  const totalCreditHours = t.step({
    id: 'tid.kredit.total',
    kind: 'derived',
    label: 'Samlet kredit',
    formula: 'kredit pr. postdoc × antal postdocs',
    substituted: `${da(creditHoursPerPostdoc, 0)} t × ${input.postdocCount}`,
    inputs: [
      { label: 'Kredit pr. postdoc', value: hoursVal(creditHoursPerPostdoc, 0), ref: 'tid.kredit.perPostdoc' },
      { label: 'Antal postdocs', value: count(input.postdocCount), ref: 'input.postdocCount' },
    ],
    output: hoursVal(creditHoursPerPostdoc * input.postdocCount, 0),
  });

  t.bind('creditHoursPerPostdoc', 'tid.kredit.perPostdoc');
  t.bind('totalCreditHours', 'tid.kredit.total');

  return { creditHoursPerPostdoc, totalCreditHours, norm, trace: t.build() };
}
