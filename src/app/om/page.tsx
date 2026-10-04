import { Section, tableWrap, table, th, td, trBorder } from '../_components/reference';

export const metadata = { title: 'Om beregneren — Frikøbsberegner' };

const DEVIATIONS: { example: string; published: string; canonical: string }[] = [
  { example: '1', published: '493', canonical: '492,9' },
  { example: '2', published: '82', canonical: '82,2' },
  { example: '3', published: '328', canonical: '328,6' },
  { example: '4', published: '123', canonical: '123,2' },
  { example: '5', published: '164,2', canonical: '164,3' },
  { example: '6', published: '82,1 / 54,7', canonical: '82,2 / 54,8' },
  { example: '7', published: '492,8 / 328,5', canonical: '492,9 / 328,6' },
];

const KILDEGRUPPER: { label: string; description: string }[] = [
  {
    label: 'Arbejdstid',
    description: 'Arbejdstidsaftalen for Arts (outranker institutnotater) og ph.d.-institutarbejdsreglerne.',
  },
  {
    label: 'Frikøb',
    description: 'IKS-notat og FAQ (2022), IKK-notat (2026), IKK-frikøbspolitikken.',
  },
  {
    label: 'Kostpris',
    description: 'Procesdokument, historiske formler, takstkataloget for 2024/25/26, beregnede kostpriser 2025–2032.',
  },
  {
    label: 'Indtægtsdækket virksomhed',
    description: 'Overheadsats 2026/27, vejledning, miniguide, priskalkulationsskema, AU Ceteras prisliste.',
  },
  {
    label: 'Løn',
    description: 'Arts’ lønaftale af 17. september 2025.',
  },
];

export default function OmPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Om beregneren</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Et internt værktøj for forskningskonsulenter på Faculty of Arts, Aarhus Universitet.
        </p>
      </header>

      <Section title="Om beregneren">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Et frikøb kan beregnes begge veje — fra bevilling til måneder og timer, eller omvendt.
          Beregneren viser en citeret, trin-for-trin udregning, som en konsulent kan sætte ind i et
          projektbudget og forsvare over for en bevillingsgiver.
        </p>
      </Section>

      <Section
        title="Afrundingspolitik"
        intro="Beregnerens tal kan afvige lidt fra et cirkulerende notat — højst 0,6 timer. Det skyldes, at beregneren kun runder til sidst, mens notaterne runder undervejs."
        collapsible
      >
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Kort sagt: alle tal rundes til nærmeste værdi, undtagen de hele timer, der skal tastes
          ind i Vipomatic — de rundes altid ned, så der aldrig registreres mere, end frikøbet
          reelt finansierede.
        </p>

        <details className="group">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-xs font-medium text-accent marker:content-none">
            Se alle afrundingsregler i detaljer
            <span
              aria-hidden="true"
              className="text-zinc-400 transition-transform group-open:rotate-180 dark:text-zinc-500"
            >
              ▾
            </span>
          </summary>
          <div className="mt-3 flex flex-col gap-3">
            <div className={tableWrap} role="region" tabIndex={0} aria-label="Tabel, kan rulles vandret">
              <table className={table}>
                <thead>
                  <tr>
                    <th scope="col" className={th}>Felt</th>
                    <th scope="col" className={th}>Decimaler</th>
                    <th scope="col" className={th}>Metode</th>
                    <th scope="col" className={th}>Begrundelse</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={trBorder}>
                    <td className={td}>Arbejdstimer, undervisningstimer, forskningstimer</td>
                    <td className={td}>1</td>
                    <td className={td}>Op/ned efter nærmeste</td>
                    <td className={td}>Svarer til, hvordan notaterne selv fremviser timer</td>
                  </tr>
                  <tr className={trBorder}>
                    <td className={td}>Timer til registrering (den ærlige figur)</td>
                    <td className={td}>1</td>
                    <td className={td}>Op/ned efter nærmeste</td>
                    <td className={td}>—</td>
                  </tr>
                  <tr className={trBorder}>
                    <td className={td}>
                      <strong>Hele timer til indtastning i Vipomatic</strong>
                    </td>
                    <td className={td}>0</td>
                    <td className={td}>
                      <strong>Nedrundet</strong>
                    </td>
                    <td className={td}>Der registreres aldrig flere timer, end frikøbet reelt finansierede</td>
                  </tr>
                  <tr className={trBorder}>
                    <td className={td}>Måneder</td>
                    <td className={td}>2 (visning)</td>
                    <td className={td}>Op/ned efter nærmeste</td>
                    <td className={td}>Eksakt internt</td>
                  </tr>
                  <tr className={trBorder}>
                    <td className={td}>Beløb</td>
                    <td className={td}>0</td>
                    <td className={td}>Op/ned efter nærmeste</td>
                    <td className={td}>Danske budgetter opgives i hele kroner</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className={tableWrap} role="region" tabIndex={0} aria-label="Tabel, kan rulles vandret">
              <table className={table}>
                <thead>
                  <tr>
                    <th scope="col" className={th}>Eksempel</th>
                    <th scope="col" className={th}>Publiceret</th>
                    <th scope="col" className={th}>Beregnerens tal</th>
                  </tr>
                </thead>
                <tbody>
                  {DEVIATIONS.map((d) => (
                    <tr key={d.example} className={trBorder}>
                      <td className={td}>{d.example}</td>
                      <td className={td}>{d.published}</td>
                      <td className={td}>{d.canonical}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>

        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Tre alternative afrundingsprofiler i motoren matcher et bestemt cirkulerende notat til
          punkt og prikke — kontakt os, hvis du har brug for en af dem.
        </p>
      </Section>

      <Section
        title="Kilder"
        intro="Ethvert tal i beregneren stammer fra et af disse dokumenter — se dem alle med satser under Satser og normer. 28 kildedokumenter i alt, alle fra ARTS eller en central AU-enhed."
        collapsible
      >
        <div className={tableWrap} role="region" tabIndex={0} aria-label="Tabel, kan rulles vandret">
          <table className={table}>
            <thead>
              <tr>
                <th scope="col" className={th}>Gruppe</th>
                <th scope="col" className={th}>Omfatter</th>
              </tr>
            </thead>
            <tbody>
              {KILDEGRUPPER.map((g) => (
                <tr key={g.label} className={trBorder}>
                  <td className={td}>
                    <span className="font-medium">{g.label}</span>
                  </td>
                  <td className={td}>{g.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
