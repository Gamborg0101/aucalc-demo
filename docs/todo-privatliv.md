# TODO — privacy / data protection, before wider rollout

Written 2026-09-03 alongside the self-serve signup + `/privatliv` page. These are the points a
non-lawyer shouldn't guess at — flagged rather than answered, per the project's own "never invent
a number" rule (`CLAUDE.md` rule 6), applied here to legal claims instead of domain constants.

## Open

1. **Self-serve signup has no verification.** `/signup` lets anyone with the URL create an
   account — there's no email confirmation (deliberately, to avoid a Resend dependency) and no
   admin approval step. Anyone who finds the link can create an account and use the tool. Worth
   deciding whether that's acceptable for this tool's actual sensitivity, or whether it needs an
   invite-only gate (e.g. only allow signup with an @au.dk email, or go back to admin-created
   accounts via `scripts/create-user.ts`).
2. ~~No formal retention policy.~~ **Resolved 2026-09-04, by decision, not by building anything.**
   For a small internal pilot with known users, the user chose "documented, no auto-delete" over
   building an inactivity-expiry job: accounts persist until the person deletes their own (`/konto`,
   since 2026-09-03) or asks `cg@cc.au.dk` to. `/privatliv` now says this explicitly. Revisit before
   a wider rollout — an unbounded population of accounts nobody prunes is a different risk profile
   than a handful of consultants.
3. ~~No data processing agreement on file~~ **Resolved 2026-09-04, in substance.** Both Vercel and
   Neon auto-incorporate a standard GDPR DPA into their terms of service by default — no separate
   signature needed for a standard account (`vercel.com/legal/dpa`; Neon's DPA is embedded in its
   ToS/MSA). **Residual, genuinely legal question, not resolved by this:** both vendors are
   US-incorporated; even with EU-hosted data (this project uses Neon's `eu-central-1`), the US
   CLOUD Act plus Schrems II/the EU-US Data Privacy Framework raise questions about international
   transfer that a non-lawyer shouldn't resolve. Worth one confirming email to AU's DPO/jurist —
   not blocking for an internal pilot, per the same reasoning as item 4.
4. **`/privatliv` itself needs a legal read.** It's an honest technical description, not a
   lawyer-drafted privacy notice. AU may have a standard template/wording this should follow
   instead.

## Resolved

- **Database region — moved to the EU, 2026-09-03.** The Neon Postgres database originally
  provisioned in AWS `us-east-1` (US) was deleted and replaced with a fresh one in AWS
  `eu-central-1` (Frankfurt), provisioned via `vercel install neon --metadata region=fra1`. The
  one account that existed (`casper`) was recreated with a new password after the swap — nothing
  else was stored, so there was nothing else to migrate. Still not the same thing as a lawyer
  confirming this satisfies AU's actual GDPR obligations, but the specific "hosted in the US"
  fact this item flagged is no longer true.

## Not a concern

- The session cookie is signed (HMAC), not encrypted, and its payload (userId + name) is
  base64-readable by the browser holding it — this is normal for this kind of stateless session
  and doesn't need fixing, just accurate description (done, see `/privatliv`).
- Passwords are hashed with bcrypt (cost 12), never stored or logged in plaintext.
