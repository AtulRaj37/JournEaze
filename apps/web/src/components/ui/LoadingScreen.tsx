"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

function Splash({ onComplete }: { onComplete: () => void }) {
  const [out, setOut] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setOut(true);
      setTimeout(onComplete, 550);
    }, 2500);
    return () => clearTimeout(t);
  }, [onComplete]);

  const R = 88; // orbit radius

  return (
    <AnimatePresence>
      {!out && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45 }}
          style={{
            position: "fixed",
            top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 2147483647,
            background: "radial-gradient(ellipse 110% 75% at 50% 38%, #1d0800 0%, #000 62%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          {/* === Orbit system === */}
          <div style={{ position: "relative", width: 220, height: 220, flexShrink: 0 }}>

            {/* Aura */}
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%,-50%)",
              width: 180, height: 180, borderRadius: "50%",
              background: "radial-gradient(circle, rgba(255,100,0,0.35) 0%, transparent 70%)",
              filter: "blur(22px)",
            }} />

            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: "1.5px solid rgba(255,140,0,0.3)",
                boxShadow: "0 0 16px rgba(255,95,0,0.1) inset",
              }}
            />

            {/* Inner ring */}
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 6.5, repeat: Infinity, ease: "linear" }}
              style={{
                position: "absolute", inset: 28, borderRadius: "50%",
                border: "1px solid rgba(255,170,55,0.4)",
              }}
            />

            {/* Orbiting dots — rotate the whole container */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
              style={{ position: "absolute", inset: 0 }}
            >
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => {
                const rad = (deg * Math.PI) / 180;
                const cx = 110 + R * Math.cos(rad);
                const cy = 110 + R * Math.sin(rad);
                const big = i % 2 === 0;
                const s = big ? 11 : 7;
                return (
                  <div key={i} style={{
                    position: "absolute",
                    width: s, height: s, borderRadius: "50%",
                    left: cx - s / 2, top: cy - s / 2,
                    background: big
                      ? "radial-gradient(circle, #ffe066 15%, #ff5f00 80%)"
                      : "radial-gradient(circle, #ffaa44, #cc4000)",
                    boxShadow: `0 0 ${big ? 12 : 5}px rgba(255,${big ? 130 : 90},0,0.9)`,
                  }} />
                );
              })}
            </motion.div>

            {/* Logo */}
            <motion.div
              initial={{ scale: 0.55, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.75, ease: [0.34, 1.56, 0.64, 1] }}
              style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%,-50%)",
                width: 92, height: 92, borderRadius: 22, overflow: "hidden",
                boxShadow: [
                  "0 0 0 2px rgba(255,140,0,0.45)",
                  "0 0 26px rgba(255,95,0,0.75)",
                  "0 0 65px rgba(255,50,0,0.35)",
                  "0 0 110px rgba(200,25,0,0.15)",
                ].join(","),
              }}
            >
              <Image src="/logo/only-logo.png" alt="JournEaze" fill className="object-contain" priority />
            </motion.div>
          </div>

          {/* === Brand text === */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            style={{ textAlign: "center", marginTop: 24 }}
          >
            <p style={{
              fontSize: 34, fontWeight: 800, margin: 0, color: "#fff",
              letterSpacing: "-0.02em",
              textShadow: "0 0 32px rgba(255,120,0,0.4)",
            }}>
              Journ<span style={{
                color: "#ff7a1a",
                textShadow: "0 0 18px rgba(255,120,0,0.95), 0 0 44px rgba(255,60,0,0.5)",
              }}>Eaze</span>
            </p>
            <p style={{
              fontSize: 12, color: "#555", marginTop: 7,
              letterSpacing: "0.07em", textTransform: "uppercase",
            }}>
              Plan together · Travel smarter
            </p>
          </motion.div>

          {/* === Progress bar === */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            style={{
              marginTop: 28, width: 120, height: 3,
              background: "rgba(255,255,255,0.06)",
              borderRadius: 99, overflow: "hidden",
            }}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.9, duration: 1.85, ease: "easeInOut" }}
              style={{
                height: "100%", borderRadius: 99,
                background: "linear-gradient(90deg,#c43a00,#ff5f00,#ff9b3d,#ffda6b)",
                boxShadow: "0 0 14px rgba(255,120,0,1), 0 0 28px rgba(255,80,0,0.5)",
              }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(<Splash onComplete={onComplete} />, document.body);
}