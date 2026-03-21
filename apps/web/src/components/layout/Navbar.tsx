"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { LayoutDashboard, Map, Plus, LogOut, Menu, X, User as UserIcon, Settings } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuGroup } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/trips", label: "My Trips", icon: Map },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [user, setUser] = useState<{name: string, email: string, username?: string, image?: string} | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // First try localStorage for instant load
    try {
      const stored = localStorage.getItem("user");
      if (stored) setUser(JSON.parse(stored));
    } catch {}

    // Then fetch fresh data from API
    const token = localStorage.getItem("token");
    if (token) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
      fetch(`${apiUrl}/users/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setUser({ name: data.name, email: data.email, username: data.username, image: data.image });
            // Keep localStorage in sync
            localStorage.setItem("user", JSON.stringify({ name: data.name, email: data.email, username: data.username, image: data.image }));
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-[100] w-full border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl flex items-center justify-between px-6 h-16">
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

          {/* Brand text */}
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
          {pathname !== "/dashboard" && (
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
          )}
        </nav>

        {/* ─── Right actions ─── */}
        <div className="flex items-center gap-1">
          {mounted && (
            <DropdownMenu>
              <DropdownMenuTrigger className="hidden md:flex items-center justify-center rounded-xl p-1 hover:bg-white/5 transition-colors outline-none cursor-pointer">
                <Avatar className="w-8 h-8 rounded-lg border border-white/10 bg-zinc-900 shadow-sm">
                  <AvatarImage src={user?.image} />
                  <AvatarFallback className="bg-zinc-800 text-xs text-white rounded-lg font-medium">{user?.name?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-zinc-950 border border-white/10 text-white rounded-xl shadow-2xl p-2 z-[100] mt-2">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="font-normal p-2">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none text-white">{user?.name || "Explorer"}</p>
                      <p className="text-xs leading-none text-zinc-400">{user?.email || ""}</p>
                    </div>
                  </DropdownMenuLabel>
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/10 my-1" />
                <DropdownMenuItem onClick={() => router.push("/dashboard/profile")} className="p-2 gap-2 rounded-lg cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white text-zinc-300">
                  <UserIcon className="w-4 h-4 text-zinc-400" /> <span className="flex-1">Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/dashboard/settings")} className="p-2 gap-2 rounded-lg cursor-pointer hover:bg-zinc-800 focus:bg-zinc-800 focus:text-white text-zinc-300">
                  <Settings className="w-4 h-4 text-zinc-400" /> <span className="flex-1">Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-white/10 my-1" />
                <DropdownMenuItem onClick={handleLogout} className="p-2 gap-2 rounded-lg cursor-pointer hover:bg-red-500/20 focus:bg-red-500/20 focus:text-red-400 text-red-500 transition-colors">
                  <LogOut className="w-4 h-4" /> <span className="flex-1">Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

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
          {/* User info at top of mobile menu */}
          {user && (
            <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 mb-1">
              <Avatar className="w-10 h-10 rounded-lg border border-white/10">
                <AvatarImage src={user.image} />
                <AvatarFallback className="bg-zinc-800 text-white text-sm rounded-lg font-medium">
                  {user.name?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{user.name || "Explorer"}</p>
                <p className="text-xs text-zinc-400 truncate">{user.email}</p>
              </div>
            </div>
          )}

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
          <Link
            href="/dashboard/profile"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition-colors"
          >
            <UserIcon className="w-4 h-4" />
            Profile
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setMobileOpen(false)}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-zinc-300 hover:text-white hover:bg-zinc-800/70 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
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
