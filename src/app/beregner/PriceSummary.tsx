'use client';

import { da, type PriceBreakdown } from '@/lib/frikoeb';

const cardCls = 'rounded-lg border border-zinc-200 p-5 dark:border-zinc-800';
const rowCls = 'flex items-baseline justify-between gap-4 py-1.5 text-sm';
const labelCls = 'text-zinc-600 dark:text-zinc-400';
const valueCls = 'font-medium text-zinc-900 dark:text-zinc-50';

/**
 * The compact cost-stack summary. The full derivation — every rate, base and
 * citation — already renders in `TracePanel` (solve() puts it in the
 * 'oekonomi' trace section regardless of UI); this exists only as a
 * quick-glance total, not a second source of truth.
 */
export function PriceSummary({ price }: { price: PriceBreakdown }) {
  return (
    <div className={cardCls}>
      <h2 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">Prisberegning</h2>
      <div className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800/60">
        <div className={rowCls}>
          <span className={labelCls}>Direkte løn</span>
          <span className={valueCls}>{da(price.directSalaryKr)} kr</span>
        </div>
        {price.directOperatingKr > 0 && (
          <div className={rowCls}>
            <span className={labelCls}>Direkte drift</span>
            <span className={valueCls}>{da(price.directOperatingKr)} kr</span>
          </div>
        )}
        <div className={rowCls}>
          <span className={labelCls}>Overhead — {price.overhead.label}</span>
          <span className={valueCls}>{da(price.overheadKr)} kr</span>
        </div>
        {price.margin && (
          <div className={rowCls}>
            <span className={labelCls}>Overskudsgrad — {price.margin.label}</span>
            <span className={valueCls}>{da(price.marginKr)} kr</span>
          </div>
        )}
        {price.momsKr > 0 && (
          <div className={rowCls}>
            <span className={labelCls}>Moms (25%)</span>
            <span className={valueCls}>{da(price.momsKr)} kr</span>
          </div>
        )}
        <div className={`${rowCls} pt-2 text-base`}>
          <span className="font-semibold text-zinc-900 dark:text-zinc-50">{price.headlineLabel}</span>
          <span aria-live="polite" className="font-semibold text-zinc-900 dark:text-zinc-50">
            {da(price.headlineKr)} kr
          </span>
        </div>
      </div>
    </div>
  );
}
