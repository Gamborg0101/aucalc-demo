'use client';

import { useEffect, useRef } from 'react';
import { da, type CalcTrace, type TraceStep, type TraceValue } from '@/lib/frikoeb';

const KIND_LABEL: Record<TraceStep['kind'], string> = {
  input: 'Input',
  constant: 'Konstant',
  derived: 'Udledt',
  rounding: 'Afrunding',
  assumption: 'Antagelse',
  check: 'Kontrol',
};

function formatValue(v: TraceValue): string {
  const s = da(v.value, v.dp ?? 0);
  return v.unit ? `${s} ${v.unit}` : s;
}

function StepRow({ step }: { step: TraceStep }) {
  const roundingChanged = step.rounding && step.rounding.before !== step.rounding.after;

  return (
    <div className="border-b border-zinc-100 py-3 last:border-0 dark:border-zinc-800/60">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <span className="mr-2 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            {KIND_LABEL[step.kind]}
          </span>
          <span className="text-sm text-zinc-800 dark:text-zinc-200">{step.label}</span>
        </div>
        <span className="whitespace-nowrap text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {formatValue(step.output)}
        </span>
      </div>

      {(step.substituted ?? step.formula) && (
        <p className="mt-1 font-mono text-xs text-zinc-500 dark:text-zinc-400">
          {step.substituted ?? step.formula}
        </p>
      )}

      {roundingChanged && step.rounding && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {step.rounding.mode === 'floor' ? 'Nedrundet' : 'Afrundet'} fra {da(step.rounding.before, 1)} til{' '}
          {da(step.rounding.after, 0)}
          {step.rounding.discarded ? ` (${da(step.rounding.discarded, 1)} bortfalder)` : ''}
        </p>
      )}

      {step.note && <p className="mt-1 text-xs italic text-zinc-500 dark:text-zinc-400">{step.note}</p>}

      {step.sourceRef && (
        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          Kilde: {step.sourceRef.title}
          {step.sourceRef.locator ? `, ${step.sourceRef.locator}` : ''}
        </p>
      )}
    </div>
  );
}

/**
 * Collapsed by default — the trace repeats, in much denser form, most of what
 * ResultSummary already shows, and this is the one place in the UI that didn't
 * follow the same disclosure pattern already used for Avanceret, Pris og
 * omkostningsstak and Arbejdsdage. Consultants doing a routine calculation get
 * the headline only; the full derivation stays one click away.
 *
 * The exported PDF is the actual citable artifact ("paste into a budget and
 * defend it to a funder"), so it must never silently print collapsed — force
 * it open for the duration of printing regardless of on-screen state, then
 * restore whatever the user had.
 */
export function TracePanel({ trace }: { trace: CalcTrace }) {
  const byId = new Map(trace.steps.map((s) => [s.id, s]));
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const wasOpenRef = useRef(false);

  useEffect(() => {
    const handleBeforePrint = () => {
      const el = detailsRef.current;
      if (!el) return;
      wasOpenRef.current = el.open;
      el.open = true;
    };
    const handleAfterPrint = () => {
      const el = detailsRef.current;
      if (!el) return;
      el.open = wasOpenRef.current;
    };

    window.addEventListener('beforeprint', handleBeforePrint);
    window.addEventListener('afterprint', handleAfterPrint);
    return () => {
      window.removeEventListener('beforeprint', handleBeforePrint);
      window.removeEventListener('afterprint', handleAfterPrint);
    };
  }, []);

  return (
    <details ref={detailsRef} className="group rounded-lg border border-zinc-200 dark:border-zinc-800">
      <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-semibold text-zinc-900 marker:content-none dark:text-zinc-50">
        Beregningsspor
        <span aria-hidden="true" className="text-zinc-400 transition-transform group-open:rotate-180 dark:text-zinc-500">
          ▾
        </span>
      </summary>
      <div className="border-t border-zinc-200 p-5 dark:border-zinc-800">
        {trace.sections
          .filter((section) => section.stepIds.length > 0)
          .map((section, i) => (
            <div
              key={section.id}
              className={`mb-6 last:mb-0 ${i > 0 ? 'border-t border-zinc-200 pt-4 dark:border-zinc-800' : ''}`}
            >
              <h3 className="mb-1 text-xs font-bold uppercase tracking-wider text-zinc-600 dark:text-zinc-300">
                {section.title}
              </h3>
              {section.stepIds.map((id) => {
                const step = byId.get(id);
                return step ? <StepRow key={id} step={step} /> : null;
              })}
            </div>
          ))}
      </div>
    </details>
  );
}
