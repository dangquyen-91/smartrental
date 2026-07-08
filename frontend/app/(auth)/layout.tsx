// /login, /register phụ thuộc vào cookie has_session được proxy.ts đọc mỗi
// request. Nếu Next coi route này là static, Vercel sẽ cache nguyên shell ở
// CDN và phục vụ lại response cũ mà không chạy lại middleware — khiến người
// dùng bị kẹt ở /login dù session/cookie hiện tại đã hợp lệ trở lại.
export const dynamic = 'force-dynamic';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
