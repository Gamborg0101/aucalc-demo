'use client';

import { useState, type WheelEvent } from 'react';
import { CATEGORY_NORMS, selectCategoryNorm, type EmploymentCategory } from '@/lib/frikoeb';
import { FULL_TIME_WEEKLY_HOURS, type FormState } from './scenario';

interface Props {
  value: FormState;
  onChange: (next: FormState) => void;
}

/**
 * The categories offered in the Stillingskategori picker. Consultant feedback
 * 2026-09-02: in practice a frikøb is always one of these three (VIP with a
 * fixed 60% norm) — narrower categories (studieadjunkt, ph.d., postdoc, DVIP)
 * are edge cases that don't need a slot in the everyday form. The full
 * `CATEGORY_NORMS` list — and the `registeredShareOverride` safety net below —
 * stay intact so an older shared link naming one of those categories still
 * resolves correctly instead of breaking.
 */
const CALCULATOR_CATEGORIES: EmploymentCategory[] = ['lektor', 'adjunkt', 'professor'];

const labelCls = 'block text-sm font-medium text-zinc-800 dark:text-zinc-200';
const hintCls = 'mt-1 text-xs text-zinc-500 dark:text-zinc-400';
const inputCls =
  'mt-1 w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';
const fieldsetCls = 'flex flex-col gap-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800';
const legendCls = 'px-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100';
const radioLabelCls = 'flex items-center gap-2 text-sm text-zinc-800 dark:text-zinc-200';

/**
 * Number inputs change value on mouse-wheel scroll while focused — a
 * long-standing browser quirk that surprises far more than it helps.
 * Blurring on wheel makes the page scroll normally instead.
 */
function blurOnWheel(e: WheelEvent<HTMLInputElement>): void {
  e.currentTarget.blur();
}

function isoToDisplayDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  if (!y || !m || !d) return '';
  return `${d}-${m}-${y}`;
}

/** Null for anything that isn't a real DD-MM-YYYY calendar date. */
function displayDateToIso(display: string): string | null {
  const match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(display.trim());
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(`${y}-${m}-${d}T00:00:00`);
  if (
    date.getUTCFullYear() !== Number(y) ||
    date.getUTCMonth() + 1 !== Number(m) ||
    date.getUTCDate() !== Number(d)
  ) {
    return null;
  }
  return `${y}-${m}-${d}`;
}

/** Free-typed DD-MM-YYYY text, committed upward only once it parses to a real date. */
function DateField({ value, onChange }: { value: string; onChange: (iso: string) => void }) {
  const [text, setText] = useState(() => isoToDisplayDate(value));
  const [lastValue, setLastValue] = useState(value);

  // Adjusting state during render (not an effect) when `value` changes from
  // outside this field — Nulstil, a shared link. Re-running on every
  // keystroke would fight the user mid-edit, which is why the parent only
  // ever sees a new `value` once this field has produced a valid date.
  if (value !== lastValue) {
    setLastValue(value);
    setText(isoToDisplayDate(value));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="DD-MM-ÅÅÅÅ"
      className={inputCls}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        const iso = displayDateToIso(e.target.value);
        if (iso) onChange(iso);
      }}
    />
  );
}

function formatKr(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits === '') return '';
  return Number(digits).toLocaleString('da-DK');
}

/** A kr amount, shown with da-DK thousands separators; state stays plain digits. */
function KrField({ value, onChange }: { value: string; onChange: (digits: string) => void }) {
  const [text, setText] = useState(() => formatKr(value));
  const [lastValue, setLastValue] = useState(value);

  // Adjusting state during render, not an effect — see DateField above.
  if (value !== lastValue) {
    setLastValue(value);
    setText(formatKr(value));
  }

  return (
    <input
      type="text"
      inputMode="numeric"
      className={inputCls}
      value={text}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, '');
        setText(formatKr(digits));
        onChange(digits);
      }}
    />
  );
}

