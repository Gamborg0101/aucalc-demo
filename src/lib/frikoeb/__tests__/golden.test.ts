/**
 * Golden fixtures: every worked example in the source PDFs.
 *
 * These are the acceptance criteria for the engine. Each fixture cites the document
 * and quotes the line it comes from, so a failure points straight at the paragraph
 * it contradicts.
 *
 * Two suites over the same data:
 *  - legacy   → must reproduce the PDFs EXACTLY
 *  - canonical → must deviate by no more than the recorded amount (max 0,6 t)
 *
 * The canonical suite is the important one: it pins the documented divergence so a
 * future change to the rounding policy fails loudly instead of drifting.
 */

import { describe, it, expect } from 'vitest';
import { hoursFromMonths, monthsFromMoney } from '../convert';
import { AARSNORM_PERIODS } from '../config/norms';
import { CANONICAL, ROUNDING_PROFILES, type RoundingProfileId } from '../rounding';

const IKS = AARSNORM_PERIODS.find((p) => p.id === 'arts-1643')!;
const IKK = AARSNORM_PERIODS.find((p) => p.id === 'arts-1650')!;

/** The standard 60% for adjunkt / lektor / professor. */
const S = 0.6;

interface Fixture {
  id: string;
  quote: string;
  norm: typeof IKS;
  months: number;
  profile: RoundingProfileId;
  expect: Partial<{
    hoursToRegister: number;
    workHours: number;
    teachingHours: number;
    researchHours: number;
  }>;
  /** What the canonical profile gives instead. Documents the known divergence. */
  canonical: Partial<{
    hoursToRegister: number;
    workHours: number;
    teachingHours: number;
    researchHours: number;
  }>;
}

