import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const AUTH_COOKIE = 'mineral_auth';
// Simple shared secret — set AUTH_PASSWORD in .env.local
const EXPECTED_PASSWORD = process.env.AUTH_PASSWORD || 'mineral';

export async function POST(request) {
  try {
    const body = await request.json();
    const { password } = body || {};

    if (!password || password !== EXPECTED_PASSWORD) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE, '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
