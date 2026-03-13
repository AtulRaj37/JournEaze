"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, Map, Plus, LogOut, Menu, X } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/trips", label: "My Trips", icon: Map },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-4 pt-3">
      <div
        className="mx-auto max-w-7xl rounded-2xl flex items-center justify-between px-5 h-14"
        style={{
          background: "rgba(9, 9, 11, 0.80)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 4px 30px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)",
        }}
      >
        {/* ─── Logo ─── */}
        <Link href="/dashboard" className="flex items-center gap-2 flex-shrink-0">
          <motion.div
            whileHover={{ scale: 1.06, rotate: 4 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            className="relative w-8 h-8 rounded-xl overflow-hidden flex-shrink-0"
            style={{ boxShadow: "0 0 12px rgba(255,95,0,0.25)" }}
          >
            <Image
              src="/logo/only-logo.png"
              alt="JournEaze icon"
              fill
              sizes="32px"
              className="object-contain"
              priority
            />
          </motion.div>

          {/* Brand text — reliable styled HTML instead of image */}
          <span className="text-lg font-bold tracking-tight text-white hidden sm:inline">
            Journ<span style={{ color: "#ff7a1a" }}>Eaze</span>
          </span>
        </Link>

        {/* ─── Desktop nav ─── */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link key={href} href={href}>
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  className={`relative flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                    active ? "text-white" : "text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="absolute inset-0 rounded-xl bg-zinc-800"
                      transition={{ type: "spring", bounce: 0.18, duration: 0.4 }}
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10 flex-shrink-0" />
                  <span className="relative z-10">{label}</span>
                </motion.div>
              </Link>
            );
          })}

          {/* New Trip CTA */}
          <motion.button
            whileHover={{ scale: 1.04, boxShadow: "0 0 22px rgba(255,95,0,0.5)" }}
            whileTap={{ scale: 0.97 }}
            onClick={() => router.push("/dashboard")}
            className="ml-2 flex items-center gap-1.5 px-5 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ background: "linear-gradient(135deg,#ff5f00,#ff9b3d)" }}
          >
            <Plus className="w-3.5 h-3.5" />
            New Trip
          </motion.button>
        </nav>

        {/* ─── Right actions ─── */}
        <div className="flex items-center gap-1">
          <motion.button
            whileHover={{ scale: 1.07, backgroundColor: "rgba(255,255,255,0.06)" }}
            whileTap={{ scale: 0.95 }}
            onClick={handleLogout}
            className="hidden md:flex items-center justify-center w-9 h-9 rounded-xl text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </motion.button>

          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl text-zinc-400 hover:text-white"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ─── Mobile menu ─── */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0 }}
          className="mx-auto max-w-7xl mt-2 rounded-2xl p-3 flex flex-col gap-1 md:hidden"
          style={{
            background: "rgba(9,9,11,0.92)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition-colors"
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-zinc-800/70 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </motion.div>
      )}
    </header>
  );
}
