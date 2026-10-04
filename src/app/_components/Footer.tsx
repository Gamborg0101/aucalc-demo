import Link from 'next/link';

export function Footer() {
  return (
    <footer className="print:hidden border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-6 py-6 text-xs text-zinc-500 dark:text-zinc-400 sm:flex-row sm:items-center sm:justify-between">
        <p>
          Vi gemmer kun de oplysninger, der er nødvendige for at give dig adgang til værktøjet.{' '}
          <Link href="/privatliv" className="underline underline-offset-2 hover:text-accent">
            Læs om databehandling
          </Link>
          .
        </p>
        <p>
          Spørgsmål:{' '}
          <a href="mailto:cg@cc.au.dk" className="underline underline-offset-2 hover:text-accent">
            cg@cc.au.dk
          </a>
        </p>
      </div>
    </footer>
  );
}
