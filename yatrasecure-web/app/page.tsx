"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  MapPin, Shield, MessageCircle, Wallet, Star, ArrowRight, Users,
  CheckCircle, ChevronDown, Menu, X, Zap, Globe, Lock,
  TrendingUp, Heart, Bell, Mountain, Waves, Building2,
  Leaf, Backpack, Car, Calendar, UserCheck, Plus,
  LayoutDashboard, CreditCard, Eye, Compass
} from "lucide-react";

// ─── DATA ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: Shield,
    title: "Verified Travelers",
    desc: "Every traveler goes through ID verification before joining any trip. Zero strangers, 100% trust.",
    gradient: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)",
  },
  {
    icon: MessageCircle,
    title: "Real-time Group Chat",
    desc: "Instant messaging powered by WebSockets. Stay connected with your trip group at all times.",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)",
  },
  {
    icon: Wallet,
    title: "Shared Group Wallet",
    desc: "Pool funds, split expenses automatically, and track every rupee with full transparency.",
    gradient: "linear-gradient(135deg, #f97316 0%, #dc2626 100%)",
  },
  {
    icon: Bell,
    title: "Smart Notifications",
    desc: "Get instant alerts for join requests, expense updates, trip reminders and more.",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
  },
  {
    icon: Lock,
    title: "Secure by Design",
    desc: "JWT auth, bcrypt encryption, rate limiting — your data is protected at every layer.",
    gradient: "linear-gradient(135deg, #f97316 0%, #b91c1c 100%)",
  },
  {
    icon: Globe,
    title: "Easy Trip Planning",
    desc: "Weekend getaways to month-long adventures. Create public or private trips with custom budgets.",
    gradient: "linear-gradient(135deg, #fbbf24 0%, #65a30d 100%)",
  },
];

const steps = [
  {
    step: "01",
    title: "Create Your Profile",
    desc: "Sign up and get verified in minutes. Add your travel style, bio and preferences.",
    icon: UserCheck,
  },
  {
    step: "02",
    title: "Create or Join a Trip",
    desc: "Browse public trips or create your own. Set destination, dates, budget and group size.",
    icon: Compass,
  },
  {
    step: "03",
    title: "Coordinate with Group Chat",
    desc: "Use the real-time group chat to plan activities, share updates and stay connected.",
    icon: MessageCircle,
  },
  {
    step: "04",
    title: "Split Expenses Easily",
    desc: "Log expenses, auto-split among members, and settle up — all inside the app.",
    icon: CreditCard,
  },
];

const tripCategories = [
  { icon: Mountain,  type: "Adventure",   count: "120+ trips", emoji: "🏔️", gradient: "linear-gradient(135deg, #1a3a2a, #0f2a1f)" },
  { icon: Waves,     type: "Beach",       count: "85+ trips",  emoji: "🏖️", gradient: "linear-gradient(135deg, #1a2a3a, #0f1f2a)" },
  { icon: Building2, type: "City Tour",   count: "200+ trips", emoji: "🏙️", gradient: "linear-gradient(135deg, #2a1a3a, #1f0f2a)" },
  { icon: Leaf,      type: "Wellness",    count: "60+ trips",  emoji: "🧘", gradient: "linear-gradient(135deg, #1a3a35, #0f2a25)" },
  { icon: Backpack,  type: "Backpacking", count: "150+ trips", emoji: "🎒", gradient: "linear-gradient(135deg, #3a2a1a, #2a1f0f)" },
  { icon: Car,       type: "Road Trip",   count: "95+ trips",  emoji: "🚗", gradient: "linear-gradient(135deg, #3a1a1a, #2a0f0f)" },
];

