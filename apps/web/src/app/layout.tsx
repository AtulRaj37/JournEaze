import type { Metadata } from 'next';
import { Outfit, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import QueryProvider from "@/providers/QueryProvider";
import AppShell from "@/components/AppShell";
import SmoothScrollProvider from "@/components/SmoothScrollProvider";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const jbMono = JetBrains_Mono({
  variable: "--font-jbmono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "JournEaze | Travel Smarter",
  description: "Plan together, travel smarter with JournEaze.",
  icons: {
    icon: "/logo/only-logo.png?v=2",
    shortcut: "/logo/only-logo.png?v=2",
    apple: "/logo/only-logo.png?v=2",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${outfit.variable} ${jbMono.variable} font-sans antialiased dark overflow-x-hidden`}
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
