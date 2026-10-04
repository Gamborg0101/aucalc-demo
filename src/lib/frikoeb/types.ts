/**
 * Core types for the frikøb calculation engine.
 *
 * This module — and everything under `src/lib/frikoeb/` — is pure: no React, no
 * Next, no I/O. Enforced by an ESLint rule scoped to this directory.
 */

/** `YYYY-MM-DD`. */
export type ISODate = string;

export type InstituteId = 'IKS' | 'IKK' | 'DPU';

/** Citation back to the governing document. Every config constant carries one. */
export interface DocumentRef {
  title: string;
  org: InstituteId | 'AU_ARTS';
  dated: ISODate;
  /** Repo-relative path into `rules/`. */
  file?: string;
  /** Section, page or table within the document. */
  locator?: string;
}

export type FundingMechanism =
  /** Fondsbevilling. Cost-price based. */
  | 'tilskudsfinansieret'
  /** Indtægtsdækket virksomhed — a company pays AU. Market floor, VAT. */
  | 'rekvireret_idv'
  /** Genuine collaboration. Negotiated rates; institute may co-finance. */
  | 'samfinansieret';

export type FrikoebVariant =
  /** Full cost price compensated; researcher commits all work time. */
  | 'fuldt'
  /** Only the teaching obligation bought; institute compensated 60% of salary. */
  | 'undervisning';

/**
 * What a krone buys under undervisningsfrikøb.
 *
 * **Resolved 2026-08-31, confirmed by a research consultant** with a worked AUFF
 * example: a funder that buys out only the teaching obligation pays only for the
 * teaching share of the month, not the full salary — the institute self-funds the
 * remaining research share, so the same beløb stretches further than a normal
 * (fuldt) frikøb would. That is `salary_scaled`, not `full_month_equivalent`. IKK's
 * frikøbspolitik never actually addresses this specific case (it only resolves
 * *fuldt* frikøb's "lowered frikøbsprocent at full cost" model) — the ambiguity
 * this type used to carry was between two readings of a silence, and the
 * consultant's example breaks the tie.
 *
 * `full_month_equivalent` is kept selectable — some other funder or institut
 * arrangement may genuinely insist on paying full price for a teaching-only
 * release — but it is no longer the shipped default.
 *
 * The two differ by 1/andel (≈1,67× for a 60%-share category), so this is never
 * inferred silently.
 *
 * See `rules/NOTES-frikoebspolitik.md` and `docs/open-questions.md`.
 */
export type UndervisningsBasis =
  /** `months = beløb / (kostpris × andel)`. Confirmed default: pay only for the teaching share. */
  | 'salary_scaled'
  /** `months = beløb / kostpris`. Buy full salary months; only the teaching part is released. */
  | 'full_month_equivalent';

/**
 * The documented default, confirmed with a research consultant 2026-08-31.
 *
 * Callers must still pass `undervisningsBasis` explicitly — this constant exists so
 * the UI can preselect a cited default rather than the engine guessing one.
 */
export const DEFAULT_UNDERVISNINGS_BASIS: UndervisningsBasis = 'salary_scaled';
