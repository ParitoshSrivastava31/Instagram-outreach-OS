import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getAdminPassword, getExpectedAuthToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const expectedPassword = getAdminPassword();
    if (!password || password !== expectedPassword) {
      return NextResponse.json(
        { success: false, error: 'Incorrect passcode. Please try again.' },
        { status: 401 }
      );
    }

    const token = await getExpectedAuthToken();
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/'
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Authentication failed due to server error' },
      { status: 500 }
    );
  }
}
