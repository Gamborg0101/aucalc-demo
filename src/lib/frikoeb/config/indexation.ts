/**
 * Pris- og lønregulering.
 *
 * Two different things live here and must not be confused:
 *
 *  - **Budget indexation.** What you *assume* when budgeting a multi-year project.
 *    Økonomisekretariatet recommends a flat **2% per year**. This is a convention,
 *    not a forecast.
 *
 *  - **Actual P/L-regulering.** What salaries *actually* moved, published per year.
 *    Used to explain historical figures, not to project forward.
 *
 * Both **compound**. The priskalkulationsskema spells this out explicitly under
 * "Eksempel 2 - Rentes rente formel":
 *   (200,00) × (1+0,000) × (1+0,029) × (1+0,025) × (1+0,020) = 220,65
 */

import type { DocumentRef } from '../types';

export const SRC_FSE_BUDGET: DocumentRef = {
  title: 'Råd og værktøjer til din fondsansøgning — lønsatser',
  org: 'AU_ARTS',
  dated: '2026-07-03',
  file: 'rules/NOTES-fondsansoegning-overhead.md',
};

export const SRC_PRISKALK: DocumentRef = {
  title: 'Priskalkulationsskema DR2 2026 — Takstkatalog',
  org: 'AU_ARTS',
  dated: '2025-09-17',
  file: 'rules/IDV_priskalkulationsskema_2026.xlsm',
};

export interface IndexationPolicy {
  id: string;
  label: string;
  mode: 'none' | 'flatAnnual' | 'perYear';
  /** For `flatAnnual`. 0.02 = 2%. */
  annualRate?: number;
  /** For `perYear`. Keyed by the year the uplift takes effect (1 April). */
  byYear?: Record<number, number>;
  source: DocumentRef;
  note?: string;
}

export const INDEXATION_POLICIES: IndexationPolicy[] = [
  {
    id: 'budget-2pct',
    label: 'Budgetregulering — 2% årligt (anbefalet)',
    mode: 'flatAnnual',
    annualRate: 0.02,
    source: SRC_FSE_BUDGET,
    note:
      'Økonomisekretariatet anbefaler at opregulere lønninger med 2% årligt i budgetter ' +
      'for at tage højde for fremtidige lønstigninger.',
  },
  {
    id: 'takstkatalog-2_5pct',
    label: 'Takstkatalogets fremskrivning — 2,5% årligt',
    mode: 'flatAnnual',
    annualRate: 0.025,
    source: SRC_PRISKALK,
    note:
      'Takstkataloget for ressourcekostpriser fremskriver overslagsårene med 2,5% årligt, ' +
      'jf. forligstekst om OK26. Brug denne, hvis budgettet bygger på takstkatalogets tal.',
  },
  {
    id: 'faktisk-pl',
    label: 'Faktisk P/L-regulering (historisk) — ⚠️ UVERIFICERET',
    mode: 'perYear',
    byYear: { 2025: 0.046, 2026: 0.029, 2027: 0.0, 2028: 0.025, 2029: 0.02, 2030: 0.02 },
    source: SRC_PRISKALK,
    note:
      '⚠️ BRUG IKKE TIL BINDENDE BUDGETTER FØR VERIFICERING. Regnearket indeholder to ' +
      'blokke, der er uenige om, hvorvidt 2026 er 0% og 2027 er 2,9% eller omvendt. ' +
      'Regnearkets egne eksempler kan ikke afgøre det: deres tal går ikke op med nogen af ' +
      'blokkene (fx står der "(210,94) × (1+0,020) = 220,64", men 210,94 × 1,02 = 215,16). ' +
      'Enten er eksemplerne forkerte, eller vores udtræk har forskudt rækkerne. ' +
      'Denne rækkefølge følger opslagstabellen A28:H33. Åbn regnearket og verificér. ' +
      'Til budgettering anbefales "budget-2pct" i stedet — den er entydig og kildeangivet.',
  },
  {
    id: 'ingen',
    label: 'Ingen regulering',
    mode: 'none',
    source: SRC_FSE_BUDGET,
    note: 'Beløb i faste priser. Brug kun når bevillingsgiver kræver det.',
  },
];

export function selectIndexation(id: string): IndexationPolicy {
  const hit = INDEXATION_POLICIES.find((p) => p.id === id);
  if (!hit) throw new Error(`Ukendt reguleringspolitik: ${id}`);
  return hit;
}

/**
 * Compounded uplift factor from `baseYear` to `year`.
 *
 * Compounds — it does not apply a flat percentage to a fixed base. Getting this
 * wrong understates a 5-year budget by several percent.
 */
export function indexFactor(policy: IndexationPolicy, baseYear: number, year: number): number {
  if (policy.mode === 'none' || year <= baseYear) return 1;

  let f = 1;
  for (let y = baseYear + 1; y <= year; y++) {
    if (policy.mode === 'flatAnnual') {
      f *= 1 + (policy.annualRate ?? 0);
    } else {
      const r = policy.byYear?.[y];
      if (r === undefined) {
        throw new Error(
          `Ingen P/L-sats for ${y} i "${policy.id}". Tilføj den, eller brug en fast årlig sats.`,
        );
      }
      f *= 1 + r;
    }
  }
  return f;
}
