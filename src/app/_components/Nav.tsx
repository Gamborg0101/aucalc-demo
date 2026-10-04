'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '../login/actions';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { href: '/beregner', label: 'Beregner' },
  { href: '/satser', label: 'Satser og normer' },
  { href: '/om', label: 'Om' },
];

export function Nav({ userName }: { userName: string }) {
  const pathname = usePathname();

  return (
    <header className="border-t-2 border-t-accent border-b border-b-zinc-200 print:hidden dark:border-b-zinc-800">
      <nav
        aria-label="Hovednavigation"
        className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-3"
      >
        <div className="flex flex-1 gap-4">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? 'page' : undefined}
                className={
                  active
                    ? 'text-sm font-medium text-accent'
                    : 'text-sm text-zinc-600 hover:text-accent dark:text-zinc-400'
                }
              >
                {l.label}
              </Link>
            );
          })}
        </div>
        <ThemeToggle />
        <div className="flex items-center gap-3">
          <Link
            href="/konto"
            aria-current={pathname === '/konto' ? 'page' : undefined}
            className={
              pathname === '/konto'
                ? 'text-sm font-medium text-accent'
                : 'text-sm text-zinc-600 underline decoration-dotted underline-offset-2 hover:text-accent dark:text-zinc-400'
            }
          >
            {userName}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="text-sm text-zinc-600 underline decoration-dotted underline-offset-2 hover:text-accent dark:text-zinc-400"
            >
              Log ud
            </button>
          </form>
        </div>
      </nav>
    </header>
  );
}
