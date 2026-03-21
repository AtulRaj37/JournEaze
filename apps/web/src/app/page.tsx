'use client';
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useInView, useScroll, useTransform, useMotionValueEvent } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { Sparkles, Map, Users, Wallet, Route, BookOpen, Globe, ArrowRight, Star, CheckCircle, Zap, Compass, MessageSquare, ChevronDown, ChevronLeft, ChevronRight, Twitter, Github, Mail } from "lucide-react";

// ── helpers ──
function FU({ c, d = 0, cl = "" }: { c: React.ReactNode; d?: number; cl?: string }) {
  const r = useRef(null); const v = useInView(r, { once: true, margin: "0px" });
  return <motion.div ref={r} initial={{ opacity: 0, y: 30 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.65, delay: d, ease: [0.22, 1, 0.36, 1] }} className={cl}>{c}</motion.div>;
}
function Pill({ children }: { children: React.ReactNode }) {
  return <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase tracking-widest mb-5">{children}</span>;
}
function useCountUp(t: number, v: boolean) {
  const [c, setC] = useState(0);
  useEffect(() => {
    if (!v) return; let s = 0; const step = t / 60;
    const tm = setInterval(() => { s += step; if (s >= t) { setC(t); clearInterval(tm); } else setC(Math.floor(s)); }, 25);
    return () => clearInterval(tm);
  }, [v, t]); return c;
}

