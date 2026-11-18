'use client';

import { useEffect, useRef } from 'react';
import { da, daLoose, type SemesterSlot } from '@/lib/frikoeb';

/** Ten years of frikøb — beyond this the strip stops being readable. */
const MAX_SHOWN = 20;

const labelCls = 'text-xs text-zinc-500 dark:text-zinc-400';

/**
 * One box per semester, filled by how much of it the frikøb covers. The
 * numbers come from `result.semesters` — this component only draws them.
 *
 * Collapsed by default like `TracePanel`, and forced open while printing for
 * the same reason: the exported PDF must never silently drop it.
 */
export function SemesterStrip({ semesters }: { semesters: SemesterSlot[] }) {
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

  if (semesters.length === 0) return null;

  const shown = semesters.slice(0, MAX_SHOWN);
  const hidden = semesters.length - shown.length;
  const fullCount = semesters.filter((s) => s.fill >= 1).length;
  const last = semesters[semesters.length - 1];
  const partial = last.fill < 1 ? last : null;

  return (
    <details ref={detailsRef} className="group rounded-lg border border-zinc-200 dark:border-zinc-800">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-semibold text-zinc-900 marker:content-none dark:text-zinc-50">
        <span>
          Semestre
          <span className="ml-2 font-normal text-zinc-500 dark:text-zinc-400">
            {fullCount} {fullCount === 1 ? 'fuldt' : 'fulde'}
            {partial && <> + {daLoose(partial.months)} md</>}
          </span>
        </span>
        <span aria-hidden="true" className="text-zinc-400 transition-transform group-open:rotate-180 dark:text-zinc-500">
          ▾
        </span>
      </summary>

      <div className="border-t border-zinc-200 p-5 dark:border-zinc-800">
        <ol className="grid grid-cols-4 gap-2 sm:grid-cols-5 xl:grid-cols-10">
          {shown.map((s) => {
            const isFull = s.fill >= 1;
            return (
              <li key={s.index} className="flex flex-col gap-1">
                <div
                  role="img"
                  aria-label={`Semester ${s.index}: ${da(s.hours, 0)} af ${da(s.normHours, 0)} timer${isFull ? ', fuldt' : ''}`}
                  className="relative h-14 overflow-hidden rounded-md border border-zinc-300 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900"
                >
                  <div
                    className={`absolute inset-x-0 bottom-0 bg-accent ${isFull ? '' : 'opacity-60'}`}
                    style={{ height: `${s.fill * 100}%` }}
                  />
                </div>
                <span className="text-[11px] leading-tight text-zinc-500 dark:text-zinc-400">Sem. {s.index}</span>
                <span className="text-xs font-medium leading-tight text-zinc-900 dark:text-zinc-50">
                  {isFull ? `${da(s.hours, 0)} t` : `${da(s.hours, 0)} / ${da(s.normHours, 0)} t`}
                </span>
              </li>
            );
          })}
        </ol>

        {hidden > 0 && <p className={`${labelCls} mt-2`}>+ {hidden} semestre mere, ikke vist.</p>}

        <p className={`${labelCls} mt-3`}>
          Hver boks er ét semester (6 md, {da(semesters[0].normHours, 0)} t i Vipomatic). Antager at
          frikøbet starter ved et semesterstart.
          {partial && (
            <> I sidste semester skal forskeren fortsat yde {da(partial.remainingHours, 0)} t.</>
          )}
        </p>
      </div>
    </details>
  );
}
