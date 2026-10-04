'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function storedOrSystemTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme');
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // localStorage unavailable — fall through to system preference.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  // Always starts 'light', matching the server-rendered data-theme="light"
  // default exactly — the actual theme (set on <html> before this component
  // even mounts, by the blocking script in layout.tsx) is picked up in the
  // effect below instead of a lazy initializer, specifically so the first
  // client render matches SSR and hydration doesn't fail on a genuinely
  // different SVG icon tree. That correction necessarily happens post-mount,
  // hence setState in an effect here — not the avoidable-derived-state case
  // the lint rule is for.
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const current = document.documentElement.getAttribute('data-theme');
    const resolved = current === 'dark' || current === 'light' ? current : storedOrSystemTheme();
    document.documentElement.setAttribute('data-theme', resolved);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate: see comment on `theme` above
    setTheme(resolved);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      // Ignore — theme just won't persist across visits.
    }
    setTheme(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === 'dark' ? 'Skift til lyst tema' : 'Skift til mørkt tema'}
      className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-accent dark:text-zinc-400 dark:hover:bg-zinc-800"
    >
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path
            strokeLinecap="round"
            d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
        </svg>
      )}
    </button>
  );
}
