import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Per-person sessions, but still no server-side session store: the cookie
 * itself carries the signed payload (userId + name), verified by
 * recomputing the HMAC. That keeps `proxy.ts` — which gates every route —
 * free of a database round-trip on every request.
 */
export const ACCESS_COOKIE = 'aucalc_access';

export type Session = { userId: string; name: string };

function secret(): string {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error('AUTH_SECRET skal være sat.');
  return value;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function issueAccessToken(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session), 'utf8').toString('base64url');
  return `${payload}.${sign(payload)}`;
}

export function parseAccessToken(token: string | undefined | null): Session | null {
  if (!token) return null;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (typeof parsed?.userId === 'string' && typeof parsed?.name === 'string') {
      return parsed as Session;
    }
    return null;
  } catch {
    return null;
  }
}
