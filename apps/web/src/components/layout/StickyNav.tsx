"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { useState } from "react";

export default function StickyNav() {
  const { scrollY } = useScroll();
  const [visible, setVisible] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    setVisible(y > 80);
  });

  return (
    <motion.nav
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: visible ? 0 : -80, opacity: visible ? 1 : 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        position: "fixed", top: 16, left: "50%",
        transform: "translateX(-50%)",
        zIndex: 1000,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        background: "rgba(10,10,10,0.75)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 999,
        padding: "10px 20px",
        display: "flex", alignItems: "center", gap: 32,
        minWidth: 560,
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg overflow-hidden relative">
          <Image src="/logo/only-logo.png" alt="" fill className="object-contain" unoptimized />
        </div>
        <span className="font-bold text-white text-sm">
          Journ<span style={{ color: "#ff7a1a" }}>Eaze</span>
        </span>
      </div>

      {/* Links */}
      <div className="flex items-center gap-6 flex-1 justify-center">
        {[
          { label: "Features",     href: "#features" },
          { label: "Destinations", href: "#destinations" },
          { label: "How it Works", href: "#how-it-works" },
        ].map(({ label, href }) => (
          <a key={label} href={href}
            className="text-xs text-zinc-400 hover:text-white transition-colors font-medium whitespace-nowrap">
            {label}
          </a>
        ))}
      </div>

      {/* CTAs */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <Link href="/login">
          <span className="text-xs text-zinc-400 hover:text-white transition-colors px-3 py-1.5 cursor-pointer">Sign In</span>
        </Link>
        <Link href="/register">
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,95,0,0.4)" }}
            whileTap={{ scale: 0.96 }}
            className="text-xs font-semibold px-4 py-2 rounded-full text-white"
            style={{ background: "linear-gradient(135deg,#ff5f00,#ff9b3d)" }}>
            Get Started
          </motion.button>
        </Link>
      </div>
    </motion.nav>
  );
}