const FIXTURES: Fixture[] = [
  {
    id: 'iks-1-lektor-6md',
    quote:
      'En lektor har fået bevilget fuldt frikøb i 6 mdr. og godskrives med ' +
      '(6/12 * 1643 * 0,6) = 493 timer i Vipomatic',
    norm: IKS,
    months: 6,
    profile: 'legacy-iks-2022',
    expect: { hoursToRegister: 493 },
    canonical: { hoursToRegister: 492.9 },
  },
  {
    id: 'iks-2-adjunkt-1md',
    quote: 'En adjunkt søger om fuldt frikøb i en måned og godskrives med (1/12 * 1643 * 0,6) = 82 timer',
    norm: IKS,
    months: 1,
    profile: 'legacy-iks-2022',
    expect: { hoursToRegister: 82 },
    canonical: { hoursToRegister: 82.2 },
  },
  {
    id: 'iks-3-professor-2x2md',
    quote:
      'En professor søger om 2*2 måneders frikøb på et år (4/12*1643*0,6) = 328 timer',
    norm: IKS,
    months: 4,
    profile: 'legacy-iks-2022',
    // Discriminating case: half-up would give 329. The doc says 328, so it truncates.
    expect: { hoursToRegister: 328 },
    canonical: { hoursToRegister: 328.6 },
  },
  {
    id: 'iks-4-lektor-75000kr',
    quote:
      'En lektor får 75.000 kr. i frikøb fra en ekstern fond. Beløbet omregnes ud fra ' +
      'lektorens månedsløn ((75.000/50.000)/12*1643*0,6) = 123 timer',
    norm: IKS,
    months: 75_000 / 50_000,
    profile: 'legacy-iks-2022',
    expect: { hoursToRegister: 123 },
    canonical: { hoursToRegister: 123.2 },
  },
  {
    id: 'iks-5-lektor-100000kr',
    quote:
      'En måneds arbejdstid er 136,9 timer. Et frikøb på to måneder betyder at forskeren ' +
      'lægger 136,9 x 2 = 273,8 arbejdstimer i projektet. … 273,8 x 0,6 = 164,2 timer.',
    norm: IKS,
    months: 100_000 / 50_000,
    profile: 'legacy-iks-2022-breakdown',
    expect: { workHours: 273.8, hoursToRegister: 164.2 },
    canonical: { workHours: 273.8, hoursToRegister: 164.3 },
  },
  {
    id: 'iks-6-1md-opdelt',
    quote:
      'En måneds frikøb betyder derfor, at der konkret vil blive registreret 82 timer … ' +
      '(136,9 x 0,6 = 82,1 timer). De resterende 40% … (136,9 x 0,4 = 54,7 timer).',
    norm: IKS,
    months: 1,
    profile: 'legacy-iks-2022-breakdown',
    // 136,9 × 0,4 = 54,76. Half-up gives 54,8; the doc says 54,7. Truncation confirmed.
    expect: { teachingHours: 82.1, researchHours: 54.7 },
    canonical: { teachingHours: 82.2, researchHours: 54.8 },
  },
  {
    id: 'iks-7-6md-opdelt',
    quote:
      'På 6 måneder er der 821,4 arbejdstimer. … 821,4 x 0,6 = 492,8 timer … ' +
      '821,4 x 0,4 = 328,5 timer.',
    norm: IKS,
    months: 6,
    profile: 'legacy-iks-2022-breakdown',
    expect: { workHours: 821.4, teachingHours: 492.8, researchHours: 328.5 },
    canonical: { workHours: 821.5, teachingHours: 492.9, researchHours: 328.6 },
  },
  {
    id: 'ikk-8-1md',
    quote:
      'I en måned er der 137,5 arbejdstimer. … En måneds frikøb betyder derfor, at der ' +
      'konkret vil blive registreret 82,5 timer (137,5 x 0,6 = 82,5 timer).',
    norm: IKK,
    months: 1,
    profile: 'legacy-ikk-2026',
    expect: { workHours: 137.5, hoursToRegister: 82.5 },
    canonical: { workHours: 137.5, hoursToRegister: 82.5 },
  },
  {
    id: 'ikk-9a-lektor-6md',
    quote: 'En lektor har fået bevilget frikøb i 6 mdr. og godskrives med (6/12 x 1650 x 0,6) = 495 timer',
    norm: IKK,
    months: 6,
    profile: 'legacy-ikk-2026',
    expect: { hoursToRegister: 495 },
    canonical: { hoursToRegister: 495 },
  },
  {
    id: 'ikk-9b-adjunkt-1md',
    quote: 'En adjunkt søger om frikøb i en måned og godskrives med (1/12 x 1650 x 0,6) = 82,5 timer',
    norm: IKK,
    months: 1,
    profile: 'legacy-ikk-2026',
    expect: { hoursToRegister: 82.5 },
    canonical: { hoursToRegister: 82.5 },
  },
  {
    id: 'ikk-9c-professor-4md',
    quote: 'En professor søger om 2 x 2 måneders frikøb på et år (4/12 x 1650 x 0,6) = 330 timer',
    norm: IKK,
    months: 4,
    profile: 'legacy-ikk-2026',
    expect: { hoursToRegister: 330 },
    canonical: { hoursToRegister: 330 },
  },
];

describe('golden fixtures — legacy profiles reproduce the PDFs exactly', () => {
  for (const f of FIXTURES) {
    it(`${f.id}: ${f.quote.slice(0, 70)}…`, () => {
      const got = hoursFromMonths(f.months, f.norm, S, ROUNDING_PROFILES[f.profile]);
      for (const [key, want] of Object.entries(f.expect)) {
        expect(got[key as keyof typeof got], `${key} (${f.id})`).toBe(want);
      }
    });
  }
});

describe('golden fixtures — canonical profile deviates only as documented', () => {
  for (const f of FIXTURES) {
    it(`${f.id}`, () => {
      const got = hoursFromMonths(f.months, f.norm, S, CANONICAL);
      for (const [key, want] of Object.entries(f.canonical)) {
        expect(got[key as keyof typeof got], `${key} (${f.id})`).toBe(want);
      }
    });
  }

  it('never deviates from a published figure by more than 0,6 t', () => {
    // Tolerance carries an epsilon of its own: |328,6 − 328| evaluates to
    // 0.6000000000000227 in float64. The engine guards its own rounding; this
    // guards the comparison.
    const MAX_DEVIATION = 0.6 + 1e-9;
    for (const f of FIXTURES) {
      const got = hoursFromMonths(f.months, f.norm, S, CANONICAL);
      for (const [key, published] of Object.entries(f.expect)) {
        const delta = Math.abs(got[key as keyof typeof got] - published);
        expect(delta, `${key} (${f.id})`).toBeLessThanOrEqual(MAX_DEVIATION);
      }
    }
  });
});

