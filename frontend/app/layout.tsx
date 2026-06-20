import type { Metadata } from "next";
import { Be_Vietnam_Pro } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/components/providers";
import "./globals.css";

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["vietnamese"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.smartrental.io.vn"),
  title: "SmartRental - Nền tảng thuê nhà thông minh",
  description: "Tìm phòng trọ, nhà thuê nhanh chóng và an toàn với SmartRental.",
  icons: {
    icon: "/logo/SmartRental_02.png",
  },
  openGraph: {
    title: "SmartRental - Nền tảng thuê nhà thông minh",
    description: "Tìm phòng trọ, nhà thuê nhanh chóng và an toàn với SmartRental.",
    url: "https://www.smartrental.io.vn",
    siteName: "SmartRental",
    images: [{ url: "/background/smartrental-logo.png", width: 1200, height: 630 }],
    locale: "vi_VN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${beVietnamPro.variable} h-full antialiased`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
