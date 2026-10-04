import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { ACCESS_COOKIE, parseAccessToken } from '@/lib/access';
import { PasswordField } from '../_components/PasswordField';
import { changePassword, deleteAccount } from '../login/actions';

export const metadata = { title: 'Konto — Frikøbsberegner' };

export default async function KontoPage(props: PageProps<'/konto'>) {
  const { error, success, deleteError } = await props.searchParams;
  const session = parseAccessToken((await cookies()).get(ACCESS_COOKIE)?.value);
  if (!session) redirect('/login?callbackUrl=%2Fkonto');

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8 px-6 py-16">
      <header className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Konto</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Logget ind som {session.name}.</p>
      </header>

      <form action={changePassword} className="flex flex-col gap-3" noValidate>
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Skift adgangskode</h2>
        <PasswordField
          label="Nuværende adgangskode"
          name="currentPassword"
          autoComplete="current-password"
          autoFocus
        />
        <PasswordField
          label="Ny adgangskode"
          name="newPassword"
          autoComplete="new-password"
          minLength={8}
          hint="Mindst 8 tegn."
        />
        {error === 'wrong' && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Forkert nuværende adgangskode.
          </p>
        )}
        {error === '1' && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Udfyld begge felter — ny adgangskode skal være mindst 8 tegn.
          </p>
        )}
        {success === '1' && (
          <p role="status" className="text-sm text-green-700 dark:text-green-400">
            Adgangskoden er skiftet.
          </p>
        )}
        <button
          type="submit"
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:opacity-90"
        >
          Skift adgangskode
        </button>
      </form>

      <form
        action={deleteAccount}
        className="flex flex-col gap-3 rounded-md border border-red-300 p-4 dark:border-red-800"
        noValidate
      >
        <h2 className="text-sm font-semibold text-red-700 dark:text-red-400">Slet konto</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Din konto slettes permanent. Dette kan ikke fortrydes.
        </p>
        <PasswordField label="Adgangskode" name="password" autoComplete="current-password" />
        <label className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input type="checkbox" required className="mt-0.5" />
          Jeg forstår, at dette ikke kan fortrydes.
        </label>
        {deleteError === 'wrong' && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Forkert adgangskode.
          </p>
        )}
        {deleteError === '1' && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            Udfyld adgangskoden.
          </p>
        )}
        <button
          type="submit"
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
        >
          Slet konto
        </button>
      </form>
    </div>
  );
}
