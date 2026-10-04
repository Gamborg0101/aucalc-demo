/**
 * Overhead and margin policies.
 *
 * The critical fact this file exists to encode: **the two mechanisms differ in
 * BASE as well as rate.**
 *
 *   IDV / DR2        105% overhead on DIRECT SALARY ONLY (0% on operating costs)
 *   Tilskudsfin.      44% overhead on ALL DIRECT COSTS (salary + operating)
 *
 * A single `overhead × direct` field cannot express both. Getting this wrong
 * over-applies overhead to travel, materials and publication costs on every IDV
 * quote, or under-applies it on every grant budget.
 */

import type { DocumentRef } from '../types';

export const SRC_IDV_OH_2026: DocumentRef = {
  title: 'Gennemsnitlig overheadsats på 105 pct. samt vejledende minimumsoverskudsgrad for 2026 (IV)',
  org: 'AU_ARTS',
  dated: '2025-06-23',
  file: 'rules/IDV_overheadsats_2026.pdf',
};

export const SRC_IDV_OH_2027: DocumentRef = {
  title: 'Overheadsats og minimumsoverskudsgrad på IV 2027',
  org: 'AU_ARTS',
  dated: '2026-06-22',
  file: 'rules/IDV_overheadsats_2027.pdf',
};

export const SRC_FSE_FONDSANSOEGNING: DocumentRef = {
  title: 'Råd og værktøjer til din fondsansøgning (Forskningsstøtteenheden)',
  org: 'AU_ARTS',
  dated: '2026-07-03',
  file: 'rules/NOTES-fondsansoegning-overhead.md',
};

/** What an overhead percentage is applied to. */
export type OverheadBase =
  /** Direct salary only. IDV. */
  | 'direct_salary'
  /** Salary + operating costs. Grant funding. */
  | 'all_direct_costs';

export interface OverheadPolicy {
  id: string;
  label: string;
  /** 1.05 = 105%. */
  rate: number;
  base: OverheadBase;
  /**
   * `included_in_rate` means the quoted hourly rate already contains overhead and
   * administration, so no further markup is applied. This exists to make
   * double-counting structurally impossible — it is the likeliest real-world error
   * this tool could cause.
   */
  mode: 'markup' | 'included_in_rate' | 'none';
  effectiveFrom: string;
  effectiveTo: string | null;
  source: DocumentRef;
  note?: string;
}

export const OVERHEAD_POLICIES: OverheadPolicy[] = [
  {
    id: 'idv-105-2026',
    label: 'IDV — 105% på direkte løn (2026–2027)',
    rate: 1.05,
    base: 'direct_salary',
    mode: 'markup',
    effectiveFrom: '2026-01-01',
    effectiveTo: '2027-12-31',
    source: SRC_IDV_OH_2026,
    note:
      'Kun på direkte løn. Der pålægges IKKE overhead på direkte driftsomkostninger. ' +
      'Satsen er obligatorisk: "Den fastlagte overheadsats og priskalkulationsskema skal anvendes."',
  },
  {
    id: 'idv-110-2023',
    label: 'IDV — 110% på direkte løn (2023–2025)',
    rate: 1.10,
    base: 'direct_salary',
    mode: 'markup',
    effectiveFrom: '2023-01-01',
    effectiveTo: '2025-12-31',
    source: SRC_IDV_OH_2026,
    note: 'Historisk sats. Nedsat til 105% fra 2026.',
  },
  {
    id: 'tilskud-44',
    label: 'Tilskudsfinansieret — 44% (statslige fonde, fx DFF)',
    rate: 0.44,
    base: 'all_direct_costs',
    mode: 'markup',
    effectiveFrom: '2015-01-01',
    effectiveTo: null,
    source: SRC_FSE_FONDSANSOEGNING,
    note:
      'Beregnes af projektets samlede direkte udgifter — løn, materialer, rejser, ' +
      'publicering mv. Til forskel fra IDV, hvor overhead kun pålægges lønnen.',
  },
  {
    id: 'ingen-0',
    label: 'Ingen overhead (mange private fonde)',
    rate: 0,
    base: 'all_direct_costs',
    mode: 'none',
    effectiveFrom: '2015-01-01',
    effectiveTo: null,
    source: SRC_FSE_FONDSANSOEGNING,
    note:
      'Mange private fonde giver ikke overhead. Jf. IKK-frikøbspolitikken princip 5 skal der ' +
      'da aftales med institutlederen, hvordan projektet bidrager til generalieudgifterne.',
  },
  {
    id: 'inkluderet-i-timesats',
    label: 'Overhead allerede inkluderet i timesatsen (samfinansieret)',
    rate: 0,
    base: 'all_direct_costs',
    mode: 'included_in_rate',
    effectiveFrom: '2015-01-01',
    effectiveTo: null,
    source: SRC_FSE_FONDSANSOEGNING,
    note:
      'Timetaksterne for samfinansieret forskning er angivet inklusive dækning af ' +
      'generalieudgifter. Der må IKKE pålægges yderligere overhead.',
  },
];

