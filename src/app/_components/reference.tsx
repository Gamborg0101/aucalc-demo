/**
 * Shared building blocks for the reference pages (/satser, /om) — plain
 * cards and tables, no state. Not a route: the `_` prefix opts it out of
 * Next's file-system routing.
 */
import type { ReactNode } from 'react';
import type { DocumentRef } from '@/lib/frikoeb';

/**
 * `collapsible` puts `children` (the table/detail content) behind a closed-by-default
 * disclosure while `title`/`intro` stay always visible — lets a reference page read as
 * a scannable list of what's available, with the detail one click away per section,
 * rather than a long dump of every table at once.
 */
export function Section({
  title,
  intro,
  children,
  collapsible,
}: {
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  collapsible?: boolean;
}) {
  return (
    <section className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-5 dark:border-zinc-800">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">{title}</h2>
        {intro && <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{intro}</p>}
      </div>
      {collapsible ? (
        <details className="group">
          <summary className="flex w-fit cursor-pointer list-none items-center gap-1 text-sm font-medium text-accent marker:content-none">
            Vis tabel
            <span
              aria-hidden="true"
              className="text-zinc-400 transition-transform group-open:rotate-180 dark:text-zinc-500"
            >
              ▾
            </span>
          </summary>
          <div className="mt-3 flex flex-col gap-3">{children}</div>
        </details>
      ) : (
        children
      )}
    </section>
  );
}

/** Repo-relative `rules/foo.pdf` → the copy served statically from `public/kilder/foo.pdf`. */
function documentHref(file: string): string {
  return `/kilder/${file.replace(/^rules\//, '')}`;
}

/**
 * Only `file`s that are an actual downloadable primary document (copied into
 * `public/kilder/`) get linked. A few `DocumentRef`s point their `file` at our
 * own internal `NOTES-*.md` write-up instead — used when the real primary
 * source is a web page with nothing to literally download — and those stay
 * plain text rather than exposing an internal analysis file.
 */
function isDownloadable(file: string): boolean {
  return /\.(pdf|xlsm)$/i.test(file);
}

/**
 * Links the document title to the actual source file (served from
 * `public/kilder/`) whenever the citation names a real downloadable one — a
 * consultant can open or download the primary document a number comes from,
 * not just read its title. Citations without a `file`, or whose `file` is
 * our own internal note rather than a downloadable document, render as plain
 * text, unchanged.
 */
export function Cite({ source, locator }: { source: DocumentRef; locator?: string }) {
  const rest = `${(locator ?? source.locator) ? `, ${locator ?? source.locator}` : ''} (${source.dated})`;
  return (
    <span className="text-xs text-zinc-500 dark:text-zinc-400">
      {source.file && isDownloadable(source.file) ? (
        <a
          href={documentHref(source.file)}
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted underline-offset-2 hover:text-accent"
        >
          {source.title}
        </a>
      ) : (
        source.title
      )}
      {rest}
    </span>
  );
}

export const th = 'px-3 py-2 text-left font-medium text-zinc-500 dark:text-zinc-400';
export const td = 'px-3 py-2 text-zinc-800 dark:text-zinc-200';
export const tableWrap = 'overflow-x-auto';
export const table = 'w-full min-w-max border-collapse text-sm';
export const trBorder = 'border-t border-zinc-100 dark:border-zinc-800/60';
