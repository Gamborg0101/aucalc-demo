/**
 * Kostpris.
 *
 * The load-bearing test is that the published formula reproduces the published
 * table. If those two ever diverge, one of them has been transcribed wrong.
 */

import { describe, it, expect } from 'vitest';
import {
  MAANEDENS_TIMER,
  PAYROLL_ANNUAL_HOURS,
  kostprisPerHour,
  kostprisPerMonth,
  kostprisParamsFor,
  suPhdKostprisPerHour,
  takstFor,
} from '../config/kostpris';

describe('the formula reproduces the published table', () => {
  it('lektor 2026: 68.000 månedsløn → ~442 kr/t → ~70.000 kr/md', () => {
    // (68.000 / 160,33) × 1,03 + 5,18
    const perHour = kostprisPerHour(68_000, 2026);
    expect(perHour).toBeCloseTo(442.03, 1);

    const perMonth = kostprisPerMonth(68_000, 2026);
    // Takstkatalog publishes 70.000 (middel, rounded UP to whole thousands).
    expect(perMonth).toBeGreaterThan(70_000);
    expect(perMonth).toBeLessThan(71_500);
  });

  it('160,33 is 1924/12', () => {
    expect(MAANEDENS_TIMER).toBeCloseTo(PAYROLL_ANNUAL_HOURS / 12, 2);
  });

  it('kostpris scales linearly in salary above the fixed bidrag', () => {
    const a = kostprisPerHour(50_000, 2026);
    const b = kostprisPerHour(100_000, 2026);
    const { bidragKrPerHour } = kostprisParamsFor(2026);
    expect(b - bidragKrPerHour).toBeCloseTo(2 * (a - bidragKrPerHour), 6);
  });
});

describe('parameters are dated and complete', () => {
  it('has 2026 values', () => {
    const p = kostprisParamsFor(2026);
    expect(p.feriefaktor).toBe(1.03);
    expect(p.bidragKrPerHour).toBe(5.18);
  });

  it('covers every year 2015–2026 with no gaps', () => {
    for (let y = 2015; y <= 2026; y++) {
      expect(() => kostprisParamsFor(y), `year ${y}`).not.toThrow();
    }
  });

  it('refuses an unknown year rather than guessing', () => {
    expect(() => kostprisParamsFor(2030)).toThrow(/Ingen kostprisparametre/);
  });
});

describe('SU-ph.d. uses its own formula', () => {
  it('2026: (2 × 7.426) / 160,33 ≈ 92,6 kr/t', () => {
    expect(suPhdKostprisPerHour(2026)).toBeCloseTo(92.63, 1);
  });

  it('is far below a salaried ph.d., as expected', () => {
    expect(suPhdKostprisPerHour(2026)).toBeLessThan(kostprisPerHour(43_000, 2026));
  });
});

describe('Takstkatalog lookups', () => {
  it('returns the published lektor figures for 2026', () => {
    expect(takstFor('121', 2026, 'lav')).toBe(65_000);
    expect(takstFor('121', 2026, 'median')).toBe(68_000);
    expect(takstFor('121', 2026, 'hoej')).toBe(73_000);
    expect(takstFor('121', 2026, 'middel')).toBe(70_000);
  });

  it('carries projections through 2029', () => {
    expect(takstFor('111', 2029, 'middel')).toBe(96_000);
    expect(takstFor('121', 2029, 'median')).toBe(75_000);
  });

  it('rises monotonically across the projection years', () => {
    for (const code of ['111', '121', '131', '137']) {
      for (const q of ['lav', 'median', 'hoej'] as const) {
        for (let y = 2026; y < 2029; y++) {
          const a = takstFor(code, y, q)!;
          const b = takstFor(code, y + 1, q)!;
          expect(b, `${code} ${q} ${y}→${y + 1}`).toBeGreaterThanOrEqual(a);
        }
      }
    }
  });

  it('orders the quartiles correctly', () => {
    for (const code of ['111', '114', '121', '131', '212', '421', '431', '451', '461', '465', '466']) {
      const lav = takstFor(code, 2026, 'lav')!;
      const median = takstFor(code, 2026, 'median')!;
      const hoej = takstFor(code, 2026, 'hoej')!;
      expect(lav, code).toBeLessThanOrEqual(median);
      expect(median, code).toBeLessThanOrEqual(hoej);
    }
  });

  it('returns null rather than guessing for an unknown year or code', () => {
    expect(takstFor('121', 2035, 'median')).toBeNull();
    expect(takstFor('999', 2026, 'median')).toBeNull();
  });

  it('a professor costs more than a lektor costs more than an adjunkt', () => {
    const prof = takstFor('111', 2026, 'median')!;
    const lektor = takstFor('121', 2026, 'median')!;
    const adjunkt = takstFor('131', 2026, 'median')!;
    expect(prof).toBeGreaterThan(lektor);
    expect(lektor).toBeGreaterThan(adjunkt);
  });
});

describe('TAP rows added after the initial build (431/451/461/465/466)', () => {
  it('returns the published 2026 figures', () => {
    expect(takstFor('431', 2026, 'lav')).toBe(41_000);
    expect(takstFor('431', 2026, 'median')).toBe(46_000);
    expect(takstFor('431', 2026, 'hoej')).toBe(50_000);
    expect(takstFor('431', 2026, 'middel')).toBe(46_000);

    expect(takstFor('466', 2026, 'lav')).toBe(41_000);
    expect(takstFor('466', 2026, 'median')).toBe(49_000);
    expect(takstFor('466', 2026, 'hoej')).toBe(57_000);
    expect(takstFor('466', 2026, 'middel')).toBe(49_000);
  });

  it('carries projections through 2029, matching the source document', () => {
    expect(takstFor('451', 2029, 'middel')).toBe(59_000);
    expect(takstFor('461', 2029, 'median')).toBe(54_000);
    expect(takstFor('465', 2029, 'middel')).toBe(49_000);
  });
});

describe('the stale 2022 figure is not lurking anywhere', () => {
  it('no 2026 VIP category has a median as low as the old 50.000 lektor figure', () => {
    for (const code of ['111', '114', '121', '124']) {
      expect(takstFor(code, 2026, 'median')!, code).toBeGreaterThan(50_000);
    }
  });

  it('the real lektor figure is ~40% above the 2022 notat', () => {
    const ratio = kostprisPerMonth(68_000, 2026) / 50_000;
    expect(ratio).toBeGreaterThan(1.35);
  });
});
