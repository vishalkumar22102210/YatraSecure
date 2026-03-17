"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  MapPin, Shield, MessageCircle, Wallet, Star, ArrowRight, Users,
  CheckCircle, ChevronDown, Menu, X, Zap, Globe, Lock,
  TrendingUp, Mountain, Waves, Building2, Leaf, Backpack,
  Calendar, UserCheck, Plus, LayoutDashboard, CreditCard, Eye,
  Compass,
} from "lucide-react";

// ─── Static Data ────────────────────────────────────────────────────────────

const tripCategories = [
  {
    type: "Mountains",
    emoji: "🏔️",
    count: "48 trips",
    icon: Mountain,
    img: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=75",
    palette: "mountains",
  },
  {
    type: "Beach & Ocean",
    emoji: "🏖️",
    count: "62 trips",
    icon: Waves,
    img: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=75",
    palette: "beach",
  },
  {
    type: "Forest & Nature",
    emoji: "🌲",
    count: "31 trips",
    icon: Leaf,
    img: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=75",
    palette: "forest",
  },
  {
    type: "Desert",
    emoji: "🏜️",
    count: "19 trips",
    icon: Compass,
    img: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=800&q=75",
    palette: "desert",
  },
  {
    type: "City Tours",
    emoji: "🌆",
    count: "74 trips",
    icon: Building2,
    img: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=75",
    palette: "city",
  },
  {
    type: "Adventure",
    emoji: "🧗",
    count: "55 trips",
    icon: Backpack,
    img: "https://images.unsplash.com/photo-1522163182402-834f871fd851?w=800&q=75",
    palette: "adventure",
  },
];

const features = [
  {
    icon: Shield,
    title: "Verified Travelers Only",
    desc: "Every member undergoes email verification. Trip admins control who joins — full transparancy, zero spam.",
    gradient: "linear-gradient(135deg, #22c55e, #16a34a)",
  },
  {
    icon: MessageCircle,
    title: "Real-time Group Chat",
    desc: "Live messaging with your trip group. Share photos, locations, and plans — no WhatsApp chaos.",
    gradient: "linear-gradient(135deg, #38bdf8, #0284c7)",
  },
  {
    icon: Wallet,
    title: "Shared Group Wallet",
    desc: "Log every expense, auto-split bills equally, and settle up with full transparency.",
    gradient: "linear-gradient(135deg, #a855f7, #7c3aed)",
  },
  {
    icon: MapPin,
    title: "Live Trip Tracking",
    desc: "Real-time location sharing and interactive itinerary map — always know where your group is.",
    gradient: "linear-gradient(135deg, #f59e0b, #d97706)",
  },
  {
    icon: UserCheck,
    title: "AI Matchmaking",
    desc: "Smart personality-based matching. Find co-travelers whose travel style perfectly matches yours.",
    gradient: "linear-gradient(135deg, #ec4899, #be185d)",
  },
  {
    icon: Lock,
    title: "Bank-Grade Security",
    desc: "Your data and payments are protected with enterprise-level encryption and secure authentication.",
    gradient: "linear-gradient(135deg, #ef4444, #b91c1c)",
  },
];

const statsData = [
  { value: 5000,   suffix: "+",   label: "Verified Travelers", icon: Users       },
  { value: 49,     suffix: "★",   label: "Average Rating",     icon: Star        },
  { value: 500,    suffix: "+",   label: "Completed Trips",    icon: CheckCircle },
  { value: 200,    suffix: "Cr+", label: "Expenses Tracked",   icon: TrendingUp  },
];

