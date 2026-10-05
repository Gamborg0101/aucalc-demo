import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ACCESS_COOKIE, parseAccessToken } from '@/lib/access';
import { DEMO_MODE } from '@/lib/demo';

/**
 * Gates the whole site behind a per-person login. `/login`, `/signup`,
 * `/privatliv` and static assets are excluded — gating `/login`/`/signup`
 * would loop the sign-in flow against its own gate, and the privacy notice
 * needs to be readable before signing in. In demo mode nothing is gated.
 */
export function proxy(request: NextRequest) {
  if (DEMO_MODE || parseAccessToken(request.cookies.get(ACCESS_COOKIE)?.value)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = '/login';
  url.searchParams.set('callbackUrl', request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!login|signup|privatliv|_next/static|_next/image|favicon.ico).*)'],
};