export function ScenarioForm({ value, onChange }: Props) {
  const set = <K extends keyof FormState>(key: K, v: FormState[K]) => onChange({ ...value, [key]: v });

  const norm = selectCategoryNorm(value.category);
  const needsShareOverride = norm.registeredShare === null;
  const registeredPct = norm.registeredShare !== null ? Math.round(norm.registeredShare * 100) : null;

  // Normally just the three calculator categories — but if the current value came
  // from an older shared link naming a narrower category, keep it selectable so the
  // dropdown reflects real state instead of silently mismatching it.
  const categoryOptions = CATEGORY_NORMS.filter(
    (c) => CALCULATOR_CATEGORIES.includes(c.category) || c.category === value.category,
  );

  return (
    <form className="flex flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>Stilling og kostpris</legend>

        <label>
          <span className={labelCls}>Stillingskategori</span>
          <select
            className={inputCls}
            value={value.category}
            onChange={(e) => set('category', e.target.value as EmploymentCategory)}
          >
            {categoryOptions.map((c) => (
              <option key={c.category} value={c.category}>
                {c.label}
              </option>
            ))}
          </select>
          {norm.note && <p className={hintCls}>{norm.note}</p>}
        </label>

        {needsShareOverride && (
          <label>
            <span className={labelCls}>Andel registreret i Vipomatic (%)</span>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              max={100}
              className={inputCls}
              placeholder="fx 20"
              value={value.registeredShareOverride}
              onChange={(e) => set('registeredShareOverride', e.target.value)}
              onWheel={blurOnWheel}
            />
            <p className={hintCls}>
              {norm.label} har ingen fast timenorm — den aftales individuelt med institutlederen. Angiv
              den aftalte andel manuelt.
            </p>
          </label>
        )}

        <label>
          <span className={labelCls}>Månedlig kostpris (kr)</span>
          <KrField value={value.monthlyCostKr} onChange={(digits) => set('monthlyCostKr', digits)} />
          <p className={hintCls}>Navngiven person? Brug kostprisen fra Navision.</p>
        </label>
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>Frikøbstype</legend>

        <div className="flex flex-col gap-1 rounded-md bg-zinc-100 p-3 dark:bg-zinc-800/60">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Frikøb Standard</span>
          <span className={hintCls}>
            Fonden betaler fuld kostpris (undervisning og forskning) — til gengæld bruges hele
            arbejdstiden på projektet.
            {registeredPct !== null && (
              <>
                {' '}
                Af arbejdstiden registreres {registeredPct}% i Vipomatic; de {100 - registeredPct}%
                forskningstid registreres ikke nogen steder (jf. frikøbsnotatet).
              </>
            )}
          </span>
        </div>
      </fieldset>

      <fieldset className={fieldsetCls}>
        <legend className={legendCls}>Udgangspunkt</legend>

        <div className="flex flex-col gap-2">
          <label className={radioLabelCls}>
            <input
              type="radio"
              name="knownField"
              checked={value.knownField === 'moneyKr'}
              onChange={() => set('knownField', 'moneyKr')}
            />
            Beløb
          </label>
          <label className={radioLabelCls}>
            <input
              type="radio"
              name="knownField"
              checked={value.knownField === 'months'}
              onChange={() => set('knownField', 'months')}
            />
            Måneder
          </label>
          <label className={radioLabelCls}>
            <input
              type="radio"
              name="knownField"
              checked={value.knownField === 'workHours'}
              onChange={() => set('knownField', 'workHours')}
            />
            Samlet arbejdstid (timer)
          </label>
          <label className={radioLabelCls}>
            <input
              type="radio"
              name="knownField"
              checked={value.knownField === 'hoursRegistered'}
              onChange={() => set('knownField', 'hoursRegistered')}
            />
            Vipomatic-timer
          </label>
        </div>

        <div className="border-t border-zinc-200 pt-3 dark:border-zinc-800">
          {value.knownField === 'moneyKr' && (
            <label>
              <span className={labelCls}>Eksternt bidrag (kr)</span>
              <KrField value={value.moneyKr} onChange={(digits) => set('moneyKr', digits)} />
            </label>
          )}

          {value.knownField === 'workHours' && (
            <label>
              <span className={labelCls}>Samlet arbejdstid (timer)</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                className={inputCls}
                placeholder="fx 100"
                value={value.workHours}
                onChange={(e) => set('workHours', e.target.value)}
                onWheel={blurOnWheel}
              />
              {registeredPct !== null && (
                <p className={hintCls}>
                  Undervisning og forskning tilsammen. {registeredPct}% registreres i Vipomatic, resten er
                  forskningstid.
                </p>
              )}
            </label>
          )}

          {value.knownField === 'hoursRegistered' && (
            <label>
              <span className={labelCls}>Timer i Vipomatic</span>
              <input
                type="number"
                inputMode="decimal"
                min={0}
                className={inputCls}
                value={value.hoursRegistered}
                onChange={(e) => set('hoursRegistered', e.target.value)}
                onWheel={blurOnWheel}
              />
            </label>
          )}

          {value.knownField === 'months' && (
            <div className="flex flex-col gap-3">
              <fieldset className="flex gap-4">
                <legend className="sr-only">Indtastningsmetode for måneder</legend>
                <label className={radioLabelCls}>
                  <input
                    type="radio"
                    name="monthsEntryMode"
                    checked={value.monthsEntryMode === 'months'}
                    onChange={() => set('monthsEntryMode', 'months')}
                  />
                  Måneder
                </label>
                <label className={radioLabelCls}>
                  <input
                    type="radio"
                    name="monthsEntryMode"
                    checked={value.monthsEntryMode === 'fte'}
                    onChange={() => set('monthsEntryMode', 'fte')}
                  />
                  Frikøbsprocent over en periode
                </label>
              </fieldset>

              {value.monthsEntryMode === 'months' ? (
                <label>
                  <span className={labelCls}>Måneder</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.1"
                    className={inputCls}
                    value={value.months}
                    onChange={(e) => set('months', e.target.value)}
                    onWheel={blurOnWheel}
                  />
                </label>
              ) : (
                <div className="flex gap-3">
                  <label className="flex-1">
                    <span className={labelCls}>Frikøbsprocent</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      className={inputCls}
                      placeholder="fx 50"
                      value={value.fteShare}
                      onChange={(e) => set('fteShare', e.target.value)}
                      onWheel={blurOnWheel}
                    />
                  </label>
                  <label className="flex-1">
                    <span className={labelCls}>Varighed (måneder)</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      className={inputCls}
                      value={value.varighedMonths}
                      onChange={(e) => set('varighedMonths', e.target.value)}
                      onWheel={blurOnWheel}
                    />
                  </label>
                </div>
              )}
              {value.monthsEntryMode === 'fte' && (
                <p className={hintCls}>
                  Samme som at sige fx &ldquo;halvt frikøb i to semestre&rdquo; (50% over 12 måneder) —
                  frikøbsprocenten er andelen af fuld tid, varigheden er perioden den gælder over.
                </p>
              )}
            </div>
          )}
        </div>
      </fieldset>

      <details className="group rounded-lg border border-zinc-200 dark:border-zinc-800">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-zinc-900 marker:content-none dark:text-zinc-100">
          Avanceret
          <span aria-hidden="true" className="text-zinc-400 transition-transform group-open:rotate-180 dark:text-zinc-500">
            ▾
          </span>
        </summary>
        <div className="flex flex-col gap-4 border-t border-zinc-200 p-4 dark:border-zinc-800">
          <label>
            <span className={labelCls}>Dato</span>
            <DateField value={value.asOf} onChange={(iso) => set('asOf', iso)} />
            <p className={hintCls}>
              Styrer hvilken årsnorm der bruges — betyder kun noget for datoer før 01-01-2024
              (1643 t/år før, 1650 t/år fra da af).
            </p>
          </label>

          <div className="flex flex-col gap-2">
            <span className={labelCls}>Beskæftigelsesgrad</span>
            <p className={hintCls}>
              For deltidsansatte — skalerer årsnormen proportionalt. 100% (eller {FULL_TIME_WEEKLY_HOURS}{' '}
              t/uge) for fuldtid.
            </p>
            <fieldset className="flex gap-4">
              <legend className="sr-only">Indtastningsmetode for beskæftigelsesgrad</legend>
              <label className={radioLabelCls}>
                <input
                  type="radio"
                  name="beskaeftigelsesgradEntryMode"
                  checked={value.beskaeftigelsesgradEntryMode === 'percent'}
                  onChange={() => set('beskaeftigelsesgradEntryMode', 'percent')}
                />
                Procent
              </label>
              <label className={radioLabelCls}>
                <input
                  type="radio"
                  name="beskaeftigelsesgradEntryMode"
                  checked={value.beskaeftigelsesgradEntryMode === 'weeklyHours'}
                  onChange={() => set('beskaeftigelsesgradEntryMode', 'weeklyHours')}
                />
                Timer om ugen
              </label>
            </fieldset>

            {value.beskaeftigelsesgradEntryMode === 'percent' ? (
              <label>
                <span className={labelCls}>Beskæftigelsesgrad (%)</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={100}
                  className={inputCls}
                  value={value.beskaeftigelsesgrad}
                  onChange={(e) => set('beskaeftigelsesgrad', e.target.value)}
                  onWheel={blurOnWheel}
                />
              </label>
            ) : (
              <label>
                <span className={labelCls}>Timer om ugen</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={1}
                  max={FULL_TIME_WEEKLY_HOURS}
                  className={inputCls}
                  placeholder={`fx 30 (fuldtid er ${FULL_TIME_WEEKLY_HOURS})`}
                  value={value.weeklyHours}
                  onChange={(e) => set('weeklyHours', e.target.value)}
                  onWheel={blurOnWheel}
                />
              </label>
            )}
          </div>

          <label className={radioLabelCls}>
            <input
              type="checkbox"
              checked={value.snapToWholeMonths}
              onChange={(e) => set('snapToWholeMonths', e.target.checked)}
            />
            Afrund til hele lønmåneder (instituttets anbefaling)
          </label>
        </div>
      </details>

    </form>
  );
}
