"use client";

import Navbar from "@/components/layout/Navbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <main className="pt-20">
        {children}
      </main>
    </div>
  );
}
