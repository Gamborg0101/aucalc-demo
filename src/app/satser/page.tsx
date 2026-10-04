import {
  AARSNORM_PERIODS,
  CATEGORY_NORMS,
  PRODUCTIVE_HOURS_BASES,
  OVERHEAD_POLICIES,
  MARGIN_POLICIES,
  MOMS_RATE,
  KOSTPRIS_PARAMS,
  TAKSTKATALOG,
  RATE_TABLES,
  MAANEDENS_TIMER,
  PAYROLL_ANNUAL_HOURS,
  da,
} from '@/lib/frikoeb';
import { Section, Cite, th, td, tableWrap, table, trBorder } from '../_components/reference';

export const metadata = { title: 'Satser og normer — Frikøbsberegner' };

const RATE_CATEGORY_LABEL: Record<string, string> = {
  professor: 'Professor',
  lektor: 'Lektor',
  adjunkt_postdoc_phd: 'Adjunkt/postdoc/ph.d.',
  phd_uden_phd: 'Ph.d.-stud./vid.ass.',
  studerende: 'Studerende',
};

/**
 * The three categories the /beregner picker actually offers (a frikøb is in
 * practice always one of these — see `CALCULATOR_CATEGORIES` in
 * `ScenarioForm.tsx`). Mirrored here so this reference page doesn't document
 * more than the calculator supports; the engine's own `CATEGORY_NORMS` and
 * `TAKSTKATALOG` stay complete underneath for the categories reachable via an
 * older shared link.
 */
const SUPPORTED_CATEGORIES = ['lektor', 'adjunkt', 'professor'];
const SUPPORTED_TAKST_CODES = ['121', '131', '111'];

// --- page --------------------------------------------------------------------

