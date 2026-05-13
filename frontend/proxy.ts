import { NextRequest, NextResponse } from 'next/server';

const AUTH_ROUTES = ['/login', '/register'];

const PROTECTED_ROUTES = [
  '/trips',
  '/contracts',
  '/services',
  '/roommates',
  '/profile',
  '/hosting',
  '/admin',
  '/provider',
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('has_session');

  // Đã login → không cho vào trang auth
  if (AUTH_ROUTES.some((r) => pathname.startsWith(r)) && hasSession) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Chưa login → redirect về login, kèm ?from= để quay lại sau
  if (PROTECTED_ROUTES.some((r) => pathname.startsWith(r)) && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
};