const testimonials = [
  {
    name: "Priya Sharma",
    city: "Mumbai",
    avatar: "PS",
    tripType: "Ladakh Adventure",
    rating: 5,
    text: "Planned a Ladakh trip with 8 strangers. The wallet feature saved us from so many awkward money conversations. Highly recommend!",
  },
  {
    name: "Rahul Verma",
    city: "Delhi",
    avatar: "RV",
    tripType: "Goa Beach Trip",
    rating: 5,
    text: "The real-time chat kept our Goa group perfectly coordinated. No more WhatsApp chaos. YatraSecure is just better.",
  },
  {
    name: "Ananya Singh",
    city: "Bangalore",
    avatar: "AS",
    tripType: "Rishikesh Wellness",
    rating: 5,
    text: "I love that everyone is verified. Felt completely safe travelling with people I met on the platform. 10/10 experience.",
  },
];

const stats = [
  { value: "5,000+", label: "Verified Travelers", icon: Users       },
  { value: "4.9★",   label: "Average Rating",     icon: Star        },
  { value: "500+",   label: "Safe Trips",          icon: CheckCircle },
  { value: "₹2Cr+",  label: "Expenses Managed",   icon: TrendingUp  },
];

const publicTrips = [
  { from: "Delhi", to: "Manali", dates: "10 Jul – 15 Jul", members: "4/8", organizer: "Rahul V.", category: "Adventure", categoryIcon: Mountain },
  { from: "Mumbai", to: "Goa", dates: "20 Jul – 24 Jul", members: "6/10", organizer: "Priya S.", category: "Beach", categoryIcon: Waves },
  { from: "Bangalore", to: "Coorg", dates: "5 Aug – 8 Aug", members: "3/6", organizer: "Ankit M.", category: "Wellness", categoryIcon: Leaf },
  { from: "Delhi", to: "Rishikesh", dates: "12 Aug – 16 Aug", members: "5/8", organizer: "Sneha K.", category: "Adventure", categoryIcon: Mountain },
  { from: "Pune", to: "Lonavala", dates: "1 Sep – 3 Sep", members: "7/10", organizer: "Vikram R.", category: "Road Trip", categoryIcon: Car },
  { from: "Chennai", to: "Pondicherry", dates: "15 Sep – 18 Sep", members: "2/6", organizer: "Megha D.", category: "City Tour", categoryIcon: Building2 },
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
      { label: "Rahul", value: "Let's book the Rohtang pass tickets! 🏔️" },
      { label: "Priya", value: "I've added the hotel to shared wallet" },
      { label: "Ankit", value: "Everyone pack warm clothes ❄️" },
      { label: "You", value: "Sounds great, see you all there!" },
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
  { q: "How does member verification work?", a: "Users verify their email and complete a profile. Trip admins can approve or reject join requests." },
  { q: "How does the group wallet work?", a: "Members contribute to a shared pool. Expenses are logged and auto-split. Settlement is calculated inside the app." },
  { q: "Can I create a private trip?", a: "Absolutely. Set your trip to private — only people with your approval can join." },
  { q: "What happens if someone leaves the trip?", a: "The admin is notified. Wallet shares are recalculated automatically." },
];

