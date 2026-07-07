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

// Quyết định redirect ở đây phụ thuộc vào cookie riêng của từng người dùng —
// không bao giờ được để CDN/edge cache lại response này, nếu không người dùng
// sau có thể bị phục vụ nhầm redirect (hoặc pass-through) của người trước đó.
function withNoStore(res: NextResponse) {
  res.headers.set('Cache-Control', 'no-store, must-revalidate');
  return res;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = request.cookies.has('has_session');
  const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
  const isProtectedRoute = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));

  // Đã login → không cho vào trang auth
  if (isAuthRoute && hasSession) {
    return withNoStore(NextResponse.redirect(new URL('/', request.url)));
  }

  // Chưa login → redirect về login, kèm ?from= để quay lại sau
  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return withNoStore(NextResponse.redirect(loginUrl));
  }

  // Auth-sensitive routes phải luôn được kiểm tra lại từ đầu ở lượt sau —
  // các trang công khai khác thì giữ hành vi cache mặc định của Next.js.
  return isAuthRoute || isProtectedRoute ? withNoStore(NextResponse.next()) : NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon\\.ico).*)'],
};
