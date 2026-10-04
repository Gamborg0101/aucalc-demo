import Link from 'next/link';
import { PasswordField } from '../_components/PasswordField';
import { ThemeToggle } from '../_components/ThemeToggle';
import { signup } from '../login/actions';

export const metadata = { title: 'Opret konto — Frikøbsberegner' };

export default async function SignupPage(props: PageProps<'/signup'>) {
  const { error } = await props.searchParams;

  return (
    <div className="relative mx-auto flex w-full max-w-sm flex-col gap-8 px-6 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Opret konto
      </h1>

      <form action={signup} className="flex flex-col gap-3" noValidate>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Navn</span>
          <input
            type="text"
            name="name"
            required
            autoFocus
            autoComplete="name"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Brugernavn</span>
          <input
            type="text"
            name="username"
            required
            autoComplete="username"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <PasswordField
          label="Adgangskode"
          name="password"
          autoComplete="new-password"
          minLength={8}
          hint="Mindst 8 tegn."
        />
        <PasswordField
          label="Bekræft adgangskode"
          name="confirmPassword"
          autoComplete="new-password"
          minLength={8}
        />
        {error === 'taken' && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Det brugernavn er allerede taget.
          </p>
        )}
        {error === 'mismatch' && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Adgangskoderne er ikke ens.
          </p>
        )}
        {error === '1' && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Udfyld navn, brugernavn og en adgangskode på mindst 8 tegn.
          </p>
        )}
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Opret konto
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Har du allerede en konto?{' '}
        <Link href="/login" className="text-accent underline underline-offset-2">
          Log ind
        </Link>
      </p>
    </div>
  );
}
