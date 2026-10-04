/**
 * The derivation trace.
 *
 * This is the actual product. A consultant's complaint is not "I can't get a
 * number" — it's "I can't defend the number". So every result carries an ordered,
 * cited, step-by-step derivation, produced BY the calculation core and merely
 * rendered by the UI.
 *
 * Two invariants, both tested:
 *   1. Every numeric field of the result maps to the step that produced it.
 *   2. Replaying the trace from its recorded inputs reproduces every output —
 *      the trace is not narration, it IS the computation.
 */

import type { DocumentRef } from './types';
import type { RoundMode } from './rounding';

export type TraceUnit = 'kr' | 'kr/md' | 'kr/t' | 't' | 'md' | 'dage' | 'år' | '%' | 'faktor' | '';

export interface TraceValue {
  value: number;
  unit: TraceUnit;
  /** Display precision. The underlying value stays exact. */
  dp?: number;
}

export type TraceStepKind =
  /** Supplied by the user. */
  | 'input'
  /** From versioned config. Carries a DocumentRef. */
  | 'constant'
  /** Arithmetic. */
  | 'derived'
  /** An explicit rounding boundary. */
  | 'rounding'
  /** A choice the engine made that the user should review. */
  | 'assumption'
  /** A compliance or sanity check. */
  | 'check';

export interface TraceInput {
  label: string;
  value: TraceValue;
  /** Id of the step that produced this, or a config key. */
  ref?: string;
}

export interface TraceStep {
  /** Stable and referenceable, e.g. 'tid.maaneder.fraBeloeb'. */
  id: string;
  kind: TraceStepKind;
  label: string;
  /** Symbolic form: 'beløb ÷ (kostpris × k)'. */
  formula?: string;
  /** The same with numbers substituted in. */
  substituted?: string;
  inputs: TraceInput[];
  output: TraceValue;
  rounding?: {
    mode: RoundMode;
    dp: number;
    before: number;
    after: number;
    /** What flooring threw away. Surfaced, never silently dropped. */
    discarded: number;
  };
  note?: string;
  sourceRef?: DocumentRef;
}

export type TraceSectionId =
  | 'forudsaetninger'
  | 'tid'
  | 'vipomatic'
  | 'oekonomi'
  | 'flerarig'
  | 'medfinansiering'
  | 'kontrol';

export interface TraceSection {
  id: TraceSectionId;
  title: string;
  stepIds: string[];
}

export interface CalcTrace {
  schemaVersion: 1;
  computedAt: string;
  profile: string;
  steps: TraceStep[];
  sections: TraceSection[];
  /** Maps a result field path to the id of the step that produced it. */
  resultRefs: Record<string, string>;
}

const SECTION_TITLES: Record<TraceSectionId, string> = {
  forudsaetninger: 'Forudsætninger',
  tid: 'Tid',
  vipomatic: 'Vipomatic-registrering',
  oekonomi: 'Økonomi',
  flerarig: 'Flerårig fordeling',
  medfinansiering: 'Medfinansiering',
  kontrol: 'Kontrol',
};

/**
 * Records steps as the calculation runs.
 *
 * `step()` returns the computed number, so call sites read naturally and a step
 * cannot be forgotten:
 *
 *   const m = t.step({ id: '…', output: months(x / y), … });
 */
export class TraceBuilder {
  private steps: TraceStep[] = [];
  private sections = new Map<TraceSectionId, string[]>();
  private refs: Record<string, string> = {};
  private current: TraceSectionId = 'forudsaetninger';

  constructor(private readonly profile: string) {}

  section(id: TraceSectionId): void {
    this.current = id;
    if (!this.sections.has(id)) this.sections.set(id, []);
  }

  step(s: TraceStep): number {
    this.steps.push(s);
    const list = this.sections.get(this.current) ?? [];
    list.push(s.id);
    this.sections.set(this.current, list);
    return s.output.value;
  }

  /** A value straight from the user. */
  input(id: string, label: string, output: TraceValue): number {
    return this.step({ id, kind: 'input', label, inputs: [], output });
  }

