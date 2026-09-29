import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getAdminPassword, getExpectedAuthToken } from '@/lib/auth';
import { getClientIp, checkIpLockout, recordFailedAttempt, clearIpLockout } from '@/lib/rate-limiter';

export async function POST(request: Request) {
  try {
    const clientIp = getClientIp(request);

    // 1. Check if this IP is currently in a 24-hour lockout
    const lockoutStatus = await checkIpLockout(clientIp);
    if (lockoutStatus.isLocked) {
      const hoursStr = lockoutStatus.remainingHours ? `${lockoutStatus.remainingHours}h ` : '';
      const minsStr = `${lockoutStatus.remainingMinutes || 1}m`;
      return NextResponse.json(
        {
          success: false,
          error: `Security Lockout: Too many failed attempts from this IP address. Access blocked for 24 hours (time remaining: ${hoursStr}${minsStr}).`,
          isLocked: true
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { password } = body;

    const expectedPassword = getAdminPassword();

    // 2. Validate passcode
    if (!password || password !== expectedPassword) {
      // Record failure and check if this triggers a 24h lockout
      const failureResult = await recordFailedAttempt(clientIp);

      if (failureResult.isNowLocked) {
        return NextResponse.json(
          {
            success: false,
            error: 'Security Lockout: 3 consecutive failed attempts reached. This IP address has been locked out for 24 hours.',
            isLocked: true
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: `Incorrect passcode. ${failureResult.remainingAttempts} attempt${failureResult.remainingAttempts === 1 ? '' : 's'} remaining before a 24-hour IP lockout.`
        },
        { status: 401 }
      );
    }

    // 3. Successful login: Clear any past failed attempts for this IP
    await clearIpLockout(clientIp);

    // 4. Issue a persistent session cookie valid for 60 days
    // Allows concurrent usage across multiple devices and browsers without expiring
    const token = await getExpectedAuthToken();
    const cookieStore = await cookies();
    cookieStore.set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 24 * 60 * 60, // 60 days persistent session
      path: '/'
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Authentication verification error' },
      { status: 500 }
    );
  }
}
