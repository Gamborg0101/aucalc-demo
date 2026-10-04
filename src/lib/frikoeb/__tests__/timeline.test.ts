/**
 * Multi-year projects: compounding indexation, per-year Vipomatic hours, and the
 * exact budget → duration inverse.
 */

import { describe, it, expect } from 'vitest';
import { buildSegments, monthsFromBudget, monthsFromRegisteredHoursTimeline, aggregateHours } from '../timeline';
import { indexFactor, selectIndexation } from '../config/indexation';
import { CANONICAL } from '../rounding';

const S = 0.6;

describe('indexation compounds', () => {
  it('2% over three years is 1,02³, not 1,06', () => {
    const p = selectIndexation('budget-2pct');
    const f = indexFactor(p, 2026, 2029);
    expect(f).toBeCloseTo(1.02 ** 3, 9);
    expect(f).toBeGreaterThan(1.06); // the naive flat-sum answer
  });

  it('compounds multiplicatively, as the "rentes rente" example intends', () => {
    // We deliberately do NOT assert the spreadsheet's printed result of 220,65.
    //
    // Its own worked figures do not reconcile: it prints
    //   "(210,94) × (1 + 0,020) = 220,64"
    // but 210,94 × 1,02 = 215,16. The final factor would have to be 4,6%. Either
    // the examples are wrong or our column extraction misaligned the rates against
    // the example rows — and we cannot tell which from the extract.
    //
    // So we assert only the mechanism the example demonstrates (compounding, not
    // a flat sum) and leave the rates flagged unverified in config.
    const p = selectIndexation('faktisk-pl');
    const f = indexFactor(p, 2025, 2029);
    const rates = [0.029, 0.0, 0.025, 0.02];
    expect(f).toBeCloseTo(rates.reduce((a, r) => a * (1 + r), 1), 9);
    // Compounding exceeds the naive flat sum of the same rates.
    expect(f).toBeGreaterThan(1 + rates.reduce((a, r) => a + r, 0) - 1e-9);
  });

  it('flags the unverified P/L table so it cannot be used unknowingly', () => {
    expect(selectIndexation('faktisk-pl').label).toMatch(/UVERIFICERET/);
    expect(selectIndexation('faktisk-pl').note).toMatch(/BRUG IKKE TIL BINDENDE BUDGETTER/);
    // The recommended budgeting policy carries no such caveat.
    expect(selectIndexation('budget-2pct').label).not.toMatch(/UVERIFICERET/);
  });

  it('is 1 for the base year and never looks backwards', () => {
    const p = selectIndexation('budget-2pct');
    expect(indexFactor(p, 2026, 2026)).toBe(1);
    expect(indexFactor(p, 2026, 2024)).toBe(1);
  });

  it('"ingen" leaves amounts in fixed prices', () => {
    expect(indexFactor(selectIndexation('ingen'), 2026, 2030)).toBe(1);
  });

  it('refuses a year it has no published rate for rather than assuming one', () => {
    expect(() => indexFactor(selectIndexation('faktisk-pl'), 2026, 2040)).toThrow(/Ingen P\/L-sats/);
  });
});