  /** A value from versioned config, with its citation. */
  constant(id: string, label: string, output: TraceValue, sourceRef: DocumentRef, note?: string): number {
    return this.step({ id, kind: 'constant', label, inputs: [], output, sourceRef, note });
  }

  /** Binds a result field path to the step that produced it. */
  bind(resultPath: string, stepId: string): void {
    this.refs[resultPath] = stepId;
  }

  build(): CalcTrace {
    return {
      schemaVersion: 1,
      computedAt: new Date().toISOString().slice(0, 10),
      profile: this.profile,
      steps: this.steps,
      sections: [...this.sections.entries()].map(([id, stepIds]) => ({
        id,
        title: SECTION_TITLES[id],
        stepIds,
      })),
      resultRefs: this.refs,
    };
  }
}

// --- value constructors, for readable call sites ---------------------------

export const kr = (value: number): TraceValue => ({ value, unit: 'kr', dp: 0 });
export const krPerMonth = (value: number): TraceValue => ({ value, unit: 'kr/md', dp: 0 });
export const hours = (value: number, dp = 1): TraceValue => ({ value, unit: 't', dp });
export const months = (value: number, dp = 2): TraceValue => ({ value, unit: 'md', dp });
export const days = (value: number, dp = 1): TraceValue => ({ value, unit: 'dage', dp });
export const factor = (value: number): TraceValue => ({ value, unit: 'faktor', dp: 4 });
export const percent = (value: number): TraceValue => ({ value, unit: '%', dp: 1 });

// --- rendering -------------------------------------------------------------

/** Danish number formatting: 1.234,56 — period thousands, comma decimal. */
export const da = (value: number, dp = 0): string =>
  new Intl.NumberFormat('da-DK', {
    minimumFractionDigits: dp,
    maximumFractionDigits: dp,
  }).format(value);

/** Like `da`, but drops trailing zeros — for factors and shares inside formulas. */
export const daLoose = (value: number): string =>
  new Intl.NumberFormat('da-DK', { maximumFractionDigits: 4 }).format(value);

const nf = (v: TraceValue): string => {
  const s = da(v.value, v.dp ?? 0);
  return v.unit ? `${s} ${v.unit}` : s;
};

/** Renders the trace as Markdown. Pure — no DOM, so it is testable directly. */
export function traceToMarkdown(trace: CalcTrace): string {
  const byId = new Map(trace.steps.map((s) => [s.id, s]));
  const out: string[] = [];

  for (const section of trace.sections) {
    if (section.stepIds.length === 0) continue;
    out.push(`## ${section.title}`, '');

    for (const id of section.stepIds) {
      const s = byId.get(id);
      if (!s) continue;

      out.push(`**${s.label}** — ${nf(s.output)}`);
      if (s.substituted) out.push(`> ${s.substituted}`);
      else if (s.formula) out.push(`> ${s.formula}`);

      // Only narrate rounding that actually changed something. "nedrundet fra
      // 165 til 165" is noise, and noise in the derivation costs trust.
      if (s.rounding && s.rounding.before !== s.rounding.after) {
        const r = s.rounding;
        const mode = r.mode === 'floor' ? 'nedrundet' : 'afrundet';
        // The discarded amount is in the step's own unit — months when snapping
        // months, hours when flooring hours. Hardcoding "t" here silently
        // mislabels the residual on month-snapping steps.
        const u = s.output.unit ? ` ${s.output.unit}` : '';
        const disc = r.discarded ? ` (${da(r.discarded, 1)}${u} bortfalder)` : '';
        out.push(`> ${mode} fra ${da(r.before, 1)} til ${da(r.after, 0)}${disc}`);
      }
      if (s.note) out.push(`> _${s.note}_`);
      if (s.sourceRef) {
        const loc = s.sourceRef.locator ? `, ${s.sourceRef.locator}` : '';
        out.push(`> Kilde: ${s.sourceRef.title}${loc}`);
      }
      out.push('');
    }
  }

  return out.join('\n').trimEnd();
}