// ── data ──
const INDIA = [
  { name: "Goa", tag: "Beach", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80" },
  { name: "Manali", tag: "Mountains", img: "https://plus.unsplash.com/premium_photo-1661878942694-6adaa2ce8175?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8bWFuYWxpfGVufDB8fDB8fHww" },
  { name: "Ladakh", tag: "Adventure", img: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGFkYWtofGVufDB8fDB8fHww" },
  { name: "Jaipur", tag: "Heritage", img: "https://images.unsplash.com/photo-1477587458883-47145ed94245?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8amFpcHVyfGVufDB8fDB8fHww" },
  { name: "Kerala", tag: "Nature", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=600&q=80" },
  { name: "Andaman", tag: "Island", img: "https://images.unsplash.com/photo-1642498232612-a837df233825?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YW5kYW1hbnxlbnwwfHwwfHx8MA%3D%3D" },
  { name: "Rishikesh", tag: "Spiritual", img: "https://images.unsplash.com/photo-1650341259809-9314b0de9268?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8cmlzaGlrZXNofGVufDB8fDB8fHww" },
  { name: "Varanasi", tag: "Cultural", img: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=600&q=80" },
];
const INTL = [
  { name: "Paris", tag: "Romance", img: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80" },
  { name: "Tokyo", tag: "Culture", img: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80" },
  { name: "Dubai", tag: "Luxury", img: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=600&q=80" },
  { name: "Bali", tag: "Tropical", img: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80" },
  { name: "Santorini", tag: "Scenic", img: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=600&q=80" },
  { name: "New York", tag: "City", img: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=600&q=80" },
  { name: "Iceland", tag: "Adventure", img: "https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=600&q=80" },
  { name: "Rome", tag: "History", img: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=600&q=80" },
];
const FEATS = [
  { icon: Sparkles, title: "AI Itinerary Builder", desc: "Full day-by-day itinerary in seconds.", color: "#ff7a1a", items: ["Day 1 — Arrive, explore Old Town", "Day 2 — Sunrise hike", "Day 3 — Street food tour", "Day 4 — Museum & culture"] },
  { icon: Route, title: "Smart Route Planning", desc: "Optimised multi-city routes on a live map.", color: "#a78bfa", items: ["Delhi → 3h", "Jaipur → 5h", "Udaipur → 7h", "Mumbai → 12h"] },
  { icon: Users, title: "Collaborative Trips", desc: "Plan together in real-time with your crew.", color: "#34d399", items: ["Priya added 4 stops", "Arjun voted on hotel", "Sneha updated budget", "You joined the trip"] },
  { icon: Wallet, title: "Expense Tracking", desc: "Split bills and track every spend.", color: "#60a5fa", items: ["Hotels  ₹24,000", "Food    ₹8,500", "Travel  ₹12,000", "Activities ₹6,200"] },
  { icon: BookOpen, title: "Travel Notes", desc: "Log memories and tips inside your trip.", color: "#f472b6", items: ["📍 Best biryani spot", "🏨 Check-in at 3pm", "🎒 Don't forget SPF", "💡 Book tickets early"] },
  { icon: Globe, title: "Destination Insights", desc: "AI briefs on culture, weather & transport.", color: "#fbbf24", items: ["Best time: Oct–Mar", "Currency: JPY ¥", "Language: Japanese", "Transport: JR Pass"] },
];
const STORIES = [
  { title: "Dawn on the Ghats of Varanasi", place: "Varanasi, India", desc: "Priests chant as the Ganga wakes. Smoke, marigolds, bells — a living ritual that has never stopped.", img: "https://images.unsplash.com/photo-1561361058-c24cecae35ca?w=1400&q=85" },
  { title: "Silence of the Spiti Valley", place: "Himachal Pradesh, India", desc: "A road to nowhere. Snow at 4,500m. Monasteries carved into rock. The world at its most raw.", img: "https://images.unsplash.com/photo-1607144113358-9d8dd893a647?q=80&w=1063&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  { title: "Drifting the Kerala Backwaters", place: "Kerala, India", desc: "A rice-boat glides through still green water. Coconut palms lean in. Time moves differently here.", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=1400&q=85" },
  { title: "Camel Dunes of Rajasthan", place: "Jaisalmer, India", desc: "The Thar Desert at sunset turns gold then violet. A campfire, tabla beats, and a sky full of stars.", img: "https://images.unsplash.com/photo-1730647730752-c314d811ebaa?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
];
const TRIPS = [
  { title: "Ladakh Bike Expedition", days: 14, sub: "Manali · Leh · Nubra · Pangong", img: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=700&q=80" },
  { title: "Rajasthan Desert Safari", days: 10, sub: "Jaipur · Jodhpur · Jaisalmer", img: "https://images.unsplash.com/photo-1509114397022-ed747cca3f65?w=700&q=80" },
  { title: "Kerala Backwaters", days: 7, sub: "Kochi · Alleppey · Munnar", img: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=700&q=80" },
  { title: "Goa Beach Getaway", days: 5, sub: "North Goa · South Goa · Panjim", img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=700&q=80" },
  { title: "Spiti Valley Circuit", days: 12, sub: "Shimla · Kaza · Chandratal", img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=700&q=80" },
];
const QUOTES = [
  { text: "Planning our Europe trip took 10 minutes.", name: "Priya M.", x: "6%", y: "10%" },
  { text: "Finally a travel app that gets group trips.", name: "Arjun S.", x: "58%", y: "5%" },
  { text: "The AI was better than my travel agent.", name: "Sneha R.", x: "72%", y: "55%" },
  { text: "Expense splits saved our friendship 😂", name: "Vikram T.", x: "4%", y: "65%" },
  { text: "Like Notion + Google Maps for travel.", name: "Rhea P.", x: "32%", y: "78%" },
];


// ── Premium Full-Width Sticky Nav ──
function SNav() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 60));
  return (
    <motion.header
      animate={{
        backgroundColor: scrolled ? "rgba(5,5,5,0.92)" : "rgba(0,0,0,0)",
        borderBottomColor: scrolled ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0)",
        backdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
      }}
      transition={{ duration: 0.3 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 1000,
        borderBottomWidth: 1, borderBottomStyle: "solid",
        WebkitBackdropFilter: scrolled ? "blur(24px)" : "blur(0px)",
      }}>
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-xl overflow-hidden relative">
            <Image src="/logo/only-logo.png" alt="JournEaze" fill className="object-contain" unoptimized />
          </div>
          <span className="font-bold text-white text-lg tracking-tight">
            Journ<span style={{ color: "#ff7a1a" }}>Eaze</span>
          </span>
        </div>
        {/* Center links */}
        <nav className="hidden md:flex items-center gap-8">
          {[["Features", "#features"], ["Destinations", "#destinations"], ["How it Works", "#how-it-works"]].map(([l, h]) => (
            <a key={l} href={h}
              className="text-sm text-zinc-400 hover:text-white transition-colors font-medium">
              {l}
            </a>
          ))}
        </nav>
        {/* Right CTAs */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <span className="text-sm text-zinc-400 hover:text-white transition-colors px-3 py-2 hidden sm:block cursor-pointer">
              Sign In
            </span>
          </Link>
          <Link href="/register">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 0 22px rgba(255,95,0,0.5)" }}
              whileTap={{ scale: 0.96 }}
              className="text-sm font-bold px-5 py-2 rounded-full text-white flex items-center gap-1.5"
              style={{ background: "linear-gradient(135deg,#ff5f00,#ff9b3d)" }}>
              Get Started <ArrowRight className="w-3.5 h-3.5" />
            </motion.button>
          </Link>
        </div>
      </div>
    </motion.header>
  );
}


// ── Hero parallax bg ──
// ── Hero parallax bg (2-layer depth) ──
function HeroBg() {
  // Track page scroll progress (no target = window scroll)
  const { scrollY } = useScroll();
  // Background moves faster than page scroll — creates depth
  const bgY = useTransform(scrollY, [0, 700], ["0%", "35%"]);
  // Overlay gradient also shifts slightly
  const overlayY = useTransform(scrollY, [0, 700], ["0%", "8%"]);
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden" }}>
      {/* Background image — moves the most (slowest parallax) */}
      <motion.div style={{ y: bgY, position: "absolute", inset: "-15% 0%" }}>
        <Image src="https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1600&q=85"
          alt="Hero" fill className="object-cover" priority unoptimized />
      </motion.div>
      {/* Dark overlay — moves slightly slower than bg */}
      <motion.div style={{ y: overlayY, position: "absolute", inset: 0, zIndex: 1 }}
        className="bg-gradient-to-b from-black/70 via-black/40 to-zinc-950" />
    </div>
  );
}

// ── Parallax image for story cards ──
function ParallaxImg({ src, alt, groupHover = false }: { src: string; alt: string; groupHover?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  // Image moves between -15% and +15% relative to its card
  const y = useTransform(scrollYProgress, [0, 1], ["-15%", "15%"]);
  return (
    <div ref={ref} style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <motion.div style={{ y, position: "absolute", inset: "-20% 0" }}>
        <Image src={src} alt={alt} fill
          className={`object-cover${groupHover ? " transition-transform duration-700 group-hover:scale-105" : ""}`}
          unoptimized />
      </motion.div>
    </div>
  );
}

// ── Word reveal ──
function WordReveal({ text, className = "" }: { text: string; className?: string }) {
  const r = useRef(null); const v = useInView(r, { once: true });
  const words = text.split(" ");
  return (
    <span ref={r} className={className} style={{ display: "inline" }}>
      {words.map((w, i) => (
        <motion.span key={i} style={{ display: "inline-block", marginRight: "0.25em" }}
          initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
          animate={v ? { opacity: 1, y: 0, filter: "blur(0px)" } : {}}
          transition={{ duration: 0.55, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}>
          {w}
        </motion.span>
      ))}
    </span>
  );
}

// ── AI Chat Demo ──
function ChatDemo() {
  const r = useRef(null); const v = useInView(r, { once: true, margin: "-80px" });
  const [ph, setPh] = useState(0);
  const it = ["Day 1 — Arrive Tokyo, Shinjuku", "Day 2 — Shibuya, Harajuku", "Day 3 — Day trip to Nikko", "Day 4 — Kyoto, Fushimi Inari", "Day 5 — Arashiyama bamboo", "Day 6 — Osaka Dotonbori", "Day 7 — TeamLab, farewell"];
  useEffect(() => {
    if (!v) return;
    const ts = [setTimeout(() => setPh(1), 500), setTimeout(() => setPh(2), 1800), setTimeout(() => setPh(3), 2800)];
    return () => ts.forEach(clearTimeout);
  }, [v]);
  return (
    <div ref={r} className="rounded-2xl border border-zinc-700/40 bg-zinc-900/90 overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-zinc-800/80">
        <div className="flex gap-1.5">{["#ef4444", "#eab308", "#22c55e"].map(c => <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />)}</div>
        <span className="text-xs text-zinc-500 ml-2 flex items-center gap-1"><Sparkles className="w-3 h-3 text-orange-400" />JournEaze AI</span>
      </div>
      <div className="p-5 space-y-4 min-h-[340px]">
        <AnimatePresence>
          {ph >= 1 && <motion.div key="u" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex justify-end">
            <div className="max-w-[80%] px-4 py-2.5 rounded-2xl rounded-br-sm text-sm text-white" style={{ background: "linear-gradient(135deg,#ff5f00,#ff9b3d)" }}>Plan a 7-day trip to Japan for 2, budget ₹1.5L</div>
          </motion.div>}
          {ph === 2 && <motion.div key="t" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex gap-2 items-center">
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0"><Sparkles className="w-3.5 h-3.5 text-orange-400" /></div>
            <div className="flex gap-1">{[0, 1, 2].map(i => <motion.div key={i} animate={{ y: [0, -4, 0] }} transition={{ duration: 0.7, repeat: Infinity, delay: i * 0.15 }} className="w-2 h-2 rounded-full bg-zinc-600" />)}</div>
          </motion.div>}
          {ph >= 3 && <motion.div key="a" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3">
            <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 mt-1"><Sparkles className="w-3.5 h-3.5 text-orange-400" /></div>
            <div className="bg-zinc-800/70 border border-zinc-700/40 rounded-2xl rounded-bl-sm p-4 text-sm max-w-[85%]">
              <p className="font-semibold text-white mb-3">Your Japan itinerary 🇯🇵</p>
              <div className="space-y-2">{it.map((line, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
                  className="flex gap-2 items-start text-xs text-zinc-400">
                  <span className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(255,122,26,0.15)", color: "#ff7a1a" }}>{i + 1}</span>
                  {line}
                </motion.div>
              ))}</div>
            </div>
          </motion.div>}
        </AnimatePresence>
      </div>
      <div className="px-4 py-3 border-t border-zinc-800/60 flex gap-3">
        <div className="flex-1 h-9 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center px-3 text-xs text-zinc-600">Ask AI to plan your next trip…</div>
        <button className="w-9 h-9 rounded-xl flex items-center justify-center text-white flex-shrink-0" style={{ background: "linear-gradient(135deg,#ff5f00,#ff9b3d)" }}><ArrowRight className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

// ── Map ──
function MapSVG() {
  const cities = [{ name: "Delhi", x: 130, y: 65 }, { name: "Jaipur", x: 100, y: 125 }, { name: "Udaipur", x: 90, y: 190 }, { name: "Mumbai", x: 80, y: 265 }];
  const r = useRef(null); const v = useInView(r, { once: true });
  return (
    <div ref={r} className="rounded-2xl border border-zinc-700/40 bg-zinc-900/80 p-5 shadow-xl">
      <div className="text-xs text-zinc-500 mb-3 flex items-center gap-2"><Route className="w-3.5 h-3.5 text-orange-400" />Delhi → Jaipur → Udaipur → Mumbai</div>
      <svg viewBox="0 0 220 310" className="w-full max-w-xs mx-auto">
        {cities.slice(0, -1).map((c, i) => (
          <motion.line key={i} x1={c.x} y1={c.y} x2={cities[i + 1].x} y2={cities[i + 1].y}
            stroke="#ff7a1a" strokeWidth="2.5" strokeDasharray="8 4" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }} animate={v ? { pathLength: 1, opacity: 1 } : {}} transition={{ duration: 0.9, delay: i * 0.5 }} />
        ))}
        {cities.map((c, i) => (
          <motion.g key={c.name} initial={{ scale: 0, opacity: 0 }} animate={v ? { scale: 1, opacity: 1 } : {}} transition={{ delay: i * 0.5 + 0.2, type: "spring" }}>
            <circle cx={c.x} cy={c.y} r="10" fill="#ff7a1a" opacity="0.2" />
            <circle cx={c.x} cy={c.y} r="5" fill="#ff7a1a" />
            <text x={c.x + 13} y={c.y + 4} fontSize="11" fill="#a1a1aa">{c.name}</text>
          </motion.g>
        ))}
      </svg>
    </div>
  );
}

// ── Stat ──
function Stat({ val, label, suf = "" }: { val: number; label: string; suf?: string }) {
  const r = useRef(null); const v = useInView(r, { once: true }); const c = useCountUp(val, v);
  return (
    <motion.div ref={r} initial={{ opacity: 0, y: 24 }} animate={v ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }} className="text-center">
      <p className="text-5xl md:text-6xl font-extrabold bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#ff7a1a,#ffb86c)" }}>{c.toLocaleString()}{suf}</p>
      <p className="text-zinc-500 text-sm mt-2">{label}</p>
    </motion.div>
  );
}

// ─────────────────────────────────────────────
export default function LandingPage() {
  const [tab, setTab] = useState<"in" | "intl">("in");
  const [af, setAf] = useState(0);
  const cRef = useRef<HTMLDivElement>(null);
  const dests = tab === "in" ? INDIA : INTL;
  const feat = FEATS[af];

  // Floating blobs
  const blobs = [
    { x: "8%", y: "18%", c: "rgba(255,95,0,0.07)", s: 650, d: 20 },
    { x: "82%", y: "55%", c: "rgba(167,139,250,0.05)", s: 500, d: 24 },
    { x: "48%", y: "82%", c: "rgba(255,122,26,0.05)", s: 720, d: 28 },
  ];

  return (
    <main className="bg-zinc-950 text-white overflow-x-hidden relative aurora-bg noise">
      {/* Blobs */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {blobs.map((b, i) => (
          <motion.div key={i} animate={{ x: [0, 30, -15, 0], y: [0, -20, 25, 0] }} transition={{ duration: b.d, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute", left: b.x, top: b.y, width: b.s, height: b.s, borderRadius: "50%",
              background: `radial-gradient(circle, ${b.c} 0%, transparent 70%)`, filter: "blur(70px)", transform: "translate(-50%,-50%)"
            }} />
        ))}
      </div>

      <SNav />

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden">
        <HeroBg />

        <div className="relative z-10 max-w-5xl mx-auto pt-20">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-xs font-semibold uppercase tracking-widest mb-8">
              <Sparkles className="w-3.5 h-3.5" />AI-Powered Travel Planning
            </span>
          </motion.div>
          <h1 className="text-6xl md:text-8xl font-extrabold tracking-tight leading-[1.03] mb-6">
            <WordReveal text="Plan Smarter." /><br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#ff7a1a 30%,#ffb86c)" }}>
              <WordReveal text="Travel Better." />
            </span>
          </h1>
          <motion.p initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.6 }}
            className="text-lg md:text-xl text-zinc-300 max-w-2xl mx-auto leading-relaxed mb-10">
            AI itinerary building, live collaborative maps and smart expense tracking — in one workspace your whole crew loves.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register">
              <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(255,95,0,0.5)" }} whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-9 py-4 rounded-full font-bold text-white text-base" style={{ background: "linear-gradient(135deg,#ff5f00,#ff9b3d)" }}>
                Start Planning Free <ArrowRight className="w-4 h-4" />
              </motion.button>
            </Link>
            <a href="#how-it-works">
              <motion.button whileHover={{ scale: 1.03 }} className="flex items-center gap-2 px-8 py-4 rounded-full font-medium text-zinc-200 border border-zinc-600/60 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all">
                How it works <ChevronDown className="w-4 h-4" />
              </motion.button>
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1 }} className="flex items-center justify-center gap-3 text-sm text-zinc-400 mt-8">
            <div className="flex -space-x-2">
              {["#ff7a1a", "#a78bfa", "#34d399", "#60a5fa", "#f472b6"].map((c, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-zinc-950 flex items-center justify-center text-xs font-bold" style={{ background: c }}>
                  {["P", "A", "S", "R", "V"][i]}
                </div>
              ))}
            </div>
            <span>Trusted by <strong className="text-white">10,000+</strong> travellers</span>
          </motion.div>
        </div>
        <motion.div animate={{ y: [0, 10, 0] }} transition={{ duration: 2, repeat: Infinity }} className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-zinc-600 z-10">
          <div className="w-px h-10 bg-gradient-to-b from-transparent to-zinc-600" /><ChevronDown className="w-4 h-4" />
        </motion.div>
      </section>



      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-16 px-6 relative z-10">
        <div className="max-w-2xl mx-auto">
          <FU cl="text-center mb-12" c={<>
            <Pill><Zap className="w-3.5 h-3.5" />Simple Process</Pill>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">How JournEaze Works</h2>
            <p className="text-zinc-400 mt-4">From idea to itinerary in under a minute.</p>
          </>} />
          {/* Vertical timeline */}
          <div className="relative">
            {/* Connecting line */}
            <div className="absolute left-7 top-7 bottom-7 w-px" style={{ background: "linear-gradient(180deg,#ff7a1a40,#ff7a1a20,transparent)" }} />
            {[
              { n: "01", icon: Compass, title: "Create a Trip", desc: "Name it, set dates, pick your destination. Takes 30 seconds." },
              { n: "02", icon: Sparkles, title: "AI Builds Your Plan", desc: "Get a full day-by-day itinerary, cultural guide, and packing list instantly." },
              { n: "03", icon: Map, title: "See it on Map", desc: "Every hotel, restaurant and attraction pinned on a live collaborative map." },
              { n: "04", icon: Users, title: "Collaborate & Go", desc: "Invite friends, vote on options, track expenses — all in one place." },
            ].map((s, i) => (
              <FU key={s.n} d={i * 0.12} c={
                <motion.div whileHover={{ x: 6 }} className="flex gap-5 mb-8 last:mb-0">
                  {/* Icon dot */}
                  <div className="flex-shrink-0 relative z-10">
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }} whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }} transition={{ delay: i * 0.12 + 0.2, type: "spring", stiffness: 260 }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center"
                      style={{ background: "rgba(255,122,26,0.12)", border: "1px solid rgba(255,122,26,0.3)", boxShadow: "0 0 20px rgba(255,95,0,0.1)" }}>
                      <s.icon className="w-6 h-6 text-orange-400" />
                    </motion.div>
                  </div>
                  {/* Content */}
                  <div className="pt-3 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black text-orange-500/50 font-mono">{s.n}</span>
                      <h3 className="font-bold text-white">{s.title}</h3>
                    </div>
                    <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              } />
            ))}
          </div>
        </div>
      </section>

      {/* ── DESTINATIONS ── */}
      <section id="destinations" className="py-20 px-6 relative z-10">
        <div className="max-w-7xl mx-auto">
          <FU cl="text-center mb-10" c={<>
            <Pill><Globe className="w-3.5 h-3.5" />Destinations</Pill>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Where Will You Go Next?</h2>
          </>} />
          {/* Tabs */}
          <FU d={0.1} cl="flex justify-center mb-10" c={
            <div className="inline-flex p-1 rounded-full bg-zinc-900 border border-zinc-800">
              {(["in", "intl"] as const).map(t => (
                <motion.button key={t} onClick={() => setTab(t)}
                  className="px-7 py-2.5 rounded-full text-sm font-semibold relative"
                  style={{ color: tab === t ? "#fff" : "#71717a" }}>
                  {tab === t && <motion.div layoutId="tab-pill" className="absolute inset-0 rounded-full" style={{ background: "linear-gradient(135deg,#ff5f00,#ff9b3d)" }} />}
                  <span className="relative z-10">{t === "in" ? "🇮🇳  India" : "🌍  International"}</span>
                </motion.button>
              ))}
            </div>
          } />
          <AnimatePresence mode="wait">
            <motion.div key={tab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {dests.map((d, i) => (
                <motion.div key={d.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05, duration: 0.45 }}>
                  <Link href="/register">
                    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}
                      className="relative rounded-2xl overflow-hidden cursor-pointer group" style={{ aspectRatio: "2/3" }}>
                      <Image src={d.img} alt={d.name} fill className="object-cover transition-transform duration-700 group-hover:scale-110" unoptimized />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                      <div className="absolute top-3 left-3">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-sm text-zinc-300 border border-white/10 font-medium">{d.tag}</span>
                      </div>
                      <div className="absolute bottom-4 left-4 right-4">
                        <p className="font-bold text-white text-base">{d.name}</p>
                        <div className="h-px w-0 group-hover:w-full bg-orange-400 transition-all duration-500 mt-1.5 rounded-full" />
                      </div>
                    </motion.div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── INTERACTIVE FEATURES ── */}
      <section id="features" className="py-28 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <FU cl="text-center mb-14" c={<>
            <Pill><Sparkles className="w-3.5 h-3.5" />Features</Pill>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Everything in One Place</h2>
          </>} />
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <FU c={
              <AnimatePresence mode="wait">
                <motion.div key={af} initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 1.03, y: -5 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-zinc-700/40 overflow-hidden bg-zinc-900/80 p-6 min-h-[300px] flex flex-col shadow-2xl">
                  <div className="flex items-center gap-2 mb-5">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: feat.color + "20", border: `1px solid ${feat.color}40` }}>
                      <feat.icon className="w-4 h-4" style={{ color: feat.color }} />
                    </div>
                    <span className="text-sm font-semibold text-white">{feat.title}</span>
                  </div>
                  <div className="space-y-3 flex-1">
                    {feat.items.map((item, i) => (
                      <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                        className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/30">
                        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: feat.color }} />
                        <span className="text-sm text-zinc-300 font-mono">{item}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>
            } />
            <FU d={0.1} c={
              <div className="space-y-2">
                {FEATS.map((f, i) => (
                  <motion.div key={f.title} onClick={() => setAf(i)} onHoverStart={() => setAf(i)} whileHover={{ x: 5 }}
                    className="flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-200"
                    style={af === i ? { background: `radial-gradient(ellipse at left, ${f.color}08, transparent 70%)`, border: `1px solid ${f.color}35` } : { border: "1px solid transparent" }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: f.color + "15", border: `1px solid ${f.color}20` }}>
                      <f.icon className="w-4 h-4" style={{ color: f.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white text-sm mb-0.5">{f.title}</h3>
                      <p className="text-zinc-500 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                    {af === i && <div className="w-1.5 h-1.5 rounded-full self-center flex-shrink-0" style={{ background: f.color }} />}
                  </motion.div>
                ))}
              </div>
            } />
          </div>
        </div>
      </section>

      {/* ── AI DEMO ── */}
      <section className="py-24 px-6 relative z-10 bg-zinc-900/20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <FU c={<>
            <Pill><MessageSquare className="w-3.5 h-3.5" />AI Planner</Pill>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">Just Describe<br /><span className="text-zinc-500">Your Dream Trip.</span></h2>
            <p className="text-zinc-400 leading-relaxed mb-6">Our AI instantly generates a tailored day-by-day itinerary, cultural brief, and packing list for any destination on Earth.</p>
            <div className="space-y-3">{["Full day-by-day itinerary", "Local food & culture guide", "Weather & travel tips", "AI packing list"].map(t => (
              <div key={t} className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-400" />{t}</div>
            ))}</div>
          </>} />
          <FU d={0.15} c={<ChatDemo />} />
        </div>
      </section>

      {/* ── MAP ── */}
      <section className="py-24 px-6 relative z-10">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <FU d={0.1} cl="order-2 lg:order-1" c={<MapSVG />} />
          <FU cl="order-1 lg:order-2" c={<>
            <Pill><Map className="w-3.5 h-3.5" />Live Map</Pill>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-6">Every Stop,<br /><span className="text-zinc-500">On the Map.</span></h2>
            <p className="text-zinc-400 leading-relaxed mb-6">See your entire route on a live map. Add hotels, attractions, restaurants. Your group edits together in real-time.</p>
            <div className="space-y-3">{["Multi-city route visualisation", "Collaborative pin dropping", "Hotel & attraction markers", "Offline access on the trip"].map(t => (
              <div key={t} className="flex items-center gap-3 text-sm text-zinc-300"><CheckCircle className="w-4 h-4 flex-shrink-0 text-orange-400" />{t}</div>
            ))}</div>
          </>} />
        </div>
      </section>

      {/* ── TRAVEL STORIES ── */}
      <section className="relative z-10">
        <div className="max-w-7xl mx-auto px-6 pt-16 pb-4">
          <FU cl="text-center mb-12" c={<>
            <Pill>✈️ Travel Stories</Pill>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Chapter by Chapter</h2>
          </>} />
        </div>
        <div className="space-y-4 px-6 pb-24">
          {STORIES.map((s, i) => (
            <FU key={s.title} d={i * 0.08} c={
              <motion.div
                whileHover={{ scale: 1.01 }}
                className="relative rounded-3xl overflow-hidden cursor-pointer group"
                style={{ height: 380 + (i * 40) }}>
                {/* Parallax background image */}
                <ParallaxImg src={s.img} alt={s.title} groupHover />
                {/* Gradient overlay — also shifts slightly for depth */}
                <div className="absolute inset-0 z-10"
                  style={{ background: "linear-gradient(to right, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)" }} />
                {/* Content — moves at a slower rate for depth */}
                <div className="absolute inset-0 z-20 flex flex-col justify-center px-10 md:px-16">
                  <motion.div
                    initial={{ x: -20, opacity: 0 }} whileInView={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.6 }} viewport={{ once: true }}>
                    <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-2">{s.place}</p>
                    <h3 className="text-3xl md:text-5xl font-extrabold text-white mb-4 max-w-xl leading-tight">{s.title}</h3>
                    <p className="text-zinc-300 text-base max-w-sm leading-relaxed hidden md:block">{s.desc}</p>
                  </motion.div>
                </div>
              </motion.div>
            } />
          ))}
        </div>
      </section>

      {/* ── COMMUNITY TRIPS CAROUSEL ── */}
      <section className="py-20 relative z-10 bg-zinc-900/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between px-6 mb-8">
            <FU c={<>
              <Pill><Users className="w-3.5 h-3.5" />Community</Pill>
              <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight">Real Trips, Real People</h2>
            </>} />
            <div className="flex gap-2 pb-2">
              <button onClick={() => cRef.current?.scrollBy({ left: -320, behavior: "smooth" })} className="w-9 h-9 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={() => cRef.current?.scrollBy({ left: 320, behavior: "smooth" })} className="w-9 h-9 rounded-full border border-zinc-700 flex items-center justify-center text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors"><ChevronRight className="w-4 h-4" /></button>
            </div>
          </div>
          <div ref={cRef} className="flex gap-5 overflow-x-auto pb-4 px-6 snap-x snap-mandatory" style={{ scrollbarWidth: "none" }}>
            {TRIPS.map((t, i) => (
              <motion.div key={t.title} initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }} viewport={{ once: true }}
                whileHover={{ scale: 1.03, y: -5 }} className="flex-shrink-0 w-72 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900 snap-start cursor-pointer">
                <div className="relative h-52">
                  <Image src={t.img} alt={t.title} fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent" />
                  <div className="absolute top-3 right-3 text-xs px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white border border-white/10">{t.days}d</div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white mb-1">{t.title}</h3>
                  <p className="text-zinc-500 text-xs">{t.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FLOATING TESTIMONIALS ── */}
      <section className="py-24 px-6 relative z-10 overflow-hidden">
        <div className="max-w-4xl mx-auto">
          <FU cl="text-center mb-16" c={<>
            <Pill><Star className="w-3.5 h-3.5" />Reviews</Pill>
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">Travellers Who<br />
              <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#ff7a1a,#ffb86c)" }}>Love JournEaze</span>
            </h2>
          </>} />
          <div className="relative h-[400px]">
            {QUOTES.map((q, i) => (
              /* Outer: entrance only (spring — 2 keyframes) */
              <motion.div key={q.name} style={{ position: "absolute", left: q.x, top: q.y, maxWidth: 200 }}
                initial={{ opacity: 0, scale: 0.6 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.12, type: "spring", stiffness: 160 }}
                whileHover={{ scale: 1.07, zIndex: 10 }}>
                {/* Inner: float loop only (tween — supports 3 keyframes) */}
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3 + i * 0.4, repeat: Infinity, ease: "easeInOut", type: "tween" }}
                  className="p-4 rounded-2xl bg-zinc-900/95 border border-zinc-700/60 backdrop-blur-sm shadow-xl cursor-default">
                  <div className="flex gap-0.5 mb-2">{[...Array(5)].map((_, j) => <Star key={j} className="w-3 h-3 fill-orange-400 text-orange-400" />)}</div>
                  <p className="text-zinc-300 text-xs leading-relaxed mb-2">"{q.text}"</p>
                  <p className="text-zinc-600 text-xs font-medium">— {q.name}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 px-6 border-y border-zinc-800/60 relative z-10" style={{ background: "linear-gradient(180deg,rgba(255,95,0,0.04) 0%,transparent 100%)" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-10">
          <Stat val={10000} label="Trips Planned" suf="+" />
          <Stat val={120} label="Countries Explored" suf="+" />
          <Stat val={5000} label="Active Explorers" suf="+" />
          <Stat val={98} label="% Would Recommend" suf="%" />
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-36 px-6 relative overflow-hidden z-10">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_50%_50%,rgba(255,95,0,0.13),transparent)]" />
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        <FU cl="relative z-10 max-w-3xl mx-auto text-center" c={<>
          <motion.div animate={{ scale: [1, 1.06, 1] }} transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="w-20 h-20 rounded-3xl overflow-hidden relative mx-auto mb-8" style={{ boxShadow: "0 0 70px rgba(255,95,0,0.45)" }}>
            <Image src="/logo/only-logo.png" alt="JournEaze" fill className="object-contain" unoptimized />
          </motion.div>
          <h2 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
            Start Your Next<br />
            <span className="bg-clip-text text-transparent" style={{ backgroundImage: "linear-gradient(135deg,#ff7a1a,#ffb86c)" }}>Journey Today</span>
          </h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">Free forever for personal use. Your first trip takes under a minute.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(255,95,0,0.55)" }} whileTap={{ scale: 0.97 }}
                className="px-10 py-4 rounded-full font-bold text-white text-base" style={{ background: "linear-gradient(135deg,#ff5f00,#ff9b3d)" }}>
                Create Your First Trip →
              </motion.button>
            </Link>
            <Link href="/login">
              <motion.button whileHover={{ scale: 1.04 }} className="px-10 py-4 rounded-full font-medium text-zinc-300 border border-zinc-700 hover:border-zinc-500 hover:text-white transition-colors bg-zinc-900/60">
                I already have an account
              </motion.button>
            </Link>
          </div>
        </>} />
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-zinc-800/60 py-14 px-6 relative z-10">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-xl overflow-hidden relative"><Image src="/logo/only-logo.png" alt="" fill className="object-contain" unoptimized /></div>
                <span className="font-bold text-white">Journ<span style={{ color: "#ff7a1a" }}>Eaze</span></span>
              </div>
              <p className="text-zinc-500 text-sm leading-relaxed mb-4">The collaborative travel planner for modern explorers.</p>
              <div className="flex items-center gap-3">{[Twitter, Github, Mail].map((Icon, i) => (
                <div key={i} className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center text-zinc-500 hover:text-white transition-colors cursor-pointer"><Icon className="w-3.5 h-3.5" /></div>
              ))}</div>
            </div>
            {[
              { title: "Product", links: ["Features", "AI Planner", "Map View", "Expense Tracker"] },
              { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
              { title: "Support", links: ["Help Centre", "GitHub", "Status", "Privacy"] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-white text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">{col.links.map(l => <li key={l}><a href="#" className="text-zinc-500 text-sm hover:text-zinc-300 transition-colors">{l}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="border-t border-zinc-800/60 pt-8 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-zinc-600 text-xs">© 2026 JournEaze · Plan together, travel smarter.</p>
            <p className="text-zinc-600 text-xs">Built with ❤️ by <span className="text-zinc-400 font-semibold">Atul Raj</span></p>
          </div>
        </div>
      </footer>
    </main>
  );
}