describe('segments — Vipomatic hours are reported per year', () => {
  it('splits 18 months from mid-2026 across two calendar years', () => {
    // Jul–Dec 2026 = 6 md, Jan–Dec 2027 = 12 md. Exactly 18, ending December 2027.
    const r = buildSegments(18, '2026-07-01', 70_000, S, CANONICAL);
    expect(r.segments.map((s) => s.year)).toEqual([2026, 2027]);
    expect(r.segments[0].months).toBe(6);
    expect(r.segments[1].months).toBe(12);
    expect(r.totalMonths).toBe(18);
  });

  it('spills into a third year once it exceeds 18 months', () => {
    const r = buildSegments(20, '2026-07-01', 70_000, S, CANONICAL);
    expect(r.segments.map((s) => s.year)).toEqual([2026, 2027, 2028]);
    expect(r.segments[2].months).toBe(2);
  });

  it('gives each year its own hour figure, which is what gets typed in', () => {
    const r = buildSegments(18, '2026-07-01', 70_000, S, CANONICAL);
    for (const s of r.segments) {
      expect(s.hoursToRegister).toBeGreaterThan(0);
      expect(s.hoursToRegisterWhole).toBeLessThanOrEqual(s.hoursToRegister);
    }
    const summed = r.segments.reduce((a, s) => a + s.hoursToRegister, 0);
    expect(Math.abs(summed - r.totalHoursToRegister)).toBeLessThan(0.2);
  });

  it('applies a higher monthly cost in later years', () => {
    const r = buildSegments(24, '2026-01-01', 70_000, S, CANONICAL);
    expect(r.segments[1].monthlyCostKr).toBeGreaterThan(r.segments[0].monthlyCostKr);
    expect(r.segments[0].indexFactor).toBe(1);
  });

  it('costs more than the un-indexed calculation would suggest', () => {
    const indexed = buildSegments(24, '2026-01-01', 70_000, S, CANONICAL).totalCostKr;
    const flat = 24 * 70_000;
    expect(indexed).toBeGreaterThan(flat);
  });

  it('resolves the norm per year — a mid-project revision is handled', () => {
    // 2023 is on the 1643 basis; 2024 onwards on 1650.
    const r = buildSegments(18, '2023-07-01', 70_000, S, CANONICAL);
    expect(r.segments[0].norm.annualWorkHours).toBe(1643);
    expect(r.segments[1].norm.annualWorkHours).toBe(1650);
  });

  it('handles a single short project without segmenting', () => {
    const r = buildSegments(3, '2026-02-01', 70_000, S, CANONICAL);
    expect(r.segments).toHaveLength(1);
    expect(r.segments[0].months).toBe(3);
  });

  it('handles fractional months', () => {
    const r = buildSegments(1.5, '2026-01-01', 70_000, S, CANONICAL);
    expect(r.totalMonths).toBe(1.5);
    expect(r.segments[0].months).toBe(1.5);
  });

  it('rejects a negative duration', () => {
    expect(() => buildSegments(-1, '2026-01-01', 70_000, S, CANONICAL)).toThrow(/negativt/);
  });
});

describe('budget → duration is exact', () => {
  it('round-trips against buildSegments', () => {
    for (const months of [1, 6, 13, 27]) {
      const cost = buildSegments(months, '2026-01-01', 70_000, S, CANONICAL).totalCostKr;
      const back = monthsFromBudget(cost, '2026-01-01', 70_000);
      expect(Math.abs(back - months), `${months} md`).toBeLessThan(0.02);
    }
  });

  it('buys fewer months than the naive calculation once indexation bites', () => {
    const naive = 2_100_000 / 70_000; // 30 months, ignoring uplift
    const real = monthsFromBudget(2_100_000, '2026-01-01', 70_000);
    expect(real).toBeLessThan(naive);
  });

  it('matches the naive answer within one year, where no uplift has applied', () => {
    expect(monthsFromBudget(6 * 70_000, '2026-01-01', 70_000)).toBeCloseTo(6, 6);
  });

  it('is monotonic in budget', () => {
    let prev = 0;
    for (const b of [100_000, 500_000, 1_000_000, 5_000_000]) {
      const m = monthsFromBudget(b, '2026-01-01', 70_000);
      expect(m).toBeGreaterThan(prev);
      prev = m;
    }
  });

  it('returns zero for no money and refuses a nonsensical cost price', () => {
    expect(monthsFromBudget(0, '2026-01-01', 70_000)).toBe(0);
    expect(() => monthsFromBudget(100, '2026-01-01', 0)).toThrow(/positiv/);
  });

  it('refuses an absurd budget rather than looping forever', () => {
    expect(() => monthsFromBudget(1e12, '2026-01-01', 70_000)).toThrow(/rækker ud over/);
  });
});

describe('employmentFraction scales the per-segment norm', () => {
  it('halves each segment\'s hours to register, leaving cost untouched', () => {
    const full = buildSegments(18, '2026-07-01', 70_000, S, CANONICAL);
    const half = buildSegments(18, '2026-07-01', 70_000, S, CANONICAL, 'budget-2pct', 0.5);
    for (let i = 0; i < full.segments.length; i++) {
      expect(half.segments[i].hoursToRegister).toBeCloseTo(full.segments[i].hoursToRegister / 2, 6);
      expect(half.segments[i].norm.annualWorkHours).toBeCloseTo(full.segments[i].norm.annualWorkHours / 2, 6);
      expect(half.segments[i].costKr).toBe(full.segments[i].costKr);
    }
  });

  it('defaults to full-time, matching an explicit 1', () => {
    const implicit = buildSegments(6, '2026-01-01', 70_000, S, CANONICAL);
    const explicit = buildSegments(6, '2026-01-01', 70_000, S, CANONICAL, 'budget-2pct', 1);
    expect(implicit).toEqual(explicit);
  });
});