const publicTrips = [
  { from: "Delhi",     to: "Manali",     dates: "10 Jul – 15 Jul", members: "4/8",   organizer: "Rahul V.", category: "Mountains" },
  { from: "Mumbai",    to: "Goa",        dates: "20 Jul – 24 Jul", members: "6/10",  organizer: "Priya S.", category: "Beach" },
  { from: "Bangalore", to: "Coorg",      dates: "5 Aug – 8 Aug",   members: "3/6",   organizer: "Ankit M.", category: "Forest" },
  { from: "Delhi",     to: "Rishikesh",  dates: "12 Aug – 16 Aug", members: "5/8",   organizer: "Sneha K.", category: "Adventure" },
  { from: "Pune",      to: "Lonavala",   dates: "1 Sep – 3 Sep",   members: "7/10",  organizer: "Vikram R.", category: "City Tours" },
  { from: "Chennai",   to: "Pondicherry",dates: "15 Sep – 18 Sep", members: "2/6",   organizer: "Megha D.", category: "Beach" },
];

const demoScreens = [
  {
    title: "Trip Dashboard",
    icon: LayoutDashboard,
    desc: "View all your trips, upcoming activities, and quick stats at a glance.",
    items: [
      { label: "Active Trips", value: "3" },
      { label: "Upcoming", value: "Manali · Jul 10" },
      { label: "Total Spent", value: "₹12,450" },
      { label: "Group Size", value: "8 members" },
    ],
  },
  {
    title: "Group Chat",
    icon: MessageCircle,
    desc: "Real-time messaging with your trip group. Share photos, locations & plans.",
    items: [
      { label: "Rahul", value: "Let's book Rohtang pass! 🏔️" },
      { label: "Priya", value: "Added hotel to shared wallet" },
      { label: "Ankit", value: "Everyone pack warm clothes ❄️" },
      { label: "You", value: "Sounds great, see you there!" },
    ],
  },
  {
    title: "Shared Wallet",
    icon: CreditCard,
    desc: "Track every expense, auto-split bills, and settle up transparently.",
    items: [
      { label: "Hotel Stay", value: "₹8,000 · Split 4 ways" },
      { label: "Bus Tickets", value: "₹2,400 · Split 4 ways" },
      { label: "Food & Drinks", value: "₹3,200 · Split 4 ways" },
      { label: "Your Balance", value: "₹850 owed" },
    ],
  },
  {
    title: "Trip Members",
    icon: Users,
    desc: "See verified members, their profiles, and manage join requests.",
    items: [
      { label: "Rahul Verma", value: "✅ Verified · Admin" },
      { label: "Priya Sharma", value: "✅ Verified" },
      { label: "Ankit Mehta", value: "✅ Verified" },
      { label: "2 Pending", value: "⏳ Awaiting approval" },
    ],
  },
];

const faqs = [
  { q: "Is YatraSecure free to use?", a: "Yes! Creating an account, joining trips, and using chat are completely free." },
  { q: "How does member verification work?", a: "Users verify their email and complete their profile. Trip admins can approve or reject join requests." },
  { q: "How does the group wallet work?", a: "Members contribute to a shared pool. Expenses are logged and auto-split. Settlement is calculated inside the app." },
  { q: "Can I create a private trip?", a: "Absolutely. Set your trip to private — only people with your approval can join." },
  { q: "What happens if someone leaves the trip?", a: "The admin is notified and wallet shares are recalculated automatically." },
];

const avatarColors = ["#38bdf8", "#a855f7", "#f59e0b", "#22c55e", "#ef4444"];
const avatarInitials = ["RS", "PM", "AK", "VD", "NK"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCategoryPaletteKey(cat: string) {
  const c = cat.toLowerCase();
  if (c.includes("mountain")) return "mountains";
  if (c.includes("beach") || c.includes("ocean")) return "beach";
  if (c.includes("forest") || c.includes("nature")) return "forest";
  if (c.includes("desert")) return "desert";
  if (c.includes("city")) return "city";
  return "adventure";
}

// ─── FAQ Item ─────────────────────────────────────────────────────────────────

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      className="glass-card"
      style={{ padding: "20px 24px", cursor: "pointer", borderColor: open ? "rgba(56,189,248,0.3)" : undefined }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <p style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 14, margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{q}</p>
        <ChevronDown style={{
          width: 16, height: 16, color: "var(--accent)", flexShrink: 0,
          transition: "transform 0.25s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }} />
      </div>
      <div style={{ maxHeight: open ? 200 : 0, overflow: "hidden", transition: "max-height 0.3s ease" }}>
        <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 12, lineHeight: 1.7, marginBottom: 0 }}>{a}</p>
      </div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{
      color: "var(--accent)", fontSize: 11, fontWeight: 800,
      letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12,
    }}>{text}</p>
  );
}

