/**
 * Solver behaviour: bidirectionality, round-trip identity, and the guardrails
 * that stop the engine producing a confident wrong number.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { solve, type Scenario } from '../solve';
import { traceToMarkdown } from '../trace';
import { DEFAULT_UNDERVISNINGS_BASIS } from '../types';

const base: Scenario = {
  asOf: '2026-01-01',
  category: 'lektor',
  variant: 'fuldt',
  monthlyCostKr: 50_000,
  solveFor: 'months',
  given: { moneyKr: 100_000 },
};

describe('bidirectionality', () => {
  it('money → months', () => {
    const r = solve(base);
    expect(r.months).toBe(2);
    // 2 md on the 1650 basis: 2 × 137,5 × 0,6 = 165
    expect(r.hours.hoursToRegister).toBe(165);
  });

  it('months → money', () => {
    const r = solve({ ...base, solveFor: 'money', given: { months: 2 } });
    expect(r.moneyKr).toBe(100_000);
  });

  it('hours → months', () => {
    const r = solve({ ...base, solveFor: 'months', given: { hoursRegistered: 165 } });
    expect(r.months).toBeCloseTo(2, 10);
  });

  it('money → months → money is the identity', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1_000, max: 5_000_000 }),
        fc.integer({ min: 20_000, max: 150_000 }),
        (amount, cost) => {
          const fwd = solve({ ...base, monthlyCostKr: cost, given: { moneyKr: amount } });
          const back = solve({
            ...base,
            monthlyCostKr: cost,
            solveFor: 'money',
            given: { months: fwd.months },
          });
          expect(Math.abs(back.moneyKr - amount)).toBeLessThanOrEqual(0.5);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('is monotonic: more money never buys fewer months', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1_000, max: 1_000_000 }),
        fc.integer({ min: 1, max: 500_000 }),
        (a, delta) => {
          const lo = solve({ ...base, given: { moneyKr: a } });
          const hi = solve({ ...base, given: { moneyKr: a + delta } });
          expect(hi.months).toBeGreaterThanOrEqual(lo.months);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('teaching + research always equals total work hours', () => {
    fc.assert(
      fc.property(fc.integer({ min: 1_000, max: 2_000_000 }), (amount) => {
        const r = solve({ ...base, given: { moneyKr: amount } });
        const sum = r.hours.teachingHours + r.hours.researchHours;
        expect(Math.abs(sum - r.hours.workHours)).toBeLessThanOrEqual(0.15);
      }),
      { numRuns: 200 },
    );
  });
});

describe('guardrails — the engine must refuse rather than guess', () => {
  it('refuses postdoc without an explicit share (no fixed norm exists)', () => {
    expect(() => solve({ ...base, category: 'postdoc' })).toThrow(/ingen fast timenorm/i);
  });

  it('accepts postdoc once a share is supplied', () => {
    const r = solve({ ...base, category: 'postdoc', registeredShareOverride: 0.2 });
    expect(r.registeredShare).toBe(0.2);
  });

  it('refuses undervisningsfrikøb without a stated basis', () => {
    expect(() => solve({ ...base, variant: 'undervisning' })).toThrow(/undervisningsBasis/);
  });

  it('the two undervisningsfrikøb readings differ by 1/0,6', () => {
    const a = solve({ ...base, variant: 'undervisning', undervisningsBasis: 'salary_scaled' });
    const b = solve({ ...base, variant: 'undervisning', undervisningsBasis: 'full_month_equivalent' });
    expect(a.months / b.months).toBeCloseTo(1 / 0.6, 6);
  });

  it('DEFAULT_UNDERVISNINGS_BASIS is salary_scaled, confirmed 2026-08-31 by a research consultant', () => {
    expect(DEFAULT_UNDERVISNINGS_BASIS).toBe('salary_scaled');
  });

  it('selects the norm by date: 2023 uses 1643, 2026 uses 1650', () => {
    expect(solve({ ...base, asOf: '2023-06-01' }).norm.annualWorkHours).toBe(1643);
    expect(solve({ ...base, asOf: '2026-06-01' }).norm.annualWorkHours).toBe(1650);
  });

  it('floors the Vipomatic integer and surfaces what was discarded', () => {
    const r = solve({ ...base, given: { moneyKr: 75_000 } });
    expect(r.hours.hoursToRegisterWhole).toBeLessThanOrEqual(r.hours.hoursToRegister);
    expect(r.hours.discardedByFlooring).toBeGreaterThanOrEqual(0);
    expect(r.hours.discardedByFlooring).toBeLessThan(1);
  });
});

describe('whole-month snapping is visible, never silent', () => {
  it('snaps down and records the residual', () => {
    const r = solve({ ...base, given: { moneyKr: 75_000 }, snapToWholeMonths: 'down' });
    expect(r.months).toBe(1);
    expect(r.monthsSnapped).toBe(1);
    const step = r.trace.steps.find((s) => s.id === 'tid.maaneder.afrundet');
    expect(step?.rounding?.before).toBe(1.5);
    expect(step?.note).toMatch(/Restbeløb/);
  });

  it('flags non-whole months when snapping is off', () => {
    const r = solve({ ...base, given: { moneyKr: 75_000 } });
    expect(r.warnings.map((w) => w.code)).toContain('NOT_WHOLE_SALARY_MONTHS');
  });
});

describe('the trace is the product', () => {
  it('every bound result field points at a step that exists', () => {
    const r = solve(base);
    const ids = new Set(r.trace.steps.map((s) => s.id));
    for (const [path, stepId] of Object.entries(r.trace.resultRefs)) {
      expect(ids.has(stepId), `${path} → ${stepId}`).toBe(true);
    }
  });

  it('cites its sources for every constant', () => {
    const r = solve(base);
    const constants = r.trace.steps.filter((s) => s.kind === 'constant');
    expect(constants.length).toBeGreaterThan(0);
    for (const c of constants) expect(c.sourceRef, c.id).toBeDefined();
  });

  it('states the Vipomatic rule explicitly', () => {
    // The rule lives in the "Forskningstid i projektet (registreres ikke)" row's own
    // label now (R33 trimmed the separate restating sentence as redundant with it).
    const md = traceToMarkdown(solve(base).trace);
    expect(md).toMatch(/Forskningstid.*\(registreres ikke\)/);
  });

  it('explains why the whole-hour figure matters, not just that it is floored', () => {
    // Vipomatic doesn't round a manually-typed figure itself (confirmed 2026-09-22,
    // docs/open-questions.md R31) — the trace should say why the consultant must type
    // the floored whole number, not just that flooring happened.
    const step = solve(base).trace.steps.find((s) => s.id === 'vipomatic.timer');
    expect(step?.note).toMatch(/runder ikke/);
  });

  it('renders readable Danish markdown', () => {
    const md = traceToMarkdown(solve(base).trace);
    expect(md).toContain('## Forudsætninger');
    expect(md).toContain('## Vipomatic-registrering');
    expect(md).toContain('Kilde:');
  });
});

describe('units in the derivation must be correct', () => {
  it('labels a discarded month as months, not hours', () => {
    const r = solve({ ...base, given: { moneyKr: 75_000 }, snapToWholeMonths: 'down' });
    const md = traceToMarkdown(r.trace);
    expect(md).toMatch(/0,5 md bortfalder/);
    expect(md).not.toMatch(/nedrundet fra 1,5 til 1 \(0,5 t/);
  });

  it('labels discarded hours as hours', () => {
    const r = solve({ ...base, given: { moneyKr: 75_000 }, snapToWholeMonths: 'down' });
    const md = traceToMarkdown(r.trace);
    expect(md).toMatch(/0,5 t bortfalder/);
  });
});

describe('workDays — arbejdsdage, confirmed 2026-09-01', () => {
  it('divides total work hours by the confirmed 7,24 t full work day, floored to whole days', () => {
    // months = 100_000 / 50_000 = 2; workHours = 2 × 1650/12 = 275; 275/7,24 = 37,9834… → 37
    const r = solve(base);
    expect(r.hours.workDays).toBe(37);
  });

  it('always equals floor(workHours / 7,24), regardless of variant or undervisningsBasis', () => {
    const a = solve({ ...base, variant: 'undervisning', undervisningsBasis: 'salary_scaled' });
    const b = solve({ ...base, variant: 'undervisning', undervisningsBasis: 'full_month_equivalent' });
    expect(a.hours.workDays).toBe(Math.floor(a.hours.workHours / 7.24));
    expect(b.hours.workDays).toBe(Math.floor(b.hours.workHours / 7.24));
  });
});

describe('cost stack wired into solve()', () => {
  const priced: Scenario = {
    ...base,
    solveFor: 'money',
    given: { months: 6 },
    monthlyCostKr: 70_000,
    pricing: {
      mechanism: 'rekvireret_idv',
      asOf: '2026-06-01',
      overheadId: 'idv-105-2026',
      marginId: 'idv-min-10',
      applyMoms: true,
    },
    operatingKr: 50_000,
  };

  it('returns no price when no pricing policy is given', () => {
    expect(solve(base).price).toBeNull();
  });

  it('builds the full stack on top of the salary figure', () => {
    const r = solve(priced);
    expect(r.moneyKr).toBe(420_000); // 6 md × 70.000
    expect(r.price).not.toBeNull();
    expect(r.price!.overheadKr).toBe(441_000); // 105% of salary ONLY, not of 470.000
    expect(r.price!.directOperatingKr).toBe(50_000);
    expect(r.price!.headlineKr).toBeGreaterThan(r.moneyKr);
  });

  it('grant overhead applies to operating costs too — IDV does not', () => {
    const idv = solve(priced).price!;
    const grant = solve({
      ...priced,
      pricing: { mechanism: 'tilskudsfinansieret', asOf: '2026-06-01', overheadId: 'tilskud-44' },
    }).price!;
    // IDV: 105% × 420.000 = 441.000. Grant: 44% × 470.000 = 206.800.
    expect(idv.overheadKr).toBe(441_000);
    expect(grant.overheadKr).toBe(206_800);
  });

  it('renders the cost stack into the trace', () => {
    const md = traceToMarkdown(solve(priced).trace);
    expect(md).toMatch(/Overhead/);
    expect(md).toMatch(/Overskudsgrad/);
    expect(md).toMatch(/Moms/);
  });

  it('surfaces cost-stack warnings on the result', () => {
    const r = solve({
      ...priced,
      pricing: { mechanism: 'samfinansieret', asOf: '2026-06-01', overheadId: 'inkluderet-i-timesats' },
    });
    expect(r.warnings.map((w) => w.code)).toContain('OVERHEAD_INCLUDED_IN_RATE');
  });
});

describe('market floor check', () => {
  const cheap: Scenario = {
    ...base,
    solveFor: 'money',
    given: { months: 6 },
    monthlyCostKr: 20_000, // deliberately far too low
    pricing: {
      mechanism: 'rekvireret_idv',
      asOf: '2026-06-01',
      overheadId: 'idv-105-2026',
      marginId: 'idv-min-10',
    },
    marketFloorTableId: 'kommerciel-2019',
  };

  it('blocks when the effective hourly price undercuts the guiding takst', () => {
    const r = solve(cheap);
    const w = r.warnings.find((x) => x.code === 'BELOW_MARKET_FLOOR');
    expect(w?.severity).toBe('block');
    expect(w?.message).toMatch(/underbyde markedet/);
  });

  it('passes at a realistic cost price', () => {
    const r = solve({ ...cheap, monthlyCostKr: 70_000 });
    expect(r.warnings.map((w) => w.code)).not.toContain('BELOW_MARKET_FLOOR');
  });

  it('warns that the 2019 rates are stale', () => {
    expect(solve(cheap).warnings.map((w) => w.code)).toContain('RATE_TABLE_STALE');
  });

  it('skips the check for a category with no published rate', () => {
    const r = solve({
      ...cheap,
      category: 'studieadjunkt_studielektor',
      monthlyCostKr: 70_000,
    });
    expect(r.warnings.map((w) => w.code)).toContain('NO_GUIDING_RATE_FOR_CATEGORY');
  });
});

describe('residual obligation — what the researcher still owes', () => {
  it('fuldt frikøb for a semester leaves nothing owed', () => {
    // IKK politik eksempel a: 6 md → 495 t → owes 0.
    const r = solve({ ...base, solveFor: 'money', given: { months: 6 } });
    expect(r.residual.remainingObligationHours).toBe(0);
  });

  it('one month of frikøb leaves most of the semester still owed', () => {
    const r = solve({ ...base, solveFor: 'money', given: { months: 1 } });
    // 1 md on the 1650 basis credits 82,5 t against a 495 t semester norm.
    expect(r.residual.semesterNormHours).toBe(495);
    expect(r.residual.remainingObligationHours).toBe(413); // 495 − 82
  });

  it('never goes negative when frikøb exceeds a semester', () => {
    const r = solve({ ...base, solveFor: 'money', given: { months: 24 } });
    expect(r.residual.remainingObligationHours).toBe(0);
  });

  it('appears in the trace', () => {
    const md = traceToMarkdown(solve({ ...base, solveFor: 'money', given: { months: 1 } }).trace);
    expect(md).toMatch(/Restforpligtelse/);
  });
});

describe('employmentFraction — part-time staff', () => {
  it('defaults to full-time and matches omitting the field entirely', () => {
    const withDefault = solve(base);
    const withExplicit1 = solve({ ...base, employmentFraction: 1 });
    expect(withExplicit1.hours.hoursToRegister).toBe(withDefault.hours.hoursToRegister);
    expect(withExplicit1.norm.annualWorkHours).toBe(1650);
  });

  it('scales the effective annual hours proportionally', () => {
    const full = solve(base);
    const half = solve({ ...base, employmentFraction: 0.5 });
    expect(half.norm.annualWorkHours).toBe(825); // 1650 × 0,5
    expect(half.hours.hoursToRegister).toBeCloseTo(full.hours.hoursToRegister / 2, 6);
  });

  it('scales the semester teaching norm used in the residual check', () => {
    const full = solve({ ...base, solveFor: 'money', given: { months: 6 } });
    const half = solve({ ...base, solveFor: 'money', given: { months: 6 }, employmentFraction: 0.5 });
    expect(full.residual.semesterNormHours).toBe(495);
    expect(half.residual.semesterNormHours).toBe(247.5); // a part-time semesternorm is not the full-time figure
  });

  it('does not change the teaching/research split ratio, only the total hours', () => {
    const half = solve({ ...base, employmentFraction: 0.5 });
    expect(half.hours.teachingHours / half.hours.workHours).toBeCloseTo(0.6, 6);
  });

  it('refuses a fraction of zero or below — the engine must not silently divide by zero downstream', () => {
    expect(() => solve({ ...base, employmentFraction: 0 })).toThrow(/beskæftigelsesgrad/i);
    expect(() => solve({ ...base, employmentFraction: -0.5 })).toThrow(/beskæftigelsesgrad/i);
  });

  it('refuses a fraction above 1 — this is deltid, not overarbejde', () => {
    expect(() => solve({ ...base, employmentFraction: 1.2 })).toThrow(/beskæftigelsesgrad/i);
  });

  it('shows the scaling step in the trace only when actually part-time', () => {
    const full = solve(base);
    const half = solve({ ...base, employmentFraction: 0.5 });
    expect(full.trace.steps.some((s) => s.id === 'forudsaetninger.aarsnorm.deltid')).toBe(false);
    expect(half.trace.steps.some((s) => s.id === 'forudsaetninger.aarsnorm.deltid')).toBe(true);
  });
});

describe('hour bases must not be mixed — regression', () => {
  const idv: Scenario = {
    ...base,
    solveFor: 'money',
    given: { months: 6 },
    monthlyCostKr: 70_000,
    pricing: {
      mechanism: 'rekvireret_idv',
      asOf: '2026-06-01',
      overheadId: 'idv-105-2026',
      marginId: 'idv-min-10',
    },
    marketFloorTableId: 'kommerciel-2019',
  };

  it('bills on the 1485 productive basis, not the 1650 workload norm', () => {
    const r = solve(idv);
    const step = r.trace.steps.find((s) => s.id === 'kontrol.markedsproeve')!;

    // 6 md × 1485/12 = 742,5 billable hours — NOT 825 (the 1650 workload basis).
    const billable = step.inputs.find((i) => i.label === 'Fakturerbare timer')!.value.value;
    expect(billable).toBeCloseTo(742.5, 1);
    expect(billable).not.toBeCloseTo(r.hours.workHours, 0);

    // Same money over fewer hours ⇒ a higher effective rate, which is what clears
    // the 1.220 kr/t floor. Using the workload norm gave ~1.148 and failed.
    expect(step.output.value).toBeGreaterThan(1220);
  });

  it('still registers Vipomatic hours on the workload norm', () => {
    // The two bases coexist in one result and must not have been conflated.
    expect(solve(idv).hours.workHours).toBe(825); // 6 × 1650/12
  });

  it('says which basis it used, so the derivation is defensible', () => {
    const md = traceToMarkdown(solve(idv).trace);
    expect(md).toMatch(/produktive timenorm \(1485 t\/år\)/);
  });
});

describe('timeline wired into solve() — multi-year scenarios', () => {
  it('is null when no timeline is requested', () => {
    expect(solve(base).timeline).toBeNull();
  });

  it('a project inside one calendar year gets a single, unindexed segment', () => {
    const r = solve({ ...base, solveFor: 'money', given: { months: 6 }, timeline: {} });
    expect(r.timeline).not.toBeNull();
    expect(r.timeline!.segments).toHaveLength(1);
    expect(r.timeline!.segments[0].indexFactor).toBe(1);
    // Same headline numbers as the non-timeline path, since nothing to index yet.
    const flat = solve({ ...base, solveFor: 'money', given: { months: 6 } });
    expect(r.moneyKr).toBe(flat.moneyKr);
    expect(r.hours.hoursToRegister).toBeCloseTo(flat.hours.hoursToRegister, 6);
  });

  it('splits a project spanning a calendar-year boundary and indexes the later year', () => {
    const r = solve({
      ...base,
      asOf: '2026-07-01',
      solveFor: 'money',
      given: { months: 18 },
      timeline: {},
    });
    expect(r.timeline!.segments.map((s) => s.year)).toEqual([2026, 2027]);
    expect(r.timeline!.segments[1].indexFactor).toBeGreaterThan(1);
    // Indexed multi-year cost exceeds the flat (unindexed) calculation.
    const flat = solve({ ...base, asOf: '2026-07-01', solveFor: 'money', given: { months: 18 } });
    expect(r.moneyKr).toBeGreaterThan(flat.moneyKr);
    expect(r.moneyKr).toBe(r.timeline!.totalCostKr);
  });

  it('money → months round-trips through the indexed timeline', () => {
    const priced = solve({ ...base, asOf: '2026-01-01', solveFor: 'money', given: { months: 24 }, timeline: {} });
    const back = solve({ ...base, asOf: '2026-01-01', given: { moneyKr: priced.moneyKr }, timeline: {} });
    expect(Math.abs(back.months - 24)).toBeLessThan(0.02);
  });

  it('hoursRegistered → months also respects the timeline, independent of indexation', () => {
    const forward = solve({
      ...base,
      asOf: '2026-07-01',
      solveFor: 'hoursRegistered',
      given: { months: 18 },
      timeline: {},
    });
    const back = solve({
      ...base,
      asOf: '2026-07-01',
      given: { hoursRegistered: forward.hours.hoursToRegister },
      timeline: {},
    });
    expect(Math.abs(back.months - 18)).toBeLessThan(0.01);
  });

  it('a mid-project norm revision (2023 → 2024) is handled per-year, not on one flat norm', () => {
    const r = solve({
      ...base,
      asOf: '2023-07-01',
      solveFor: 'money',
      given: { months: 18 },
      timeline: {},
    });
    expect(r.timeline!.segments[0].norm.annualWorkHours).toBe(1643);
    expect(r.timeline!.segments[1].norm.annualWorkHours).toBe(1650);
  });

  it('every segment reports hours to register per year, summing to the headline figure', () => {
    const r = solve({ ...base, asOf: '2026-07-01', solveFor: 'money', given: { months: 18 }, timeline: {} });
    const summed = r.timeline!.segments.reduce((a, s) => a + s.hoursToRegister, 0);
    expect(Math.abs(summed - r.hours.hoursToRegister)).toBeLessThan(0.2);
  });

  it('respects beskæftigelsesgrad inside the timeline too', () => {
    const full = solve({ ...base, asOf: '2026-07-01', solveFor: 'money', given: { months: 18 }, timeline: {} });
    const half = solve({
      ...base,
      asOf: '2026-07-01',
      solveFor: 'money',
      given: { months: 18 },
      timeline: {},
      employmentFraction: 0.5,
    });
    expect(half.hours.hoursToRegister).toBeCloseTo(full.hours.hoursToRegister / 2, 6);
  });

  it('renders the per-year breakdown into the trace', () => {
    const md = traceToMarkdown(
      solve({ ...base, asOf: '2026-07-01', solveFor: 'money', given: { months: 18 }, timeline: {} }).trace,
    );
    expect(md).toContain('## Flerårig fordeling');
    expect(md).toMatch(/\*\*2026\*\*/);
    expect(md).toMatch(/\*\*2027\*\*/);
    expect(md).toMatch(/Samlet, alle år/);
  });

  it('accepts an explicit indexation policy id', () => {
    const r = solve({
      ...base,
      asOf: '2026-01-01',
      solveFor: 'money',
      given: { months: 24 },
      timeline: { indexationId: 'ingen' },
    });
    // "ingen" applies no uplift, so this matches the flat calculation exactly.
    const flat = solve({ ...base, asOf: '2026-01-01', solveFor: 'money', given: { months: 24 } });
    expect(r.moneyKr).toBe(flat.moneyKr);
  });

  it('every bound result field still points at a step that exists, including the hoursRegistered→months path', () => {
    const r = solve({ ...base, given: { hoursRegistered: 165 } });
    const ids = new Set(r.trace.steps.map((s) => s.id));
    for (const [path, stepId] of Object.entries(r.trace.resultRefs)) {
      expect(ids.has(stepId), `${path} → ${stepId}`).toBe(true);
    }
    expect(r.trace.resultRefs.months).toBe('tid.maaneder.fraTimer');
  });
});