describe('aggregateHours — summing per-year breakdowns into one headline figure', () => {
  it('sums work, teaching and research hours across segments', () => {
    const r = buildSegments(18, '2026-07-01', 70_000, S, CANONICAL);
    const agg = aggregateHours(r.segments);
    const sumWork = r.segments.reduce((a, s) => a + s.hours.workHours, 0);
    expect(agg.workHours).toBeCloseTo(sumWork, 1);
    expect(agg.teachingHours + agg.researchHours).toBeCloseTo(agg.workHours, 1);
  });

  it('sums the per-year floors rather than flooring the sum', () => {
    const r = buildSegments(18, '2026-07-01', 70_000, S, CANONICAL);
    const agg = aggregateHours(r.segments);
    const sumOfFloors = r.segments.reduce((a, s) => a + s.hoursToRegisterWhole, 0);
    expect(agg.hoursToRegisterWhole).toBe(sumOfFloors);
  });

  it('recomputes workDays from total work hours, not by summing per-segment days', () => {
    const r = buildSegments(18, '2026-07-01', 70_000, S, CANONICAL);
    const agg = aggregateHours(r.segments);
    expect(agg.workDays).toBe(Math.floor(agg.workHours / 7.24));
  });

  it('matches the single-period calculation for a project inside one year', () => {
    const r = buildSegments(3, '2026-02-01', 70_000, S, CANONICAL);
    const agg = aggregateHours(r.segments);
    expect(agg.hoursToRegister).toBeCloseTo(r.segments[0].hours.hoursToRegister, 6);
  });
});

describe('monthsFromRegisteredHoursTimeline — the hours-axis inverse', () => {
  it('round-trips against buildSegments\' per-year hours', () => {
    const r = buildSegments(18, '2026-07-01', 70_000, S, CANONICAL);
    const totalHours = r.segments.reduce((a, s) => a + s.hours.hoursToRegister, 0);
    const back = monthsFromRegisteredHoursTimeline(totalHours, '2026-07-01', S);
    expect(Math.abs(back - 18)).toBeLessThan(0.01);
  });

  it('handles a mid-project norm change (2023 → 2024) exactly like buildSegments', () => {
    const r = buildSegments(18, '2023-07-01', 70_000, S, CANONICAL);
    const totalHours = r.segments.reduce((a, s) => a + s.hours.hoursToRegister, 0);
    const back = monthsFromRegisteredHoursTimeline(totalHours, '2023-07-01', S);
    expect(Math.abs(back - 18)).toBeLessThan(0.01);
  });

  it('scales with employmentFraction', () => {
    const full = monthsFromRegisteredHoursTimeline(495, '2026-01-01', S);
    const half = monthsFromRegisteredHoursTimeline(495, '2026-01-01', S, 0.5);
    // Half-time needs twice the months to register the same hours.
    expect(half).toBeCloseTo(full * 2, 6);
  });

  it('returns zero for no hours and refuses a non-positive share', () => {
    expect(monthsFromRegisteredHoursTimeline(0, '2026-01-01', S)).toBe(0);
    expect(() => monthsFromRegisteredHoursTimeline(100, '2026-01-01', 0)).toThrow(/positiv/);
  });

  it('is monotonic in the target hours', () => {
    let prev = 0;
    for (const target of [50, 200, 500, 1000]) {
      const m = monthsFromRegisteredHoursTimeline(target, '2026-01-01', S);
      expect(m).toBeGreaterThan(prev);
      prev = m;
    }
  });

  it('refuses an absurd target rather than looping forever', () => {
    expect(() => monthsFromRegisteredHoursTimeline(1e9, '2026-01-01', S)).toThrow(/rækker ud over/);
  });
});
