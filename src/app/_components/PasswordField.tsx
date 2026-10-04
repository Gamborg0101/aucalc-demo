'use client';

import { useState } from 'react';

const inputCls =
  'w-full rounded-md border border-zinc-300 bg-white py-2 pl-3 pr-14 text-sm text-zinc-900 shadow-sm focus:border-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100';

export function PasswordField({
  label,
  name,
  autoComplete,
  required = true,
  minLength,
  autoFocus,
  hint,
}: {
  label: string;
  name: string;
  autoComplete: 'current-password' | 'new-password';
  required?: boolean;
  minLength?: number;
  autoFocus?: boolean;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          name={name}
          required={required}
          minLength={minLength}
          autoFocus={autoFocus}
          autoComplete={autoComplete}
          className={inputCls}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Skjul adgangskode' : 'Vis adgangskode'}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-xs font-medium text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {visible ? 'Skjul' : 'Vis'}
        </button>
      </div>
      {hint && <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>}
    </label>
  );
}
