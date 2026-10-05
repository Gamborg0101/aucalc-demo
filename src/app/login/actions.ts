'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { compare, hash } from 'bcryptjs';
import { Prisma } from '@/generated/prisma/client';
import { ACCESS_COOKIE, issueAccessToken, parseAccessToken } from '@/lib/access';
import { DEMO_MODE } from '@/lib/demo';
import { prisma } from '@/lib/prisma';

const ONE_MONTH_SECONDS = 60 * 60 * 24 * 30;

export async function login(formData: FormData): Promise<void> {
  if (DEMO_MODE) redirect('/');
  const username = formData.get('username');
  const password = formData.get('password');
  const rawCallbackUrl = formData.get('callbackUrl');
  // Only ever redirect to a same-origin path from our own form — never
  // follow an externally-supplied absolute URL (open-redirect). A single
  // leading "/" isn't enough: "//evil.example.com" also starts with "/" but
  // browsers treat it as a protocol-relative (i.e. absolute) URL.
  const safeCallbackUrl =
    typeof rawCallbackUrl === 'string' &&
    rawCallbackUrl.startsWith('/') &&
    !rawCallbackUrl.startsWith('//') &&
    !rawCallbackUrl.startsWith('/\\')
      ? rawCallbackUrl
      : null;

  const failQuery = safeCallbackUrl ? `&callbackUrl=${encodeURIComponent(safeCallbackUrl)}` : '';

  if (typeof username !== 'string' || typeof password !== 'string') {
    redirect(`/login?error=1${failQuery}`);
  }

  // Usernames are case-insensitive (stored lowercased at signup) — only the
  // password stays case-sensitive, as it should.
  const user = await prisma.user.findUnique({ where: { username: username.trim().toLowerCase() } });
  if (!user || !(await compare(password, user.passwordHash))) {
    redirect(`/login?error=1${failQuery}`);
  }

  (await cookies()).set(ACCESS_COOKIE, issueAccessToken({ userId: user.id, name: user.name }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ONE_MONTH_SECONDS,
    path: '/',
  });

  redirect(safeCallbackUrl ?? '/beregner');
}

export async function logout(): Promise<void> {
  (await cookies()).delete(ACCESS_COOKIE);
  redirect('/login');
}

export async function signup(formData: FormData): Promise<void> {
  if (DEMO_MODE) redirect('/');
  const username = formData.get('username');
  const name = formData.get('name');
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  if (
    typeof username !== 'string' ||
    typeof name !== 'string' ||
    typeof password !== 'string' ||
    typeof confirmPassword !== 'string' ||
    username.trim().length < 2 ||
    name.trim().length < 2 ||
    password.length < 8
  ) {
    redirect('/signup?error=1');
  }

  if (password !== confirmPassword) {
    redirect('/signup?error=mismatch');
  }

  let user: { id: string; name: string };
  try {
    user = await prisma.user.create({
      data: {
        username: username.trim().toLowerCase(),
        name: name.trim(),
        passwordHash: await hash(password, 12),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      redirect('/signup?error=taken');
    }
    throw err;
  }

  (await cookies()).set(ACCESS_COOKIE, issueAccessToken({ userId: user.id, name: user.name }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: ONE_MONTH_SECONDS,
    path: '/',
  });

  redirect('/beregner');
}

export async function changePassword(formData: FormData): Promise<void> {
  if (DEMO_MODE) redirect('/');
  const session = parseAccessToken((await cookies()).get(ACCESS_COOKIE)?.value);
  if (!session) redirect('/login');

  const currentPassword = formData.get('currentPassword');
  const newPassword = formData.get('newPassword');

  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 8) {
    redirect('/konto?error=1');
  }

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await compare(currentPassword, user.passwordHash))) {
    redirect('/konto?error=wrong');
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hash(newPassword, 12) },
  });

  redirect('/konto?success=1');
}

export async function deleteAccount(formData: FormData): Promise<void> {
  if (DEMO_MODE) redirect('/');
  const session = parseAccessToken((await cookies()).get(ACCESS_COOKIE)?.value);
  if (!session) redirect('/login');

  const password = formData.get('password');
  if (typeof password !== 'string') redirect('/konto?deleteError=1');

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user || !(await compare(password, user.passwordHash))) {
    redirect('/konto?deleteError=wrong');
  }

  await prisma.user.delete({ where: { id: user.id } });

  (await cookies()).delete(ACCESS_COOKIE);
  redirect('/login');
}
