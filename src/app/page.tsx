import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DEMO_MODE } from '@/lib/demo';
import { ThemeToggle } from './_components/ThemeToggle';

export const metadata = {
  title: 'Frikøbsberegner — portfolio demo',
  description:
    'A frikøb (research buy-out) calculator built for Aarhus University, Faculty of Arts: a bidirectional solver with a cited, step-by-step derivation for every result.',
};

const HIGHLIGHTS: { title: string; body: string }[] = [
  {
    title: 'The derivation is the product',
    body: 'Every result comes with a step-by-step trace — each intermediate value, the formula behind it, and a citation to the source document and clause. The trace is built before the arithmetic runs, so no number can exist without its derivation.',
  },
  {
    title: 'One bidirectional solver',
    body: 'Start from whatever you know — kroner, months or registered hours — and the other two are derived through the same conversion graph, so the three directions can never drift apart.',
  },
  {
    title: 'A pure, typed calculation core',
    body: 'Framework-free TypeScript with branded units (an hour can’t be added to a month), date-versioned constants that each cite their source, and missing data that fails loudly instead of defaulting.',
  },
  {
    title: 'Verified against the source documents',
    body: '169 tests, including golden fixtures that reproduce every worked example in the university’s own documents exactly — rounding direction included — plus property-based round-trip tests.',
  },
];

const TOUR: { href: string; label: string; body: string }[] = [
  {
    href: '/beregner',
    label: 'Beregner',
    body: 'The calculator. Opens on a worked example; change any input and expand the derivation below the result.',
  },
  {
    href: '/satser',
    label: 'Satser og normer',
    body: 'Every rate and norm the engine uses, with its source.',
  },
  {
    href: '/om',
    label: 'Om',
    body: 'How it works, and where the source documents disagree with each other.',
  },
];

export default function Home() {
  if (!DEMO_MODE) redirect('/beregner');

  return (
    <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-12 px-6 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <header className="flex flex-col gap-5">
        <p className="text-sm font-medium text-accent">Portfolio demo</p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Frikøbsberegner
        </h1>
        <p className="text-lg text-zinc-700 dark:text-zinc-300">
          An internal tool built for research consultants at Aarhus University, Faculty of Arts, to
          budget <em>frikøb</em>: buying out a researcher’s time with external grant money.
        </p>
        <p className="text-zinc-600 dark:text-zinc-400">
          The arithmetic runs in both directions and mixes kroner, months and hours across three
          incompatible annual-hour bases, so the same number means different things depending on
          which one it’s expressed in. The tool gives consultants a figure plus a cited derivation
          they can paste into a budget and defend to a funder.
        </p>
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            href="/beregner"
            className="rounded-md bg-accent px-6 py-3 text-base font-medium text-accent-foreground shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Try the calculator →
          </Link>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            No sign-up. The interface is in Danish, as used by its audience.
          </span>
        </div>
      </header>

      <section aria-labelledby="highlights" className="flex flex-col gap-5">
        <h2 id="highlights" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          What’s interesting about it
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {HIGHLIGHTS.map((h) => (
            <li
              key={h.title}
              className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800"
            >
              <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{h.title}</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">{h.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="tour" className="flex flex-col gap-5">
        <h2 id="tour" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Where to look
        </h2>
        <ul className="flex flex-col gap-3">
          {TOUR.map((t) => (
            <li key={t.href} className="text-zinc-600 dark:text-zinc-400">
              <Link href={t.href} className="font-medium text-accent underline underline-offset-2">
                {t.label}
              </Link>{' '}
              — {t.body}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="stack" className="flex flex-col gap-3">
        <h2 id="stack" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Built with
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400">
          Next.js · React · TypeScript · Tailwind CSS · Vitest + fast-check · Postgres (Neon) +
          Prisma for per-person login in the production version · deployed on Vercel. The production
          tool is in use at the faculty and has been shaped by several rounds of feedback from its
          users.
        </p>
        <p className="text-zinc-600 dark:text-zinc-400">
          <a
            href="https://github.com/Gamborg0101/aucalc-demo"
            className="font-medium text-accent underline underline-offset-2"
          >
            Source code on GitHub
          </a>
        </p>
      </section>
    </div>
  );
}
