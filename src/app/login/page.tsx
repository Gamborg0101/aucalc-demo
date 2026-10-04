import Link from 'next/link';
import { PasswordField } from '../_components/PasswordField';
import { ThemeToggle } from '../_components/ThemeToggle';
import { login } from './actions';

export const metadata = { title: 'Log ind — Frikøbsberegner' };

export default async function LoginPage(props: PageProps<'/login'>) {
  const { error, callbackUrl } = await props.searchParams;

  return (
    <div className="relative mx-auto flex w-full max-w-sm flex-col gap-8 px-6 py-16">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <h1 className="text-center text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Log ind
      </h1>

      <form action={login} className="flex flex-col gap-3" noValidate>
        <input
          type="hidden"
          name="callbackUrl"
          value={typeof callbackUrl === 'string' ? callbackUrl : ''}
        />
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Brugernavn</span>
          <input
            type="text"
            name="username"
            required
            autoFocus
            autoComplete="username"
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <PasswordField label="Adgangskode" name="password" autoComplete="current-password" />
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Forkert brugernavn eller adgangskode. Prøv igen.
          </p>
        )}
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Log ind
        </button>
      </form>

      <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
        Ny her?{' '}
        <Link href="/signup" className="text-accent underline underline-offset-2">
          Opret konto
        </Link>
      </p>
    </div>
  );
}
