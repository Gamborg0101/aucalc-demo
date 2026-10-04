'use client';

import { da, daLoose, type FrikoebResult } from '@/lib/frikoeb';
import type { FormState } from './scenario';

const cardCls = 'rounded-lg border border-zinc-200 p-5 dark:border-zinc-800';
const gridCls = 'grid grid-cols-2 gap-4 sm:grid-cols-3';
const labelCls = 'text-xs text-zinc-500 dark:text-zinc-400';
const valueCls = 'text-lg font-medium text-zinc-900 dark:text-zinc-50';

/** The field the consultant asked for — whichever isn't `knownField`'s pair. */
function headlineFieldFor(form: FormState): 'months' | 'moneyKr' | 'hoursRegistered' {
  return form.knownField === 'months' ? 'moneyKr' : 'months';
}

function headlineFor(field: ReturnType<typeof headlineFieldFor>, result: FrikoebResult): { label: string; value: string } {
  switch (field) {
    case 'months':
      return {
        label: 'Måneders frikøb',
        value: `${daLoose(result.months)} md`,
      };
    case 'moneyKr':
      return { label: 'Beløb der skal budgetteres', value: `${da(result.moneyKr)} kr` };
    case 'hoursRegistered':
      return {
        label: 'Timer til registrering i Vipomatic',
        value: `${da(result.hours.hoursToRegisterWhole, 0)} t`,
      };
  }
}

export function ResultSummary({ form, result }: { form: FormState; result: FrikoebResult }) {
  const headlineField = headlineFieldFor(form);
  const headline = headlineFor(headlineField, result);

  // Only meaningful when the consultant actually entered måneder as FTE% —
  // otherwise `varighed` is just an untouched default, not a real input.
  const showFte = form.knownField === 'months' && form.monthsEntryMode === 'fte';
  const span = Number(form.varighedMonths);
  const ftePct = showFte && Number.isFinite(span) && span > 0 ? (result.months / span) * 100 : null;

  return (
    <div className={cardCls}>
      <p className={labelCls}>{headline.label}</p>
      <p aria-live="polite" className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">
        {headline.value}
      </p>

      <div className={`${gridCls} mt-5`}>
        {headlineField !== 'months' && (
          <div>
            <p className={labelCls}>Måneder</p>
            <p className={valueCls}>{daLoose(result.months)} md</p>
          </div>
        )}
        {headlineField !== 'moneyKr' && (
          <div>
            <p className={labelCls}>Beløb</p>
            <p className={valueCls}>{da(result.moneyKr)} kr</p>
          </div>
        )}
        {headlineField !== 'hoursRegistered' && (
          <div>
            <p className={labelCls}>Vipomatic-timer</p>
            <p className={valueCls}>{da(result.hours.hoursToRegisterWhole, 0)} t</p>
          </div>
        )}
        <div>
          <p className={labelCls}>Forskningstid (registreres ikke)</p>
          <p className={valueCls}>{daLoose(result.hours.researchHours)} t</p>
        </div>
        {ftePct !== null && (
          <div>
            <p className={labelCls}>Frikøbsprocent over {daLoose(span)} md</p>
            <p className={valueCls}>{daLoose(ftePct)}%</p>
          </div>
        )}
        <div>
          <p className={labelCls}>Restforpligtelse i semestret</p>
          <p className={valueCls}>
            {da(result.residual.remainingObligationHours, 0)} t af {da(result.residual.semesterNormHours, 0)} t
          </p>
        </div>
      </div>

      <details className="group mt-4 rounded-md border border-zinc-200 dark:border-zinc-800">
        <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-2 text-xs font-medium text-zinc-600 marker:content-none dark:text-zinc-400">
          Arbejdsdage
          <span
            aria-hidden="true"
            className="text-zinc-400 transition-transform group-open:rotate-180 dark:text-zinc-500"
          >
            ▾
          </span>
        </summary>
        <p className="border-t border-zinc-200 px-3 py-2 text-xs text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          Svarer til {da(result.hours.workDays, 0)} hele arbejdsdage (7,24 t/dag, Vipomatic-norm).
        </p>
      </details>

      {result.monthsSnapped !== null && (
        <p className="mt-4 text-xs text-zinc-500 dark:text-zinc-400">
          Afrundet til {daLoose(result.monthsSnapped)} hele lønmåneder
          {(() => {
            const before = result.trace.steps.find((s) => s.id === 'tid.maaneder.afrundet')?.rounding?.before;
            return before !== undefined ? ` (før afrunding: ${daLoose(before)} md)` : '';
          })()}
          .
        </p>
      )}
    </div>
  );
}
