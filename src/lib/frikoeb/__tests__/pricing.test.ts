/**
 * The cost stack.
 *
 * The headline behaviour under test is that overhead and margin have DIFFERENT
 * BASES, and that the base differs by mechanism. Everything else follows.
 */

import { describe, it, expect } from 'vitest';
import {
  computePrice,
  directSalaryFromTotal,
  salaryGrossUpFactor,
  operatingContribution,
  checkMarketFloor,
  type PricingPolicy,
} from '../pricing';

const IDV_2026: PricingPolicy = {
  mechanism: 'rekvireret_idv',
  asOf: '2026-06-01',
  overheadId: 'idv-105-2026',
  marginId: 'idv-min-10',
  applyMoms: true,
};

const TILSKUD: PricingPolicy = {
  mechanism: 'tilskudsfinansieret',
  asOf: '2026-06-01',
  overheadId: 'tilskud-44',
};

describe('overhead base differs by mechanism — the central fact', () => {
  const direct = { salaryKr: 100_000, operatingKr: 50_000 };

  it('IDV applies overhead to salary ONLY', () => {
    const p = computePrice(direct, { ...IDV_2026, marginId: undefined, applyMoms: false });
    // 105% of salary only — operating costs get none.
    expect(p.overheadKr).toBe(105_000);
    expect(p.totalCostsKr).toBe(255_000); // 100k + 50k + 105k
  });

  it('tilskud applies overhead to ALL direct costs', () => {
    const p = computePrice(direct, TILSKUD);
    // 44% of 150.000, not of 100.000.
    expect(p.overheadKr).toBe(66_000);
    expect(p.totalCostsKr).toBe(216_000);
  });

  it('the two would coincide if operating costs were zero — proving the base is what differs', () => {
    const salaryOnly = { salaryKr: 100_000, operatingKr: 0 };
    const idv = computePrice(salaryOnly, { ...IDV_2026, marginId: undefined, applyMoms: false });
    const til = computePrice(salaryOnly, TILSKUD);
    expect(idv.overheadKr).toBe(105_000);
    expect(til.overheadKr).toBe(44_000);
    // Same base, different rate. With operating costs the bases diverge too.
  });
});

describe("AU's own worked example — fondsansøgning page", () => {
  it('100.000 kr direct + 44% overhead = 144.000 kr ansøgt', () => {
    // Rotteforsøg 50.000 + biokemiske analyser 35.000 + publicering 15.000.
    const p = computePrice({ salaryKr: 0, operatingKr: 100_000 }, TILSKUD);
    expect(p.directTotalKr).toBe(100_000);
    expect(p.overheadKr).toBe(44_000);
    expect(p.headlineKr).toBe(144_000);
    expect(p.headlineLabel).toMatch(/ekskl\. moms/);
  });
});

describe('IDV full stack', () => {
  it('layers salary → overhead → margin → moms in order', () => {
    const p = computePrice({ salaryKr: 100_000, operatingKr: 0 }, IDV_2026);
    expect(p.overheadKr).toBe(105_000); // 105% of salary
    expect(p.totalCostsKr).toBe(205_000);
    expect(p.marginKr).toBe(20_500); // 10% of total costs
    expect(p.subtotalExMomsKr).toBe(225_500);
    expect(p.momsKr).toBe(56_375); // 25%
    expect(p.totalIncMomsKr).toBe(281_875);
    expect(p.headlineKr).toBe(281_875);
    expect(p.headlineLabel).toMatch(/inkl\. moms/);
  });

  it('monopoly drops the margin to zero but keeps overhead', () => {
    const p = computePrice(
      { salaryKr: 100_000, operatingKr: 0 },
      { ...IDV_2026, marginId: 'idv-monopol-0' },
    );
    expect(p.marginKr).toBe(0);
    expect(p.overheadKr).toBe(105_000);
  });

  it('uses 110% for 2024 and 105% for 2026', () => {
    const a = computePrice(
      { salaryKr: 100_000, operatingKr: 0 },
      { ...IDV_2026, asOf: '2024-06-01', overheadId: 'idv-110-2023', marginId: undefined, applyMoms: false },
    );
    expect(a.overheadKr).toBe(110_000);
  });

  it('refuses a policy that is not in force on the given date', () => {
    expect(() =>
      computePrice({ salaryKr: 1, operatingKr: 0 }, { ...IDV_2026, asOf: '2024-06-01' }),
    ).toThrow(/gælder ikke pr\./);
  });
});