/**
 * Profit margin (overskudsgrad / EBIT-margin). IDV only.
 *
 * Note the base differs from overhead: the margin is required on *all* costs,
 * while overhead applies only to salary.
 */
export interface MarginPolicy {
  id: string;
  label: string;
  rate: number;
  /**
   * `total_costs` includes overhead; `direct_costs` does not.
   *
   * ⚠️ The sources are not fully explicit. AU Økonomi says the margin "beregnes ud
   * fra alle løn- og driftsomkostninger", which reads as direct costs only, but the
   * priskalkulationsskema's line G is "Omkostninger i alt inklusiv EBIT-avance
   * (E+F)" where E is total costs — which reads as including overhead. We default to
   * `total_costs` to match the official form's structure and flag it. Confirm before
   * a quote goes out.
   */
  base: 'total_costs' | 'direct_costs';
  effectiveFrom: string;
  effectiveTo: string | null;
  source: DocumentRef;
  note?: string;
}

export const MARGIN_POLICIES: MarginPolicy[] = [
  {
    id: 'idv-min-10',
    label: 'IDV — minimumsoverskudsgrad 10%',
    rate: 0.10,
    base: 'total_costs',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    source: SRC_IDV_OH_2026,
    note:
      'Fall-back, når der ikke kan udledes en objektiv markedspris. Findes der en ' +
      'markedspris, er den minimumsprisen. Kan en højere pris forhandles, bør den bruges.',
  },
  {
    id: 'idv-monopol-0',
    label: 'IDV — monopollignende situation, 0%',
    rate: 0,
    base: 'total_costs',
    effectiveFrom: '2026-01-01',
    effectiveTo: null,
    source: SRC_IDV_OH_2026,
    note:
      'Ved monopollignende tilstande sættes overskudsgraden til nul. Overhead skal ' +
      'stadig indregnes.',
  },
];

/** Danish VAT. Applies to commercial IDV, not to grant funding. */
export const MOMS_RATE = 0.25;

export function selectOverheadAt(id: string, isoDate: string): OverheadPolicy {
  const hit = OVERHEAD_POLICIES.find(
    (p) =>
      p.id === id && isoDate >= p.effectiveFrom && (p.effectiveTo === null || isoDate <= p.effectiveTo),
  );
  if (!hit) {
    const any = OVERHEAD_POLICIES.find((p) => p.id === id);
    if (!any) throw new Error(`Ukendt overheadpolitik: ${id}`);
    throw new Error(
      `Overheadpolitikken "${id}" gælder ikke pr. ${isoDate} ` +
        `(gyldig ${any.effectiveFrom}–${any.effectiveTo ?? 'fortsat'}).`,
    );
  }
  return hit;
}
