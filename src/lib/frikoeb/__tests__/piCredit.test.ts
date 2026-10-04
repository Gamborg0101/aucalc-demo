/**
 * Princip 6 — PI teaching-credit for postdoc grants captured. A distinct,
 * separate calculation from `solve()`: see `rules/NOTES-frikoebspolitik.md`.
 */

import { describe, it, expect } from 'vitest';
import { computePiCredit, PI_CREDIT_RATE } from '../piCredit';
import { traceToMarkdown } from '../trace';

describe('computePiCredit — Princip 6', () => {
  it('matches the source document exactly under the 2023-2025 norm: 493 t × 10% floors to 49', () => {
    const r = computePiCredit({ asOf: '2023-06-01', postdocCount: 1 });
    expect(r.creditHoursPerPostdoc).toBe(49);
  });

  it('also floors to 49 under the 2024+ norm (495 t × 10% = 49,5)', () => {
    const r = computePiCredit({ asOf: '2026-01-01', postdocCount: 1 });
    expect(r.creditHoursPerPostdoc).toBe(49);
  });

  it('the rate is 10%, not a hardcoded figure', () => {
    expect(PI_CREDIT_RATE).toBe(0.1);
  });

  it('multiplies by the number of postdoc positions', () => {
    const one = computePiCredit({ asOf: '2026-01-01', postdocCount: 1 });
    const three = computePiCredit({ asOf: '2026-01-01', postdocCount: 3 });
    expect(three.totalCreditHours).toBe(one.creditHoursPerPostdoc * 3);
  });

  it('zero postdocs credits zero hours, without erroring', () => {
    const r = computePiCredit({ asOf: '2026-01-01', postdocCount: 0 });
    expect(r.totalCreditHours).toBe(0);
    expect(r.creditHoursPerPostdoc).toBeGreaterThan(0);
  });

  it('refuses a negative or non-integer postdoc count', () => {
    expect(() => computePiCredit({ asOf: '2026-01-01', postdocCount: -1 })).toThrow(/heltal/);
    expect(() => computePiCredit({ asOf: '2026-01-01', postdocCount: 1.5 })).toThrow(/heltal/);
  });

  it('scales with the PI\'s own beskæftigelsesgrad, same as a personal frikøb calculation', () => {
    const full = computePiCredit({ asOf: '2026-01-01', postdocCount: 1 });
    const half = computePiCredit({ asOf: '2026-01-01', postdocCount: 1, employmentFraction: 0.5 });
    expect(half.norm.published.semesterTeachingHours).toBeCloseTo(full.norm.published.semesterTeachingHours / 2, 6);
    expect(half.creditHoursPerPostdoc).toBeLessThan(full.creditHoursPerPostdoc);
  });

  it('refuses a beskæftigelsesgrad outside (0, 1]', () => {
    expect(() => computePiCredit({ asOf: '2026-01-01', postdocCount: 1, employmentFraction: 0 })).toThrow(
      /beskæftigelsesgrad/i,
    );
    expect(() => computePiCredit({ asOf: '2026-01-01', postdocCount: 1, employmentFraction: 1.2 })).toThrow(
      /beskæftigelsesgrad/i,
    );
  });

  it('cites Princip 6 in the trace', () => {
    const r = computePiCredit({ asOf: '2026-01-01', postdocCount: 2 });
    const step = r.trace.steps.find((s) => s.id === 'tid.kredit.perPostdoc');
    expect(step?.sourceRef?.locator).toBe('Princip 6');
    expect(step?.sourceRef?.file).toMatch(/Frikoeb_IKK_politik/);
  });

  it('states the postdoc precondition and the ph.d. exclusion in the trace note', () => {
    const r = computePiCredit({ asOf: '2026-01-01', postdocCount: 1 });
    const step = r.trace.steps.find((s) => s.id === 'tid.kredit.perPostdoc');
    expect(step?.note).toMatch(/20% undervisning/);
    expect(step?.note).toMatch(/ph\.d\..*IKKE/);
  });

  it('renders readable Danish markdown', () => {
    const md = traceToMarkdown(computePiCredit({ asOf: '2026-01-01', postdocCount: 2 }).trace);
    expect(md).toContain('Kredit pr. postdoc');
    expect(md).toContain('Samlet kredit');
    expect(md).toMatch(/Kilde:/);
  });

  it('every bound result field points at a step that exists', () => {
    const r = computePiCredit({ asOf: '2026-01-01', postdocCount: 2 });
    const ids = new Set(r.trace.steps.map((s) => s.id));
    for (const [path, stepId] of Object.entries(r.trace.resultRefs)) {
      expect(ids.has(stepId), `${path} → ${stepId}`).toBe(true);
    }
  });
});
