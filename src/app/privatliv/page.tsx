import { Section } from '../_components/reference';

export const metadata = { title: 'Databehandling — Frikøbsberegner' };

export default function PrivatlivPage() {
  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Databehandling og privatliv
        </h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          En kort, ærlig beskrivelse af hvilke oplysninger dette værktøj gemmer, og hvorfor.
        </p>
      </header>

      <Section title="Hvilke oplysninger gemmes">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Når du opretter en konto, gemmer vi dit navn, dit brugernavn og din adgangskode —
          adgangskoden aldrig i klartekst, kun som et hash (bcrypt), som ikke kan regnes tilbage
          til den oprindelige kode. Når du er logget ind, sætter vi en cookie i din browser, der
          indeholder dit bruger-id og navn; cookien er kryptografisk signeret, så den ikke kan
          ændres, men indholdet er ikke hemmeligt. Vi indsamler ikke andre personoplysninger, og
          selve beregningerne (stillingskategori, kostpris, beløb mv.) knyttes ikke til din
          konto — de lever kun i den URL, du eventuelt selv vælger at dele.
        </p>
      </Section>

      <Section title="Hvorfor">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Udelukkende for at give adgang til værktøjet og vise, hvem der er logget ind. Der er
          ingen markedsføring, sporing eller videresalg af oplysninger.
        </p>
      </Section>

      <Section title="Hvor det ligger">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Værktøjet driftes på Vercel, og kontooplysningerne ligger i en Postgres-database hos
          Neon, i AWS&rsquo; eu-central-1-region (Frankfurt, Tyskland) — inden for EU. Begge
          leverandører har en standard databehandleraftale indbygget i deres vilkår.
        </p>
      </Section>

      <Section title="Hvor længe vi gemmer det">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Din konto gemmes, indtil du selv sletter den på{' '}
          <span className="font-mono text-xs">/konto</span>, eller beder os om det — der er ingen
          automatisk sletning af inaktive konti.
        </p>
      </Section>

      <Section title="Dine rettigheder">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Du kan til enhver tid bede om at få dine oplysninger slettet eller udleveret. Skriv til{' '}
          <a href="mailto:cg@cc.au.dk" className="text-accent underline underline-offset-2">
            cg@cc.au.dk
          </a>{' '}
          med spørgsmål om databehandlingen, eller hvis du ønsker din konto slettet.
        </p>
      </Section>

      <Section title="Forbehold">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          Denne side er skrevet for at være ærlig om, hvad systemet teknisk set gør — den er{' '}
          <strong>ikke</strong> juridisk kvalitetssikret af AU&rsquo;s jurist eller DPO, og udgør ikke en
          formel privatlivspolitik. Se{' '}
          <span className="font-mono text-xs">docs/todo-privatliv.md</span> i projektet for de
          punkter, der stadig mangler afklaring, før værktøjet bredes ud.
        </p>
      </Section>
    </div>
  );
}
