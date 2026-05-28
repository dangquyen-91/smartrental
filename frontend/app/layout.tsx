import type { Metadata } from "next";
import { Inter, Nunito } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/components/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
});

const nunito = Nunito({
  variable: "--font-logo",
  subsets: ["latin"],
  weight: ["900"],
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
    <html lang="vi" className={`${inter.variable} ${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
