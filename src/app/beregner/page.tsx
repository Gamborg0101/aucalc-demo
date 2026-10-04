'use client';

import { useEffect, useMemo, useState } from 'react';
import { ScenarioForm } from './ScenarioForm';
import { ResultSummary } from './ResultSummary';
import { PriceSummary } from './PriceSummary';
import { WarningList } from './WarningList';
import { TracePanel } from './TracePanel';
import {
  computeOutcome,
  formFromQueryString,
  formToQueryString,
  DEFAULT_FORM,
  type FormState,
} from './scenario';

const buttonCls =
  'rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900';

function ResetButton({ onReset }: { onReset: () => void }) {
  return (
    <button type="button" className={buttonCls} onClick={onReset}>
      Nulstil
    </button>
  );
}

function ExportPdfButton() {
  return (
    <button type="button" className={buttonCls} onClick={() => window.print()}>
      Eksportér som PDF
    </button>
  );
}

export default function BeregnerPage() {
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);

  // Read the scenario out of the URL once, after mount — keeps SSR/CSR markup
  // identical (both render DEFAULT_FORM) and avoids needing a Suspense
  // boundary for `useSearchParams`.
  useEffect(() => {
    // `window.location` doesn't exist during SSR, so this one-time read from
    // an external, non-reactive source has to happen post-mount — it isn't
    // state derivable from props/render, which is what this lint rule guards
    // against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(formFromQueryString(window.location.search));
    setHydratedFromUrl(true);
  }, []);

  // Push every change back into the URL, so any calculation is a shareable
  // link. Skipped until the read above has happened, or it would clobber an
  // incoming shared link with the defaults for one render.
  useEffect(() => {
    if (!hydratedFromUrl) return;
    const qs = formToQueryString(form);
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [form, hydratedFromUrl]);

  const outcome = useMemo(() => computeOutcome(form), [form]);

  // Derived, not stored: recomputed from `form` on every render rather than
  // synced via effect+state, so there's no extra state to keep in step with
  // the URL-push effect above. Gated on `hydratedFromUrl` for the same
  // hydration-safety reason the form's initial value is.
  const shareUrl =
    hydratedFromUrl && typeof window !== 'undefined'
      ? `${window.location.origin}${window.location.pathname}?${formToQueryString(form)}`
      : '';

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 print:gap-4 print:py-0">
      <header className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Frikøbsberegner</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Et internt værktøj for forskningskonsulenter på Faculty of Arts, Aarhus Universitet.
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Regn frikøb begge veje — fra bevilling til måneder og Vipomatic-timer, eller fra ønsket
            frikøb til det beløb, der skal budgetteres.
          </p>
        </div>
        <div className="flex gap-2">
          <ResetButton onReset={() => setForm(DEFAULT_FORM)} />
          <ExportPdfButton />
        </div>
      </header>

      {/* Print-only header — the screen header above is hidden on print, and
          the source link is the only way to trace a printed page back to the
          scenario that produced it. */}
      <div className="hidden print:block">
        <h1 className="text-xl font-semibold text-black">Frikøbsberegner — udregning</h1>
        <p className="text-xs text-zinc-600">
          Udskrevet {new Date().toLocaleDateString('da-DK')}
          {shareUrl && <> · {shareUrl}</>}
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-[380px_1fr] print:grid-cols-1">
        <div className="print:hidden">
          <ScenarioForm value={form} onChange={setForm} />
        </div>

        <div className="flex flex-col gap-6">
          {outcome.result ? (
            <>
              <ResultSummary form={form} result={outcome.result} />
              {outcome.result.price && <PriceSummary price={outcome.result.price} />}
              <WarningList warnings={outcome.result.warnings} />
              <TracePanel trace={outcome.result.trace} />
            </>
          ) : (
            <div
              role="alert"
              className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-200"
            >
              {outcome.error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
