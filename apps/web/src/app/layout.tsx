import type { Metadata } from 'next';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import AppShell from "@/components/AppShell";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JournEaze | Travel Smarter",
  description: "Plan together, travel smarter with JournEaze.",
  icons: {
    icon: "/logo/only-logo.png",
    shortcut: "/logo/only-logo.png",
    apple: "/logo/only-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased dark`}
        suppressHydrationWarning
      >
        <QueryProvider>
          <SmoothScrollProvider>
            <AppShell>
              {children}
            </AppShell>
          </SmoothScrollProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
