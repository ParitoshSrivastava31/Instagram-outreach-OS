import { NextResponse, type NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, getExpectedAuthToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Allow static assets, Next internal files, and favicon
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') // matches favicon.ico, images, fonts, etc.
  ) {
    return NextResponse.next();
  }

  // 2. Critical: Allow Meta Instagram Webhook endpoints through without auth
  if (pathname.startsWith('/api/webhooks')) {
    return NextResponse.next();
  }

  // 3. Allow authentication routes
  if (
    pathname === '/login' ||
    pathname === '/api/auth/login' ||
    pathname === '/api/auth/logout'
  ) {
    // If user is already authenticated and visits /login, redirect to dashboard
    if (pathname === '/login') {
      const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
      const expectedToken = await getExpectedAuthToken();
      if (sessionToken && sessionToken === expectedToken) {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }
    return NextResponse.next();
  }

  // 4. Check for valid authentication token
  const sessionToken = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const expectedToken = await getExpectedAuthToken();
  const isAuthenticated = Boolean(sessionToken && sessionToken === expectedToken);

  if (!isAuthenticated) {
    // For API endpoints: return 401 Unauthorized JSON
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized. Master passcode required.' },
        { status: 401 }
      );
    }

    // For web pages: redirect to /login
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('redirect', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