// ─── Counter ──────────────────────────────────────────────────────────────────

function AnimatedStat({ value, suffix, label, icon: Icon }: typeof statsData[0] & { icon: any }) {
  const ref = useRef<HTMLSpanElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !animated.current) {
        animated.current = true;
        const start = performance.now();
        const duration = 1400;
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          const ease = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(value * ease).toLocaleString("en-IN") + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.disconnect();
      }
    }, { threshold: 0.5 });
    io.observe(el);
    return () => io.disconnect();
  }, [value, suffix]);

  return (
    <div className="stat-cell">
      <div style={{
        width: 44, height: 44, borderRadius: 12,
        background: "rgba(56,189,248,0.08)", border: "1px solid rgba(56,189,248,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon style={{ width: 20, height: 20, color: "var(--accent)" }} />
      </div>
      <span
        ref={ref}
        className="gradient-text"
        style={{ fontSize: 26, fontWeight: 900, fontFamily: "'JetBrains Mono', monospace" }}
      >
        0{suffix}
      </span>
      <p style={{ color: "var(--text3)", fontSize: 12, textAlign: "center", margin: 0 }}>{label}</p>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleCategoryHover = (palette: string) => {
    window.setCategoryPalette?.(palette);
  };
  const handleCategoryLeave = () => {
    let stored = "default";
    try { stored = localStorage.getItem("active_palette") || "default"; } catch (e) {}
    window.setCategoryPalette?.(stored);
  };

  return (
    <div style={{ backgroundColor: "var(--bg)", minHeight: "100vh", overflowX: "hidden" }}>

      {/* ══ NAVBAR ═══════════════════════════════════════════════════════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? "rgba(11,17,32,0.93)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border)" : "none",
        transition: "all 0.35s ease",
      }}>
        <nav style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: "var(--cta-gradient)",
              boxShadow: "0 4px 16px rgba(56,189,248,0.35)",
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "box-shadow 0.4s",
            }}>
              <MapPin style={{ width: 19, height: 19, color: "white" }} />
            </div>
            <span style={{ fontSize: 19, fontWeight: 700, color: "white", letterSpacing: "-0.03em", fontFamily: "'Space Grotesk', sans-serif" }}>
              YatraSecure
            </span>
          </Link>

          <div style={{ display: "flex", alignItems: "center", gap: 28 }} className="hidden md:flex">
            {["Features", "How It Works", "Explore", "FAQ"].map((item) => (
              <a key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                style={{ fontSize: 13, color: "var(--text2)", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")}
                onMouseLeave={e => (e.currentTarget.style.color = "var(--text2)")}
              >{item}</a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="hidden md:flex">
            <button onClick={() => router.push("/login")} className="btn-ghost" style={{ padding: "9px 20px", fontSize: 13 }}>Login</button>
            <button onClick={() => router.push("/signup")} className="btn-primary" style={{ padding: "9px 20px", fontSize: 13 }}>
              Get Started <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

          <button onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text2)", display: "flex" }} className="flex md:hidden">
            {menuOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>
        </nav>

        {menuOpen && (
          <div style={{ background: "rgba(11,17,32,0.98)", backdropFilter: "blur(20px)", borderTop: "1px solid var(--border)", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
            {["Features", "How It Works", "Explore", "FAQ"].map(item => (
              <a key={item} href={`#${item.toLowerCase().replace(/ /g, "-")}`} onClick={() => setMenuOpen(false)} style={{ fontSize: 14, color: "var(--text)", fontWeight: 500, textDecoration: "none" }}>{item}</a>
            ))}
            <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
              <button onClick={() => router.push("/login")} className="btn-ghost" style={{ flex: 1, padding: 10, fontSize: 13 }}>Login</button>
              <button onClick={() => router.push("/signup")} className="btn-primary" style={{ flex: 1, padding: 10, fontSize: 13 }}>Sign Up</button>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO — Full bleed image ═══════════════════════════════════════════ */}
      <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden" }}>
        {/* Background image */}
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <img
            src="https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1600&q=80"
            alt="Group hiking"
            style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center" }}
          />
          {/* 60% dark navy overlay */}
          <div style={{ position: "absolute", inset: 0, background: "rgba(11,17,32,0.62)" }} />
          {/* Radial accent glow */}
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse at 20% 60%, rgba(56,189,248,0.12) 0%, transparent 55%)" }} />
        </div>

        <div className="hero-split anim-in" style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "130px 24px 80px", display: "flex", alignItems: "center", gap: 60, width: "100%" }}>
          {/* Left — Text */}
          <div className="hero-text" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "8px 18px",
              borderRadius: 999, background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.35)",
              color: "var(--accent)", fontSize: 12, fontWeight: 700, marginBottom: 28,
            }}>
              <Zap style={{ width: 13, height: 13, fill: "var(--accent)" }} />
              India&apos;s Most Trusted Group Travel Platform
            </div>

            <h1 style={{
              fontSize: "clamp(40px, 5.5vw, 72px)", fontWeight: 700,
              color: "white", lineHeight: 1.08, letterSpacing: "-0.035em",
              marginBottom: 22, fontFamily: "'Space Grotesk', sans-serif",
            }}>
              Travel Together,{" "}
              <span className="gradient-text">Stay Safe</span>
              <br />
              <span style={{ color: "var(--text2)", fontSize: "0.56em", fontWeight: 700 }}>Every Single Trip.</span>
            </h1>

            <p style={{ color: "var(--text2)", fontSize: 17, maxWidth: 480, lineHeight: 1.75, marginBottom: 36 }}>
              Plan group trips with verified travelers. Real-time chat, shared wallet,
              smart expense splitting — everything in one secure place.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 36 }}>
              <button onClick={() => router.push("/signup")} className="btn-primary anim-glow" style={{ padding: "16px 36px", fontSize: 15 }}>
                Start Your Journey <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
              <button onClick={() => router.push("/trips")} className="btn-ghost" style={{ padding: "16px 36px", fontSize: 15 }}>
                <Eye style={{ width: 18, height: 18 }} /> Browse Trips
              </button>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, fontSize: 13, fontWeight: 600 }}>
              {["No credit card required", "Free to join", "Verified community"].map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 7, color: "rgba(255,255,255,0.85)", background: "rgba(255,255,255,0.07)", padding: "6px 14px", borderRadius: 999, border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(8px)" }}>
                  <CheckCircle style={{ width: 14, height: 14, color: "var(--accent)" }} /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Glassmorphism product mockup */}
          <div className="hero-mockup anim-in-delay anim-float" style={{ flex: 1, maxWidth: 500, minWidth: 300 }}>
            <div style={{
              background: "rgba(19,28,46,0.6)", backdropFilter: "blur(20px)",
              border: "1px solid rgba(255,255,255,0.09)", borderRadius: 24, overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 40px rgba(56,189,248,0.07)",
            }}>
              {/* Title bar */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.05)", background: "rgba(11,17,32,0.7)" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ marginLeft: 12, fontSize: 12, color: "var(--text3)", fontWeight: 500 }}>YatraSecure — Trip Dashboard</span>
              </div>
              {/* Mock content */}
              <div style={{ padding: "20px 18px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 16 }}>
                  {[
                    { label: "Active Trips", val: "3", icon: Compass },
                    { label: "Members", val: "24", icon: Users },
                    { label: "Wallet", val: "₹18.5K", icon: Wallet },
                  ].map(({ label, val, icon: I }) => (
                    <div key={label} style={{ background: "rgba(56,189,248,0.07)", border: "1px solid rgba(56,189,248,0.15)", borderRadius: 14, padding: "12px 10px", textAlign: "center" }}>
                      <I style={{ width: 15, height: 15, color: "var(--accent)", marginBottom: 5 }} />
                      <p style={{ fontSize: 17, fontWeight: 900, color: "white", margin: "0 0 2px", fontFamily: "'JetBrains Mono', monospace" }}>{val}</p>
                      <p style={{ fontSize: 10, color: "var(--text3)", margin: 0 }}>{label}</p>
                    </div>
                  ))}
                </div>
                {[
                  { dest: "Delhi → Manali", date: "Jul 10–15", members: "4/8", color: "#38bdf8" },
                  { dest: "Mumbai → Goa", date: "Jul 20–24", members: "6/10", color: "#a855f7" },
                ].map((trip) => (
                  <div key={trip.dest} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "rgba(11,17,32,0.5)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 12, padding: "12px 14px", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 34, height: 34, borderRadius: 10, background: `${trip.color}18`, border: `1px solid ${trip.color}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <MapPin style={{ width: 14, height: 14, color: trip.color }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 12, fontWeight: 700, color: "white", margin: 0 }}>{trip.dest}</p>
                        <p style={{ fontSize: 10, color: "var(--text3)", margin: 0 }}>{trip.date}</p>
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: trip.color, background: `${trip.color}15`, padding: "4px 10px", borderRadius: 8 }}>
                      {trip.members}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF + STATS ═════════════════════════════════════════════ */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }} className="anim-in-delay">
          {/* Avatar row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginBottom: 48, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center" }}>
              {avatarInitials.map((init, i) => (
                <div key={init} style={{
                  width: 36, height: 36, borderRadius: "50%", background: avatarColors[i],
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "white",
                  marginLeft: i > 0 ? -10 : 0, border: "2px solid var(--bg)", zIndex: 5 - i,
                }}>{init}</div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0 }}>
                Trusted by <span className="gradient-text">5,000+</span> explorers
              </p>
              <p style={{ fontSize: 12, color: "var(--text3)", margin: 0 }}>Join our growing community</p>
            </div>
          </div>

          {/* Glassmorphism stats */}
          <div className="stats-grid-4">
            {statsData.map((s) => <AnimatedStat key={s.label} {...s} />)}
          </div>
        </div>
      </section>

      {/* ══ TRIP CATEGORIES — Dynamic hover palette ═══════════════════════════ */}
      <section id="trips" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel text="Explore by Category" />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-0.025em" }}>
              Find Your Kind of <span className="gradient-text-category">Adventure</span>
            </h2>
            <p style={{ color: "var(--text2)", fontSize: 15, marginTop: 12, maxWidth: 480, margin: "12px auto 0" }}>
              Hover over a category to feel its mood — or click to explore trips.
            </p>
          </div>

          <div className="category-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16 }}>
            {tripCategories.map(({ type, emoji, count, icon: Icon, img, palette }) => (
              <div
                key={type}
                className="category-card"
                onClick={() => {
                  window.setCategoryPalette?.(palette, true);
                  router.push("/trips");
                }}
                onMouseEnter={() => handleCategoryHover(palette)}
                onMouseLeave={handleCategoryLeave}
              >
                {/* Background image */}
                <div className="cat-bg" style={{ backgroundImage: `url(${img})` }} />
                {/* Gradient overlay */}
                <div className="cat-overlay" />
                {/* Content */}
                <div className="cat-content">
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}>
                    <Icon style={{ width: 18, height: 18, color: "white" }} />
                  </div>
                  <p style={{ fontWeight: 800, color: "white", fontSize: 14, margin: "0 0 2px", fontFamily: "'Space Grotesk', sans-serif" }}>{type}</p>
                  <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, margin: 0 }}>{count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════════════ */}
      <section id="features" style={{ padding: "100px 24px", background: "linear-gradient(180deg, var(--bg) 0%, #0d1729 50%, var(--bg) 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel text="Why YatraSecure" />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-0.025em" }}>
              Everything for a <span className="gradient-text">Safe Group Trip</span>
            </h2>
            <p style={{ color: "var(--text3)", maxWidth: 500, margin: "16px auto 0", lineHeight: 1.7, fontSize: 15 }}>
              Built for Indian group travelers who want safety, transparency, and zero drama.
            </p>
          </div>

          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {features.map(({ icon: Icon, title, desc, gradient }) => (
              <div key={title} className="glass-card" style={{ padding: 30 }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, marginBottom: 20, background: gradient, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(0,0,0,0.22)" }}>
                  <Icon style={{ width: 24, height: 24, color: "white" }} />
                </div>
                <h3 style={{ fontWeight: 800, color: "white", fontSize: 16, marginBottom: 10, fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                <p style={{ color: "var(--text2)", fontSize: 13, lineHeight: 1.75, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRODUCT DEMO ═════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel text="Product Preview" />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-0.025em" }}>
              See How YatraSecure <span className="gradient-text">Works</span>
            </h2>
          </div>

          <div className="demo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {demoScreens.map(({ title, icon: Icon, desc, items }) => (
              <div key={title} className="demo-card">
                <div className="demo-card-header">
                  <div className="demo-card-dot" style={{ background: "#ef4444" }} />
                  <div className="demo-card-dot" style={{ background: "#fbbf24" }} />
                  <div className="demo-card-dot" style={{ background: "#22c55e" }} />
                  <span style={{ marginLeft: 8, fontSize: 12, color: "var(--text3)", fontWeight: 500 }}>{title}</span>
                </div>
                <div className="demo-card-body">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Icon style={{ width: 20, height: 20, color: "var(--accent)" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0 }}>{title}</p>
                      <p style={{ fontSize: 11, color: "var(--text3)", margin: 0 }}>{desc}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map(({ label, value }) => (
                      <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(11,17,32,0.5)", border: "1px solid rgba(255,255,255,0.03)", borderRadius: 10, padding: "10px 14px" }}>
                        <span style={{ fontSize: 12, color: "var(--text2)", fontWeight: 500 }}>{label}</span>
                        <span style={{ fontSize: 12, color: "var(--text)", fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ EXPLORE PUBLIC TRIPS ══════════════════════════════════════════════ */}
      <section id="explore" style={{ padding: "100px 24px", background: "linear-gradient(180deg, var(--bg) 0%, #0d1729 50%, var(--bg) 100%)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel text="Open for Everyone" />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-0.025em" }}>
              Explore <span className="gradient-text">Public Trips</span>
            </h2>
            <p style={{ color: "var(--text3)", maxWidth: 480, margin: "16px auto 0", lineHeight: 1.7, fontSize: 15 }}>
              Browse trips created by real travelers. Find one that matches your vibe and join instantly.
            </p>
          </div>

          <div className="trips-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {publicTrips.map((trip) => {
              const catKey = getCategoryPaletteKey(trip.category);
              const catColors: Record<string, { accent: string; tint: string }> = {
                mountains: { accent: "#4A6FA5", tint: "rgba(74,111,165,0.12)" },
                beach:     { accent: "#00B4D8", tint: "rgba(0,180,216,0.12)" },
                forest:    { accent: "#52B788", tint: "rgba(82,183,136,0.12)" },
                desert:    { accent: "#E9C46A", tint: "rgba(233,196,106,0.12)" },
                city:      { accent: "#7B2FBE", tint: "rgba(123,47,190,0.12)" },
                adventure: { accent: "#FF6B35", tint: "rgba(255,107,53,0.12)" },
              };
              const cc = catColors[catKey];
              return (
                <div
                  key={`${trip.from}-${trip.to}`}
                  className="trip-card"
                  style={{ background: cc.tint }}
                  onClick={() => router.push("/login")}
                  onMouseEnter={() => handleCategoryHover(catKey)}
                  onMouseLeave={handleCategoryLeave}
                >
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: `${cc.accent}1a`, border: `1px solid ${cc.accent}40`, borderRadius: 8, padding: "5px 10px", marginBottom: 14 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: cc.accent }}>{trip.category}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                    <MapPin style={{ width: 15, height: 15, color: cc.accent, flexShrink: 0 }} />
                    <p style={{ fontSize: 15, fontWeight: 800, color: "white", margin: 0 }}>
                      {trip.from} <span style={{ color: "var(--text3)", fontSize: 12 }}>→</span> {trip.to}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Calendar style={{ width: 12, height: 12, color: "var(--text3)" }} />
                      <span style={{ fontSize: 12, color: "var(--text2)" }}>{trip.dates}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <Users style={{ width: 12, height: 12, color: "var(--text3)" }} />
                      <span style={{ fontSize: 12, color: "var(--text2)" }}>{trip.members} members</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <div style={{ width: 26, height: 26, borderRadius: "50%", background: `linear-gradient(135deg, ${cc.accent}, ${cc.accent}99)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "white" }}>
                        {trip.organizer.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span style={{ fontSize: 12, color: "var(--text2)" }}>{trip.organizer}</span>
                    </div>
                    <ArrowRight style={{ width: 13, height: 13, color: "var(--text3)" }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ textAlign: "center", marginTop: 40 }}>
            <button onClick={() => router.push("/signup")} className="btn-primary" style={{ padding: "14px 36px", fontSize: 14 }}>
              View All Trips <ArrowRight style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      </section>

      {/* ══ CREATE TRIP ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionLabel text="Start Planning" />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-0.025em" }}>
              Create Your <span className="gradient-text">Dream Trip</span>
            </h2>
          </div>
          <div className="glass-card" style={{ padding: "36px 32px" }}>
            <div className="create-trip-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              {[
                { label: "From", placeholder: "Starting city", icon: MapPin },
                { label: "To", placeholder: "Destination", icon: MapPin },
                { label: "Start Date", placeholder: "Pick a date", icon: Calendar },
                { label: "Max Members", placeholder: "e.g. 8", icon: Users },
              ].map(({ label, placeholder, icon: I }) => (
                <div key={label}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "var(--text2)", marginBottom: 6, display: "block" }}>{label}</label>
                  <div style={{ position: "relative" }}>
                    <I style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "var(--text3)", pointerEvents: "none" }} />
                    <input type="text" placeholder={placeholder} readOnly onClick={() => router.push("/signup")} className="input-field" style={{ paddingLeft: 40, cursor: "pointer" }} />
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => router.push("/signup")} className="btn-primary" style={{ width: "100%", padding: "16px", fontSize: 15 }}>
              <Plus style={{ width: 18, height: 18 }} /> Create Trip — Sign Up Free
            </button>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════════ */}
      <section id="how-it-works" style={{ padding: "100px 24px", background: "linear-gradient(180deg, var(--bg) 0%, #0d1729 50%, var(--bg) 100%)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel text="How It Works" />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-0.025em" }}>
              From Sign Up to <span className="gradient-text">Takeoff</span>
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {[
              { step: "01", title: "Create an Account", desc: "Sign up free in under 60 seconds. Verify your email to unlock all features.", icon: UserCheck },
              { step: "02", title: "Discover or Create a Trip", desc: "Browse public trips or create your own with full control over privacy & capacity.", icon: Compass },
              { step: "03", title: "Invite & Chat", desc: "Share your invite code. Real-time group chat keeps everyone coordinated.", icon: MessageCircle },
              { step: "04", title: "Split Expenses", desc: "Log every cost to the shared wallet. YatraSecure auto-calculates who owes what.", icon: Wallet },
            ].map(({ step, title, desc, icon: Icon }, i) => (
              <div key={step} style={{ display: "flex", gap: 24, position: "relative" }}>
                {i < 3 && <div style={{ position: "absolute", left: 20, top: 48, bottom: -1, width: 1, background: "linear-gradient(180deg, var(--accent) 0%, rgba(56,189,248,0.1) 100%)" }} />}
                <div style={{ flex: "0 0 40px" }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: "rgba(56,189,248,0.12)", border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 900, color: "var(--accent)", fontFamily: "'JetBrains Mono', monospace" }}>{step}</div>
                </div>
                <div style={{ paddingBottom: 40 }}>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: "white", margin: "8px 0 8px", fontFamily: "'Space Grotesk', sans-serif" }}>{title}</h3>
                  <p style={{ color: "var(--text2)", fontSize: 14, lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ══════════════════════════════════════════════════════════════ */}
      <section id="faq" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel text="FAQ" />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, color: "white", lineHeight: 1.15, letterSpacing: "-0.025em" }}>
              Got <span className="gradient-text">Questions?</span>
            </h2>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map(faq => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ══ CTA BANNER ═══════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{
            position: "relative", overflow: "hidden", borderRadius: 32, padding: "70px 48px", textAlign: "center",
            background: "linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0.04) 100%)",
            border: "1px solid rgba(56,189,248,0.2)",
          }}>
            <div style={{ position: "absolute", top: -60, right: -60, width: 240, height: 240, background: "radial-gradient(circle, rgba(56,189,248,0.15) 0%, transparent 70%)", filter: "blur(40px)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 700, color: "white", marginBottom: 16, letterSpacing: "-0.03em", fontFamily: "'Space Grotesk', sans-serif" }}>
                Ready to <span className="gradient-text">Travel Safe</span>?
              </h2>
              <p style={{ color: "var(--text2)", fontSize: 16, maxWidth: 480, margin: "0 auto 32px", lineHeight: 1.7 }}>
                Join thousands of verified travelers who plan smarter, spend transparently, and adventure safely.
              </p>
              <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
                <button onClick={() => router.push("/signup")} className="btn-primary anim-glow" style={{ padding: "16px 40px", fontSize: 15 }}>
                  Create Free Account <ArrowRight style={{ width: 18, height: 18 }} />
                </button>
                <button onClick={() => router.push("/trips")} className="btn-ghost" style={{ padding: "16px 32px", fontSize: 15 }}>
                  <Globe style={{ width: 16, height: 16 }} /> Browse Trips
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{ padding: "48px 24px", borderTop: "1px solid var(--border)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="footer-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "var(--cta-gradient)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin style={{ width: 17, height: 17, color: "white" }} />
              </div>
              <span style={{ fontSize: 17, fontWeight: 700, color: "white", fontFamily: "'Space Grotesk', sans-serif" }}>YatraSecure</span>
            </div>
            <p style={{ fontSize: 13, color: "var(--text3)" }}>© 2025 YatraSecure. Safe journeys for everyone.</p>
            <div style={{ display: "flex", gap: 20 }}>
              {["Privacy", "Terms", "Contact"].map(l => (
                <a key={l} href="#" style={{ fontSize: 13, color: "var(--text3)", textDecoration: "none", transition: "color 0.2s" }} onMouseEnter={e => (e.currentTarget.style.color = "var(--accent)")} onMouseLeave={e => (e.currentTarget.style.color = "var(--text3)")}>{l}</a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