const avatarColors = ["#f97316", "#fbbf24", "#ef4444", "#22c55e", "#3b82f6"];
const avatarInitials = ["RS", "PM", "AK", "VD", "NK"];

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return (
    <p style={{
      color: "#f97316", fontSize: 11, fontWeight: 700,
      letterSpacing: "0.14em", textTransform: "uppercase", marginBottom: 12,
    }}>
      {text}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{
      fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900,
      color: "white", lineHeight: 1.15, letterSpacing: "-0.025em",
    }}>
      {children}
    </h2>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(!open)}
      className="glass-card"
      style={{
        padding: "20px 22px",
        cursor: "pointer",
        borderColor: open ? "rgba(249,115,22,0.35)" : undefined,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
        <p style={{ fontWeight: 600, color: "#f1f5f9", fontSize: 14, margin: 0 }}>{q}</p>
        <ChevronDown style={{
          width: 16, height: 16, color: "#f97316", flexShrink: 0,
          transition: "transform 0.25s",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
        }} />
      </div>
      <div style={{
        maxHeight: open ? 200 : 0,
        overflow: "hidden",
        transition: "max-height 0.3s ease",
      }}>
        <p style={{ color: "#94a3b8", fontSize: 13, marginTop: 12, lineHeight: 1.7, marginBottom: 0 }}>
          {a}
        </p>
      </div>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <div style={{ backgroundColor: "#0f172a", minHeight: "100vh", overflowX: "hidden", fontFamily: "Inter, sans-serif" }}>

      {/* ══ NAVBAR ═══════════════════════════════════════════════════════════════ */}
      <header style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        background: scrolled ? "rgba(15,23,42,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(24px)" : "none",
        borderBottom: scrolled ? "1px solid rgba(45,63,94,0.4)" : "none",
        transition: "all 0.35s ease",
      }}>
        <nav style={{
          maxWidth: 1200, margin: "0 auto", padding: "14px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 11,
              background: "linear-gradient(135deg,#f97316,#fbbf24)",
              boxShadow: "0 4px 16px rgba(249,115,22,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MapPin style={{ width: 19, height: 19, color: "white" }} />
            </div>
            <span style={{ fontSize: 18, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
              YatraSecure
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 28 }} className="hidden md:flex">
            {["Features", "How It Works", "Explore", "FAQ"].map((item) => (
              <a key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500, textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f97316")}
                onMouseLeave={e => (e.currentTarget.style.color = "#94a3b8")}
              >
                {item}
              </a>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }} className="hidden md:flex">
            <button onClick={() => router.push("/login")} className="btn-ghost" style={{ padding: "9px 20px", fontSize: 13 }}>
              Login
            </button>
            <button onClick={() => router.push("/signup")} className="btn-primary" style={{ padding: "9px 20px", fontSize: 13 }}>
              Get Started <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", display: "flex" }}
            className="flex md:hidden"
          >
            {menuOpen ? <X style={{ width: 24, height: 24 }} /> : <Menu style={{ width: 24, height: 24 }} />}
          </button>
        </nav>

        {menuOpen && (
          <div style={{
            background: "rgba(15,23,42,0.98)", backdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(45,63,94,0.4)", padding: "20px 24px",
            display: "flex", flexDirection: "column", gap: 18,
          }}>
            {["Features", "How It Works", "Explore", "FAQ"].map((item) => (
              <a key={item}
                href={`#${item.toLowerCase().replace(/ /g, "-")}`}
                onClick={() => setMenuOpen(false)}
                style={{ fontSize: 14, color: "#cbd5e1", fontWeight: 500, textDecoration: "none" }}
              >
                {item}
              </a>
            ))}
            <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
              <button onClick={() => router.push("/login")}  className="btn-ghost"   style={{ flex: 1, padding: 10, fontSize: 13 }}>Login</button>
              <button onClick={() => router.push("/signup")} className="btn-primary" style={{ flex: 1, padding: 10, fontSize: 13 }}>Sign Up</button>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO — Split Layout ══════════════════════════════════════════════════ */}
      <section style={{
        paddingTop: 130, paddingBottom: 60, paddingLeft: 24, paddingRight: 24,
        background: `
          radial-gradient(ellipse at 15% 50%, rgba(249,115,22,0.12) 0%, transparent 55%),
          radial-gradient(ellipse at 85% 20%, rgba(251,191,36,0.08) 0%, transparent 45%),
          radial-gradient(ellipse at 50% 90%, rgba(249,115,22,0.05) 0%, transparent 50%),
          #0f172a
        `,
      }}>
        <div
          className="hero-split anim-in"
          style={{
            maxWidth: 1200, margin: "0 auto",
            display: "flex", alignItems: "center", gap: 60,
          }}
        >
          {/* Left — Text */}
          <div className="hero-text" style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 18px", borderRadius: 999,
              background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)",
              color: "#f97316", fontSize: 12, fontWeight: 600, marginBottom: 28,
            }}>
              <Zap style={{ width: 13, height: 13, fill: "#f97316" }} />
              India&#39;s Most Trusted Group Travel Platform
            </div>

            <h1 style={{
              fontSize: "clamp(36px, 5.5vw, 64px)", fontWeight: 900,
              color: "white", lineHeight: 1.08, letterSpacing: "-0.035em",
              marginBottom: 22,
            }}>
              Travel Together,{" "}
              <span className="gradient-text">Stay Safe</span>
              <br />
              <span style={{ color: "#64748b", fontSize: "0.58em", fontWeight: 700 }}>
                Every Single Trip.
              </span>
            </h1>

            <p style={{ color: "#94a3b8", fontSize: 17, maxWidth: 480, lineHeight: 1.75, marginBottom: 36 }}>
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

            <div style={{ display: "flex", flexWrap: "wrap", gap: 20, color: "#475569", fontSize: 12 }}>
              {["No credit card required", "Free to join", "Verified community"].map((t) => (
                <span key={t} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle style={{ width: 13, height: 13, color: "#f97316" }} /> {t}
                </span>
              ))}
            </div>
          </div>

          {/* Right — Product Dashboard Mockup */}
          <div className="hero-mockup anim-in-delay anim-float" style={{ flex: 1, maxWidth: 520, minWidth: 320 }}>
            <div style={{
              background: "rgba(26,39,68,0.5)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.06)",
              borderRadius: 24,
              overflow: "hidden",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 40px rgba(249,115,22,0.06)",
            }}>
              {/* Title bar */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "14px 20px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
                background: "rgba(15,23,42,0.6)",
              }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ef4444" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#fbbf24" }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#22c55e" }} />
                <span style={{ marginLeft: 12, fontSize: 12, color: "#64748b", fontWeight: 500 }}>
                  YatraSecure — Trip Dashboard
                </span>
              </div>

              {/* Mock content */}
              <div style={{ padding: "24px 22px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginBottom: 20 }}>
                  {[
                    { label: "Active Trips", val: "3", icon: Compass },
                    { label: "Members", val: "24", icon: Users },
                    { label: "Wallet", val: "₹18.5K", icon: Wallet },
                  ].map(({ label, val, icon: I }) => (
                    <div key={label} style={{
                      background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.12)",
                      borderRadius: 14, padding: "14px 12px", textAlign: "center",
                    }}>
                      <I style={{ width: 16, height: 16, color: "#f97316", marginBottom: 6 }} />
                      <p style={{ fontSize: 18, fontWeight: 800, color: "white", margin: "0 0 2px" }}>{val}</p>
                      <p style={{ fontSize: 10, color: "#64748b", margin: 0 }}>{label}</p>
                    </div>
                  ))}
                </div>

                {[
                  { dest: "Delhi → Manali", date: "Jul 10–15", members: "4/8", color: "#f97316" },
                  { dest: "Mumbai → Goa", date: "Jul 20–24", members: "6/10", color: "#fbbf24" },
                ].map((trip) => (
                  <div key={trip.dest} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.04)",
                    borderRadius: 12, padding: "14px 16px", marginBottom: 10,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10,
                        background: `${trip.color}15`, border: `1px solid ${trip.color}30`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <MapPin style={{ width: 16, height: 16, color: trip.color }} />
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: 0 }}>{trip.dest}</p>
                        <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{trip.date}</p>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: trip.color,
                      background: `${trip.color}12`, padding: "4px 10px", borderRadius: 8,
                    }}>
                      {trip.members}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ SOCIAL PROOF ═════════════════════════════════════════════════════════ */}
      <section style={{ padding: "0 24px 80px" }}>
        <div style={{ maxWidth: 1000, margin: "0 auto" }} className="anim-in-delay-2">
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "center",
            gap: 16, marginBottom: 40, flexWrap: "wrap",
          }}>
            <div className="avatar-stack" style={{ display: "flex", alignItems: "center" }}>
              {avatarInitials.map((init, i) => (
                <div key={init} style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: avatarColors[i], display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: 700, color: "white",
                  marginLeft: i > 0 ? -10 : 0,
                  border: "2px solid #0f172a", zIndex: 5 - i,
                }}>
                  {init}
                </div>
              ))}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: "white", margin: 0 }}>
                Trusted by <span className="gradient-text">5,000+</span> travelers
              </p>
              <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>Join our growing community</p>
            </div>
          </div>

          <div className="stats-grid-4" style={{
            display: "grid", gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1, borderRadius: 20, overflow: "hidden",
            background: "rgba(45,63,94,0.3)",
          }}>
            {stats.map(({ value, label, icon: Icon }) => (
              <div key={label} style={{
                background: "rgba(26,39,68,0.6)",
                backdropFilter: "blur(10px)",
                padding: "28px 20px",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon style={{ width: 20, height: 20, color: "#f97316" }} />
                </div>
                <p className="gradient-text" style={{ fontSize: 24, fontWeight: 900, margin: 0 }}>{value}</p>
                <p style={{ color: "#64748b", fontSize: 12, textAlign: "center", margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ TRIP CATEGORIES ══════════════════════════════════════════════════════ */}
      <section style={{ padding: "80px 24px" }} id="trips">
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <SectionLabel text="Explore by Category" />
            <SectionTitle>Find Your Kind of <span className="gradient-text">Trip</span></SectionTitle>
          </div>
          <div className="category-grid" style={{
            display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 16,
          }}>
            {tripCategories.map(({ icon: Icon, type, count, emoji, gradient }) => (
              <div key={type} className="category-card" onClick={() => router.push("/trips")}>
                <div className="cat-bg" style={{ background: gradient }} />
                <div style={{
                  position: "absolute", top: "50%", left: "50%",
                  transform: "translate(-50%, -60%)", fontSize: 56, opacity: 0.3,
                  filter: "blur(1px)", pointerEvents: "none",
                }}>
                  {emoji}
                </div>
                <div className="cat-overlay" />
                <div className="cat-content">
                  <div style={{
                    width: 38, height: 38, borderRadius: 10,
                    background: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10,
                  }}>
                    <Icon style={{ width: 18, height: 18, color: "#f97316" }} />
                  </div>
                  <p style={{ fontWeight: 700, color: "white", fontSize: 14, margin: "0 0 2px" }}>{type}</p>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: 0 }}>{count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ═════════════════════════════════════════════════════════════ */}
      <section id="features" style={{
        padding: "100px 24px",
        background: "linear-gradient(180deg, #0f172a 0%, #111d35 50%, #0f172a 100%)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel text="Why YatraSecure" />
            <SectionTitle>Everything for a{" "}<span className="gradient-text">Safe Group Trip</span></SectionTitle>
            <p style={{ color: "#64748b", maxWidth: 500, margin: "16px auto 0", lineHeight: 1.7, fontSize: 15 }}>
              Built for Indian group travelers who want safety, transparency, and zero drama.
            </p>
          </div>
          <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {features.map(({ icon: Icon, title, desc, gradient }) => (
              <div key={title} className="glass-card" style={{ padding: 30 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, marginBottom: 20,
                  background: gradient,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                }}>
                  <Icon style={{ width: 24, height: 24, color: "white" }} />
                </div>
                <h3 style={{ fontWeight: 700, color: "white", fontSize: 16, marginBottom: 10 }}>{title}</h3>
                <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.75, margin: 0 }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRODUCT DEMO ═════════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel text="Product Preview" />
            <SectionTitle>See How YatraSecure <span className="gradient-text">Works</span></SectionTitle>
            <p style={{ color: "#64748b", maxWidth: 480, margin: "16px auto 0", lineHeight: 1.7, fontSize: 15 }}>
              A sneak peek into the dashboard, chat, wallet, and more.
            </p>
          </div>
          <div className="demo-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
            {demoScreens.map(({ title, icon: Icon, desc, items }) => (
              <div key={title} className="demo-card">
                <div className="demo-card-header">
                  <div className="demo-card-dot" style={{ background: "#ef4444" }} />
                  <div className="demo-card-dot" style={{ background: "#fbbf24" }} />
                  <div className="demo-card-dot" style={{ background: "#22c55e" }} />
                  <span style={{ marginLeft: 8, fontSize: 12, color: "#64748b", fontWeight: 500 }}>{title}</span>
                </div>
                <div className="demo-card-body">
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 12,
                      background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon style={{ width: 20, height: 20, color: "#f97316" }} />
                    </div>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0 }}>{title}</p>
                      <p style={{ fontSize: 11, color: "#64748b", margin: 0 }}>{desc}</p>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {items.map(({ label, value }) => (
                      <div key={label} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        background: "rgba(15,23,42,0.4)", border: "1px solid rgba(255,255,255,0.03)",
                        borderRadius: 10, padding: "10px 14px",
                      }}>
                        <span style={{ fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>{label}</span>
                        <span style={{ fontSize: 12, color: "#f1f5f9", fontWeight: 600 }}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ EXPLORE PUBLIC TRIPS ══════════════════════════════════════════════════ */}
      <section id="explore" style={{
        padding: "100px 24px",
        background: "linear-gradient(180deg, #0f172a 0%, #111d35 50%, #0f172a 100%)",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel text="Open for Everyone" />
            <SectionTitle>Explore <span className="gradient-text">Public Trips</span></SectionTitle>
            <p style={{ color: "#64748b", maxWidth: 480, margin: "16px auto 0", lineHeight: 1.7, fontSize: 15 }}>
              Browse trips created by real travelers. Find one that matches your vibe and join instantly.
            </p>
          </div>
          <div className="trips-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
            {publicTrips.map((trip) => {
              const CatIcon = trip.categoryIcon;
              return (
                <div key={`${trip.from}-${trip.to}`} className="trip-card" onClick={() => router.push("/login")}>
                  <div style={{
                    display: "inline-flex", alignItems: "center", gap: 6,
                    background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)",
                    borderRadius: 8, padding: "5px 10px", marginBottom: 16,
                  }}>
                    <CatIcon style={{ width: 12, height: 12, color: "#f97316" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#f97316" }}>{trip.category}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <MapPin style={{ width: 16, height: 16, color: "#f97316", flexShrink: 0 }} />
                    <p style={{ fontSize: 16, fontWeight: 700, color: "white", margin: 0 }}>
                      {trip.from} <span style={{ color: "#64748b", fontSize: 13 }}>→</span> {trip.to}
                    </p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Calendar style={{ width: 13, height: 13, color: "#64748b" }} />
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{trip.dates}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Users style={{ width: 13, height: 13, color: "#64748b" }} />
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{trip.members} members</span>
                    </div>
                  </div>
                  <div style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 14,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: "50%",
                        background: "linear-gradient(135deg,#f97316,#fbbf24)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, fontWeight: 700, color: "white",
                      }}>
                        {trip.organizer.split(" ").map(n => n[0]).join("")}
                      </div>
                      <span style={{ fontSize: 12, color: "#94a3b8" }}>{trip.organizer}</span>
                    </div>
                    <ArrowRight style={{ width: 14, height: 14, color: "#475569" }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ CREATE TRIP ══════════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionLabel text="Start Planning" />
            <SectionTitle>Create Your <span className="gradient-text">Dream Trip</span></SectionTitle>
            <p style={{ color: "#64748b", maxWidth: 480, margin: "16px auto 0", lineHeight: 1.7, fontSize: 15 }}>
              Set your destination, invite friends, and let YatraSecure handle the rest.
            </p>
          </div>
          <div className="glass-card" style={{ padding: "36px 32px" }}>
            <div className="create-trip-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>
              {[
                { label: "From", placeholder: "Starting city", icon: MapPin },
                { label: "To", placeholder: "Destination", icon: MapPin },
                { label: "Start Date", placeholder: "Pick a date", icon: Calendar },
                { label: "Max Members", placeholder: "e.g. 8", icon: Users },
              ].map(({ label, placeholder, icon: I }) => (
                <div key={label}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, display: "block" }}>{label}</label>
                  <div style={{ position: "relative" }}>
                    <I style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 15, height: 15, color: "#475569", pointerEvents: "none" }} />
                    <input type="text" placeholder={placeholder} readOnly onClick={() => router.push("/signup")}
                      style={{ paddingLeft: 40, cursor: "pointer", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, display: "block" }}>Category</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {["Adventure", "Beach", "City Tour", "Wellness", "Backpacking", "Road Trip"].map((cat) => (
                  <span key={cat} onClick={() => router.push("/signup")}
                    style={{
                      padding: "7px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600,
                      background: "rgba(249,115,22,0.06)", border: "1px solid rgba(249,115,22,0.15)",
                      color: "#f97316", cursor: "pointer", transition: "all 0.2s",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "rgba(249,115,22,0.15)"; e.currentTarget.style.borderColor = "rgba(249,115,22,0.35)"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "rgba(249,115,22,0.06)"; e.currentTarget.style.borderColor = "rgba(249,115,22,0.15)"; }}
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 6, display: "block" }}>Short Description</label>
              <textarea placeholder="Briefly describe your trip plan..." readOnly onClick={() => router.push("/signup")} rows={3}
                style={{ cursor: "pointer", resize: "none", background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.06)" }}
              />
            </div>
            <button onClick={() => router.push("/signup")} className="btn-primary" style={{ width: "100%", padding: "16px", fontSize: 15 }}>
              <Plus style={{ width: 18, height: 18 }} /> Create Trip — Sign Up Free
            </button>
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS — Timeline ══════════════════════════════════════════════ */}
      <section id="how-it-works" style={{
        padding: "100px 24px",
        background: "linear-gradient(180deg, #0f172a 0%, #111d35 50%, #0f172a 100%)",
      }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel text="Simple Process" />
            <SectionTitle>Up & Running in{" "}<span className="gradient-text">4 Steps</span></SectionTitle>
          </div>
          <div className="steps-timeline" style={{ position: "relative", paddingLeft: 40 }}>
            <div style={{
              position: "absolute", left: 19, top: 30, bottom: 30, width: 2,
              background: "linear-gradient(180deg, #f97316, rgba(249,115,22,0.1))",
              borderRadius: 2,
            }} />
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {steps.map(({ step, title, desc, icon: StepIcon }) => (
                <div key={step} style={{ position: "relative" }}>
                  <div style={{
                    position: "absolute", left: -40, top: 24,
                    width: 40, height: 40, borderRadius: 12,
                    background: "linear-gradient(135deg, #f97316, #fbbf24)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 4px 16px rgba(249,115,22,0.35)",
                    zIndex: 2, transform: "translateX(-50%)", marginLeft: 20,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "white" }}>{step}</span>
                  </div>
                  <div className="glass-card" style={{ padding: "24px 28px", marginLeft: 20 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                      <StepIcon style={{ width: 18, height: 18, color: "#f97316" }} />
                      <h3 style={{ fontWeight: 700, color: "white", fontSize: 16, margin: 0 }}>{title}</h3>
                    </div>
                    <p style={{ color: "#94a3b8", fontSize: 13, lineHeight: 1.75, margin: 0 }}>{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ TESTIMONIALS ═════════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 64 }}>
            <SectionLabel text="Loved by Travelers" />
            <SectionTitle>Real Stories,{" "}<span className="gradient-text">Real Trips</span></SectionTitle>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
            {testimonials.map(({ name, city, avatar, tripType, rating, text }) => (
              <div key={name} className="glass-card" style={{ padding: 28 }}>
                <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>
                  {Array.from({ length: rating }).map((_, i) => (
                    <Star key={i} style={{ width: 16, height: 16, fill: "#f97316", color: "#f97316" }} />
                  ))}
                </div>
                <p style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.8, marginBottom: 24, fontStyle: "italic" }}>
                  &ldquo;{text}&rdquo;
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%",
                    background: "linear-gradient(135deg,#f97316,#fbbf24)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 13, fontWeight: 700, color: "white", flexShrink: 0,
                  }}>
                    {avatar}
                  </div>
                  <div>
                    <p style={{ fontWeight: 600, color: "white", fontSize: 14, margin: 0 }}>{name}</p>
                    <p style={{ color: "#64748b", fontSize: 12, margin: 0 }}>
                      {city} · <span style={{ color: "#f97316" }}>{tripType}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ FAQ ═══════════════════════════════════════════════════════════════════ */}
      <section id="faq" style={{
        padding: "100px 24px",
        background: "linear-gradient(180deg, #0f172a 0%, #111d35 50%, #0f172a 100%)",
      }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <SectionLabel text="Got Questions?" />
            <SectionTitle>Frequently Asked{" "}<span className="gradient-text">Questions</span></SectionTitle>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqs.map((faq) => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* ══ FINAL CTA ════════════════════════════════════════════════════════════ */}
      <section style={{ padding: "100px 24px" }}>
        <div style={{
          maxWidth: 900, margin: "0 auto", borderRadius: 28,
          padding: "80px 48px", textAlign: "center", position: "relative", overflow: "hidden",
          background: "linear-gradient(135deg, rgba(249,115,22,0.1), rgba(251,191,36,0.05))",
          border: "1px solid rgba(249,115,22,0.2)",
        }}>
          <div style={{
            position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)",
            width: 320, height: 320, borderRadius: "50%",
            background: "rgba(249,115,22,0.1)", filter: "blur(80px)", pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", bottom: -40, right: -40,
            width: 200, height: 200, borderRadius: "50%",
            background: "rgba(251,191,36,0.06)", filter: "blur(60px)", pointerEvents: "none",
          }} />
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 18, margin: "0 auto 24px",
              background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Heart style={{ width: 26, height: 26, color: "#f97316" }} />
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, color: "white", marginBottom: 16 }}>
              Ready for Your Next{" "}<span className="gradient-text">Adventure?</span>
            </h2>
            <p style={{ color: "#64748b", fontSize: 16, maxWidth: 500, margin: "0 auto 40px", lineHeight: 1.7 }}>
              Join thousands of verified travelers planning safe, fun, stress-free group trips across India and beyond.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 14, justifyContent: "center" }}>
              <button onClick={() => router.push("/signup")} className="btn-primary anim-glow" style={{ padding: "16px 40px", fontSize: 15 }}>
                Create Free Account <ArrowRight style={{ width: 18, height: 18 }} />
              </button>
              <button onClick={() => router.push("/trips")} className="btn-ghost" style={{ padding: "16px 40px", fontSize: 15 }}>
                Explore Public Trips
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══════════════════════════════════════════════════════════════ */}
      <footer style={{ borderTop: "1px solid rgba(30,41,59,0.5)", padding: "44px 24px" }}>
        <div className="footer-inner" style={{
          maxWidth: 1200, margin: "0 auto",
          display: "flex", flexWrap: "wrap", alignItems: "center",
          justifyContent: "space-between", gap: 24,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 10,
              background: "linear-gradient(135deg,#f97316,#fbbf24)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <MapPin style={{ width: 16, height: 16, color: "white" }} />
            </div>
            <span style={{ fontWeight: 800, color: "white", fontSize: 16 }}>YatraSecure</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 24 }}>
            {[
              { label: "Features", href: "#features" },
              { label: "How It Works", href: "#how-it-works" },
              { label: "Explore Trips", href: "#explore" },
              { label: "FAQ", href: "#faq" },
              { label: "Login", href: "/login" },
              { label: "Sign Up", href: "/signup" },
            ].map(({ label, href }) => (
              <a key={label} href={href}
                style={{ fontSize: 13, color: "#475569", textDecoration: "none", transition: "color 0.2s" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#f97316")}
                onMouseLeave={e => (e.currentTarget.style.color = "#475569")}
              >
                {label}
              </a>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "#334155", margin: 0 }}>
            © 2026 YatraSecure. Made with ❤️ in India
          </p>
        </div>
      </footer>

    </div>
  );
}
