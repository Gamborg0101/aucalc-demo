'use client';

import type { CalcWarning } from '@/lib/frikoeb';

const SEVERITY: Record<CalcWarning['severity'], { label: string; cls: string }> = {
  block: {
    label: 'Stop',
    cls: 'border-red-300 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200',
  },
  warn: {
    label: 'Bemærk',
    cls: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200',
  },
  info: {
    label: 'Info',
    cls: 'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
  },
};

export function WarningList({ warnings }: { warnings: CalcWarning[] }) {
  if (warnings.length === 0) return null;

  const ordered = [...warnings].sort((a, b) => rank(b.severity) - rank(a.severity));

  return (
    <ul className="flex flex-col gap-2" aria-live="polite">
      {ordered.map((w, i) => {
        const s = SEVERITY[w.severity];
        return (
          <li key={`${w.code}-${i}`} className={`rounded-md border px-3 py-2 text-sm ${s.cls}`}>
            <span className="font-semibold">{s.label}:</span> {w.message}
          </li>
        );
      })}
    </ul>
  );
}

function rank(s: CalcWarning['severity']): number {
  return s === 'block' ? 2 : s === 'warn' ? 1 : 0;
}