describe('double-counting overhead is made structurally visible', () => {
  it('an inclusive rate adds no overhead and says why', () => {
    const p = computePrice(
      { salaryKr: 100_000, operatingKr: 0 },
      { mechanism: 'samfinansieret', asOf: '2026-06-01', overheadId: 'inkluderet-i-timesats' },
    );
    expect(p.overheadKr).toBe(0);
    expect(p.warnings.map((w) => w.code)).toContain('OVERHEAD_INCLUDED_IN_RATE');
    expect(p.warnings.find((w) => w.code === 'OVERHEAD_INCLUDED_IN_RATE')!.message).toMatch(
      /dobbeltberegning/,
    );
  });

  it('zero overhead warns that an agreement with the institutleder is required', () => {
    const p = computePrice(
      { salaryKr: 100_000, operatingKr: 0 },
      { mechanism: 'tilskudsfinansieret', asOf: '2026-06-01', overheadId: 'ingen-0' },
    );
    expect(p.warnings.map((w) => w.code)).toContain('NO_OVERHEAD_REQUIRES_AGREEMENT');
  });
});

describe('inversion is exact and closed-form', () => {
  it('salary → total → salary round-trips', () => {
    for (const operating of [0, 25_000, 250_000]) {
      for (const salary of [50_000, 137_500, 1_000_000]) {
        const p = computePrice({ salaryKr: salary, operatingKr: operating }, IDV_2026);
        const back = directSalaryFromTotal(p.totalIncMomsKr, operating, IDV_2026);
        expect(Math.abs(back - salary)).toBeLessThan(1);
      }
    }
  });

  it('round-trips for grant funding too', () => {
    const p = computePrice({ salaryKr: 400_000, operatingKr: 90_000 }, TILSKUD);
    const back = directSalaryFromTotal(p.subtotalExMomsKr, 90_000, TILSKUD);
    expect(Math.abs(back - 400_000)).toBeLessThan(1);
  });

  it('the gross-up factor matches the full computation', () => {
    const k = salaryGrossUpFactor(IDV_2026);
    const c = operatingContribution(0, IDV_2026);
    const p = computePrice({ salaryKr: 100_000, operatingKr: 0 }, IDV_2026);
    expect(Math.abs(100_000 * k + c - p.totalIncMomsKr)).toBeLessThan(1);
  });

  it('total is monotonic in salary', () => {
    const lo = computePrice({ salaryKr: 100_000, operatingKr: 10_000 }, IDV_2026);
    const hi = computePrice({ salaryKr: 200_000, operatingKr: 10_000 }, IDV_2026);
    expect(hi.totalIncMomsKr).toBeGreaterThan(lo.totalIncMomsKr);
  });
});

describe('money conservation', () => {
  it('the layers sum to the total', () => {
    const p = computePrice({ salaryKr: 123_456, operatingKr: 78_910 }, IDV_2026);
    const sum = p.directTotalKr + p.overheadKr + p.marginKr + p.momsKr;
    expect(Math.abs(sum - p.totalIncMomsKr)).toBeLessThanOrEqual(1); // rounding only
  });
});

describe('market floor — AU må ikke underbyde markedet', () => {
  it('blocks when the effective rate is below the guiding takst', () => {
    // 100.000 kr over 200 hours = 500 kr/t, well under a lektor's 1.220.
    const w = checkMarketFloor(100_000, 200, 1220);
    expect(w?.severity).toBe('block');
    expect(w?.message).toMatch(/underbyde markedet/);
  });

  it('passes when at or above the guiding takst', () => {
    expect(checkMarketFloor(300_000, 200, 1220)).toBeNull();
  });

  it('is skipped when no guiding rate applies', () => {
    expect(checkMarketFloor(100_000, 200, null)).toBeNull();
  });
});