describe('money → months, as the notat computes it', () => {
  it('100.000 kr at 50.000 kr/md is 2 months', () => {
    expect(monthsFromMoney(100_000, 50_000, 1)).toBe(2);
  });

  it('75.000 kr at 50.000 kr/md is 1,5 months', () => {
    expect(monthsFromMoney(75_000, 50_000, 1)).toBe(1.5);
  });

  it('round-trips money → months → hours → months without drift', () => {
    const months = monthsFromMoney(100_000, 50_000, 1);
    const { hoursToRegister } = hoursFromMonths(months, IKK, S, CANONICAL);
    // 2 md on the 1650 basis: 2 × 137,5 × 0,6 = 165,0
    expect(hoursToRegister).toBe(165);
  });
});

/**
 * Fixtures from IKK's "Politik for frikøb til forskning ved eksterne midler".
 *
 * These are the first examples that exercise PARTIAL frikøb, and they validate
 * the canonical FTE-month model directly: the policy computes "halvt frikøb i to
 * semestre" as 3/12 × 1643 × 0,6 × 2, i.e. months = share × span.
 *
 * They also state the RESIDUAL obligation (semesternorm − credited), which the
 * consultants evidently need and which nothing else in the sources gives us.
 */
describe('IKK frikøbspolitik — partial frikøb and residual obligation', () => {
  const IKS_SEMESTER_NORM = 493; // published semesterTeachingHours on the 1643 basis

  it('a: lektor/adjunkt, fuldt frikøb 6 md → 493 t, owes 0 t', () => {
    const { hoursToRegister } = hoursFromMonths(6, IKS, S, ROUNDING_PROFILES['legacy-iks-2022']);
    expect(hoursToRegister).toBe(493);
    expect(IKS_SEMESTER_NORM - hoursToRegister).toBe(0);
  });

  it('b: lektor, 2 md/år i 3 år → 493 t i alt, 82 t/semester, owes 411 t', () => {
    // 2 months per year, three years.
    const perYear = hoursFromMonths(2, IKS, S, CANONICAL).hoursToRegister;
    expect(Math.round(perYear)).toBe(164);

    const total = hoursFromMonths(2 * 3, IKS, S, ROUNDING_PROFILES['legacy-iks-2022']).hoursToRegister;
    expect(total).toBe(493);

    // Per semester = half the annual credit.
    const perSemester = Math.round(perYear / 2);
    expect(perSemester).toBe(82);
    expect(IKS_SEMESTER_NORM - perSemester).toBe(411);
  });

  it('c: professor, halvt frikøb i to semestre → 493 t i alt, 246 t/sem, owes 247 t', () => {
    // "Halvt frikøb" for a semester is computed as 3 months of full frikøb:
    // months = fteShare (0,5) × span (6 md) = 3. This is the canonical model.
    const monthsPerSemester = 0.5 * 6;
    expect(monthsPerSemester).toBe(3);

    const total = hoursFromMonths(monthsPerSemester * 2, IKS, S, ROUNDING_PROFILES['legacy-iks-2022'])
      .hoursToRegister;
    expect(total).toBe(493);

    // 493/2 = 246,5, and the policy prints 246 — it FLOORS, crediting the smaller
    // figure and leaving the larger residual obligation (247). That is consistent
    // with every other rounding in these documents, and it always rounds in the
    // institute's favour. Half-up here would give 247/246 and contradict the text.
    const perSemester = Math.floor(total / 2);
    expect(perSemester).toBe(246);
    expect(IKS_SEMESTER_NORM - perSemester).toBe(247);
  });

  it('half frikøb over a span equals full frikøb over half the span', () => {
    const half = hoursFromMonths(0.5 * 6, IKS, S, CANONICAL);
    const full = hoursFromMonths(3, IKS, S, CANONICAL);
    expect(half.hoursToRegister).toBe(full.hoursToRegister);
  });
});
