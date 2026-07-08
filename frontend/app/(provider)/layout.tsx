import ProviderLayoutClient from './provider-layout-client';

// Trang nhà cung cấp phụ thuộc vào cookie has_session (đọc trong proxy.ts) +
// accessToken phía client. Nếu Next coi route này là static, Vercel sẽ cache
// shell ở CDN và bỏ qua middleware ở những lần cache HIT, khiến người dùng bị
// đá nhầm về /login dù cookie/token hiện tại vẫn hợp lệ.
export const dynamic = 'force-dynamic';

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  return <ProviderLayoutClient>{children}</ProviderLayoutClient>;
}