export default function SatserPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Satser og normer</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Alle tal, beregneren bruger, samlet ét sted med kildeangivelse.
        </p>
      </header>

      <Section
        title="Årsnorm"
        intro="Arbejdstidsnormen. Instituttet må ikke lokalt afvige fra den (arbejdstidsaftalens §5)."
        collapsible
      >
        <div className={tableWrap} role="region" tabIndex={0} aria-label="Tabel, kan rulles vandret">
          <table className={table}>
            <thead>
              <tr>
                <th scope="col" className={th}>Gyldig</th>
                <th scope="col" className={th}>År (t)</th>
                <th scope="col" className={th}>Semester (t)</th>
                <th scope="col" className={th}>Måned (t)</th>
                <th scope="col" className={th}>Undervisning/semester (t)</th>
                <th scope="col" className={th}>Kilde</th>
              </tr>
            </thead>
            <tbody>
              {AARSNORM_PERIODS.map((p) => (
                <tr key={p.id} className={trBorder}>
                  <td className={td}>
                    {p.effectiveFrom} – {p.effectiveTo ?? 'i dag'}
                  </td>
                  <td className={td}>{da(p.annualWorkHours)}</td>
                  <td className={td}>{da(p.published.semesterWorkHours)}</td>
                  <td className={td}>{da(p.published.monthlyWorkHours, 1)}</td>
                  <td className={td}>{da(p.published.semesterTeachingHours)}</td>
                  <td className={td}>
                    <Cite source={p.source} />
                    {p.note && <div className="mt-0.5 italic">{p.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Stillingskategorier — andel registreret i Vipomatic"
        intro="Kun undervisning, administration og ph.d.-relaterede opgaver registreres. Forskningstiden registreres aldrig."
        collapsible
      >
        <div className={tableWrap} role="region" tabIndex={0} aria-label="Tabel, kan rulles vandret">
          <table className={table}>
            <thead>
              <tr>
                <th scope="col" className={th}>Kategori</th>
                <th scope="col" className={th}>Andel registreret</th>
                <th scope="col" className={th}>Kilde</th>
              </tr>
            </thead>
            <tbody>
              {CATEGORY_NORMS.filter((c) => SUPPORTED_CATEGORIES.includes(c.category)).map((c) => (
                <tr key={c.category} className={trBorder}>
                  <td className={td}>{c.label}</td>
                  <td className={td}>
                    {c.registeredShare === null ? (
                      <span className="font-medium text-amber-700 dark:text-amber-400">
                        Ingen fast norm — aftales individuelt
                      </span>
                    ) : (
                      `${da(c.registeredShare * 100)}%`
                    )}
                  </td>
                  <td className={td}>
                    <Cite source={c.source} />
                    {c.note && <div className="mt-0.5 italic">{c.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Produktive timenormer"
        intro="Bruges til at afregne over for en ekstern part. En kr/time-figur skal altid angive, hvilket grundlag den er beregnet ud fra."
        collapsible
      >
        <div className={tableWrap} role="region" tabIndex={0} aria-label="Tabel, kan rulles vandret">
          <table className={table}>
            <thead>
              <tr>
                <th scope="col" className={th}>Grundlag</th>
                <th scope="col" className={th}>Timer/år</th>
                <th scope="col" className={th}>Anvendes når</th>
              </tr>
            </thead>
            <tbody>
              {PRODUCTIVE_HOURS_BASES.map((b) => (
                <tr key={b.id} className={trBorder}>
                  <td className={td}>{b.label}</td>
                  <td className={td}>{da(b.annualHours)}</td>
                  <td className={td}>{b.appliesWhen}</td>
                </tr>
              ))}
              <tr className={trBorder}>
                <td className={td}>{da(PAYROLL_ANNUAL_HOURS)} t — AU&rsquo;s lønmæssige fuldtidsnorm</td>
                <td className={td}>{da(PAYROLL_ANNUAL_HOURS)}</td>
                <td className={td}>Kostprisens nævner ({da(MAANEDENS_TIMER, 2)} t/md). Inkl. ferie.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Overhead"
        intro="Overheadsatsens base afhænger af finansieringsformen — se hvilken for hver politik nedenfor."
        collapsible
      >
        <div className={tableWrap} role="region" tabIndex={0} aria-label="Tabel, kan rulles vandret">
          <table className={table}>
            <thead>
              <tr>
                <th scope="col" className={th}>Politik</th>
                <th scope="col" className={th}>Sats</th>
                <th scope="col" className={th}>Base</th>
                <th scope="col" className={th}>Gyldig</th>
                <th scope="col" className={th}>Kilde</th>
              </tr>
            </thead>
            <tbody>
              {OVERHEAD_POLICIES.map((o) => (
                <tr key={o.id} className={trBorder}>
                  <td className={td}>{o.label}</td>
                  <td className={td}>
                    {o.mode === 'markup' ? `${da(o.rate * 100)}%` : o.mode === 'included_in_rate' ? 'Inkl. i takst' : 'Ingen'}
                  </td>
                  <td className={td}>{o.base === 'direct_salary' ? 'Direkte løn' : 'Alle direkte omk.'}</td>
                  <td className={td}>
                    {o.effectiveFrom} – {o.effectiveTo ?? 'i dag'}
                  </td>
                  <td className={td}>
                    <Cite source={o.source} />
                    {o.note && <div className="mt-0.5 italic">{o.note}</div>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <h3 className="mt-2 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Overskudsgrad (IDV — indtægtsdækket virksomhed)
        </h3>
        <div className={tableWrap} role="region" tabIndex={0} aria-label="Tabel, kan rulles vandret">
          <table className={table}>
            <thead>
              <tr>
                <th scope="col" className={th}>Politik</th>
                <th scope="col" className={th}>Sats</th>
                <th scope="col" className={th}>Base</th>
                <th scope="col" className={th}>Kilde</th>
              </tr>
            </thead>
            <tbody>
              {MARGIN_POLICIES.map((m) => (
                <tr key={m.id} className={trBorder}>
                  <td className={td}>{m.label}</td>
                  <td className={td}>{da(m.rate * 100)}%</td>
                  <td className={td}>{m.base === 'total_costs' ? 'Samlede omk.' : 'Direkte omk.'}</td>
                  <td className={td}>
                    <Cite source={m.source} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Moms (kommerciel IDV — indtægtsdækket virksomhed): {da(MOMS_RATE * 100)}%.
        </p>
      </Section>

      <Section
        title="Kostpris — formelparametre"
        intro={
          <>
            Kostpris = (Månedens løn ÷ {da(MAANEDENS_TIMER, 2)}) × feriefaktor + bidrag. Bidraget
            dækker bl.a. pension, ferieafregning ved fratrædelser, seniorbonus og særlig
            feriegodtgørelse. Det dækker ikke engangsudbetalinger (overarbejde, engangstillæg)
            eller de ekstra udgifter, der opstår ved barsel eller sygdom. Estimér kun — den reelle
            kostpris for en navngiven person ligger i Navision.
          </>
        }
        collapsible
      >
        <div className={tableWrap} role="region" tabIndex={0} aria-label="Tabel, kan rulles vandret">
          <table className={table}>
            <thead>
              <tr>
                <th scope="col" className={th}>År</th>
                <th scope="col" className={th}>Feriefaktor</th>
                <th scope="col" className={th}>Bidrag (kr/t)</th>
                <th scope="col" className={th}>Note</th>
              </tr>
            </thead>
            <tbody>
              {KOSTPRIS_PARAMS.slice(0, 3).map((p) => (
                <tr key={p.year} className={trBorder}>
                  <td className={td}>{p.year}</td>
                  <td className={td}>{da(p.feriefaktor, 3)}</td>
                  <td className={td}>{da(p.bidragKrPerHour, 2)}</td>
                  <td className={td}>{p.note ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Ældre år (2015–{KOSTPRIS_PARAMS[3]?.year}): se Kostpris_historiske_formler_2015-2026.pdf.
        </p>
      </Section>

      <Section
        title="Takstkatalog — månedsløn, middel (kr)"
        intro="Til budgettering, når medarbejderen ikke er navngivet endnu. Navngiven person → brug kostprisen fra Navision i stedet."
        collapsible
      >
        <div className={tableWrap} role="region" tabIndex={0} aria-label="Tabel, kan rulles vandret">
          <table className={table}>
            <thead>
              <tr>
                <th scope="col" className={th}>Stillingstype</th>
                {Object.keys(TAKSTKATALOG[0]?.byYear ?? {})
                  .map(Number)
                  .sort((a, b) => a - b)
                  .map((y) => (
                    <th key={y} scope="col" className={`${th} text-right`}>
                      {y}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {TAKSTKATALOG.filter((row) => SUPPORTED_TAKST_CODES.includes(row.code)).map((row) => {
                const years = Object.keys(row.byYear)
                  .map(Number)
                  .sort((a, b) => a - b);
                return (
                  <tr key={row.code} className={trBorder}>
                    <td className={td}>
                      {row.label} <span className="text-zinc-400">({row.code})</span>
                    </td>
                    {years.map((y) => (
                      <td key={y} className={`${td} text-right`}>
                        {da(row.byYear[y].middel ?? row.byYear[y].median)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Vejledende timetakster — markedsprøve"
        intro="Bruges kun til at kontrollere, at en IDV-pris (indtægtsdækket virksomhed) ikke underbyder markedet. Dateret 2019 — behandl som forældede, medmindre andet er bekræftet."
        collapsible
      >
        {RATE_TABLES.map((t) => (
          <div key={t.id} className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {t.label} {t.provisional && <span className="ml-1 text-xs font-normal text-amber-700 dark:text-amber-400">(foreløbig, ikke bekræftet)</span>}
            </h3>
            <div className={tableWrap} role="region" tabIndex={0} aria-label="Tabel, kan rulles vandret">
              <table className={table}>
                <thead>
                  <tr>
                    {Object.keys(t.rates).map((cat) => (
                      <th key={cat} scope="col" className={th}>
                        {RATE_CATEGORY_LABEL[cat] ?? cat}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className={trBorder}>
                    {Object.values(t.rates).map((v, i) => (
                      <td key={i} className={td}>
                        {da(v)} kr/t
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
            {!t.includesOverhead && (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Prisen er ekskl. overhead — læg det oveni. Kilde: <Cite source={t.source} />.
              </p>
            )}
            {t.note && <p className="text-xs italic text-zinc-500 dark:text-zinc-400">{t.note}</p>}
            {!t.includesOverhead && (
              <p className="text-xs italic text-zinc-500 dark:text-zinc-400">
                Kontakt{' '}
                <a
                  href="https://medarbejdere.au.dk/administration/oekonomi/oekonomi-paa-fakulteterne/oekonomi-paa-arts/kontaktpersoner"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-dotted underline-offset-2 hover:text-accent"
                >
                  Arts Økonomi
                </a>{' '}
                ved tilbudsgivelse.
              </p>
            )}
          </div>
        ))}
      </Section>
    </div>
  );
}
