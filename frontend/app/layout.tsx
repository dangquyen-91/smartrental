import type { Metadata } from "next";
import { Inter, Berkshire_Swash } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const berkshireSwash = Berkshire_Swash({
  variable: "--font-berkshire",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SmartRental",
  description: "Nền tảng thuê nhà thông minh",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className={`${inter.variable} ${berkshireSwash.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
