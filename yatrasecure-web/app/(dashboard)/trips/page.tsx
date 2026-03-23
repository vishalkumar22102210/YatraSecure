"use client";
import { useEffect, useState, useContext } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Plus, Search, SlidersHorizontal, MapPin, Calendar,
  Wallet, Users, ArrowRight, Globe, Lock, Loader2, X,
  KeyRound, Copy, Check, Info, Heart, Star,
  ShieldCheck, Compass, Sparkles
} from "lucide-react";
import { API_BASE_URL, getAccessToken } from "@/app/lib/api";
import FollowButton from "@/components/FollowButton";
import { TravelThemeContext, CATEGORY_IMAGE_SETS, normalizeCategoryKey } from "@/app/TravelThemeProvider";
import { CategoryCharacter } from "@/components/CategoryCharacter";

const TRIP_TYPES = ["All", "Group", "Solo", "Family", "Adventure", "Pilgrimage", "Business"];
const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "✨ Newest First"       },
  { value: "createdAt-asc",  label: "⏳ Oldest First"       },
  { value: "startDate-asc",  label: "📅 Start Date: Soonest" },
  { value: "startDate-desc", label: "🏔️ Start Date: Later"   },
  { value: "budget-asc",     label: "💰 Budget: Low → High"  },
  { value: "budget-desc",    label: "💎 Budget: High → Low"  },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

type CategoryKey = "mountains" | "beach" | "forest" | "desert" | "city" | "adventure";

function resolveCategoryKey(trip: any): CategoryKey {
  const raw = (trip.category || trip.tripType || "").toString().toLowerCase();
  if (raw.includes("mountain") || raw.includes("himala")) return "mountains";
  if (raw.includes("beach") || raw.includes("ocean") || raw.includes("sea") || raw.includes("island")) return "beach";
  if (raw.includes("forest") || raw.includes("nature")) return "forest";
  if (raw.includes("desert") || raw.includes("dune")) return "desert";
  if (raw.includes("city") || raw.includes("urban")) return "city";
  return "adventure";
}

const CATEGORY_COLORS: Record<CategoryKey, { accent: string; tint: string; border: string }> = {
  mountains: { accent: "#4A6FA5", tint: "rgba(74,111,165,0.16)", border: "rgba(148,180,214,0.9)" },
  beach:     { accent: "#00B4D8", tint: "rgba(0,180,216,0.16)",  border: "rgba(0,180,216,0.9)" },
  forest:    { accent: "#2D6A4F", tint: "rgba(45,106,79,0.16)",  border: "rgba(82,183,136,0.9)" },
  desert:    { accent: "#C1440E", tint: "rgba(193,68,14,0.16)",  border: "rgba(233,196,106,0.9)" },
  city:      { accent: "#7B2FBE", tint: "rgba(123,47,190,0.16)", border: "rgba(192,192,192,0.9)" },
  adventure: { accent: "#FF6B35", tint: "rgba(255,107,53,0.16)", border: "rgba(255,107,53,0.9)" },
};

/* ─── Premium Trip Card ──────────────────────────────────────────────────────── */
function TripCard({ trip, currentUserId }: { trip: any; currentUserId?: string }) {
  const router    = useRouter();
  const isAdmin   = trip.adminId === currentUserId;
  const isMember  = trip.members?.some((m: any) => m.userId === currentUserId);
  const startDate = new Date(trip.startDate);
  const endDate   = new Date(trip.endDate);
  const now       = Date.now();
  const daysLeft  = Math.ceil((startDate.getTime() - now) / 86400000);
  const isUpcoming = daysLeft > 0;
  const isOngoing  = daysLeft <= 0 && now <= endDate.getTime();

  const status = isUpcoming
    ? { label: `${daysLeft}d left`, color: "#22c55e", bg: "rgba(34,197,94,0.1)"   }
    : isOngoing
    ? { label: "Ongoing",          color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  }
    : { label: "Completed",        color: "#64748b", bg: "rgba(100,116,139,0.1)" };

  const [copied, setCopied] = useState(false);
  const categoryKey = resolveCategoryKey(trip);
  const categoryColors = CATEGORY_COLORS[categoryKey];
  
  // Calculate a plausible match score based on trip type alignment
  const matchScore = 0; // Will be replaced by real AI match on For You tab

  function handleCopyCode(e: React.MouseEvent) {
    e.stopPropagation();
    if (trip.inviteCode) {
      navigator.clipboard.writeText(trip.inviteCode);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  function activatePalette() {
    if (typeof window !== "undefined" && typeof window.setCategoryPalette === "function") {
      window.setCategoryPalette(categoryKey);
    }
  }

  function resetPalette() {
    if (typeof window !== "undefined" && typeof window.setCategoryPalette === "function") {
      let stored = "default";
      try { stored = localStorage.getItem("active_palette") || "default"; } catch (e) {}
      window.setCategoryPalette(stored);
    }
  }

  return (
    <div
      onMouseEnter={activatePalette}
      onMouseLeave={resetPalette}
      onClick={() => {
        if (typeof window !== "undefined" && typeof window.setCategoryPalette === "function") {
          window.setCategoryPalette(categoryKey, true);
        }
        router.push(`/trips/${trip.id}`);
      }}
      style={{
        background: categoryColors.tint,
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(148,163,184,0.35)',
        borderRadius: 24,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        boxShadow: '0 18px 40px rgba(15,23,42,0.8)',
      }}
      className="group card-lift"
    >
      <div
        style={{
          height: 4,
          background: `linear-gradient(90deg, ${categoryColors.accent} 0%, ${categoryColors.border} 100%)`,
        }}
      />
      
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
               <span style={{ 
                 fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                 color: categoryColors.accent, background: `${categoryColors.accent}1a`, padding: '2px 8px', borderRadius: 999
               }}>{trip.tripType}</span>
               {trip.isPublic && <ShieldCheck style={{ width: 12, height: 12, color: '#22c55e' }} />}
               <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '2px 8px', borderRadius: 8 }}>
                  <Sparkles style={{ width: 10, height: 10 }} />
                  <span style={{ fontSize: 10, fontWeight: 900 }}>{matchScore}% Match</span>
               </div>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.2 }}>{trip.name}</h3>
          </div>
          <div style={{ background: status.bg, color: status.color, fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 10 }}>
            {status.label}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>
          <MapPin style={{ width: 14, height: 14, color: categoryColors.accent }} />
          {trip.fromCity} 
          <ArrowRight style={{ width: 12, height: 12, opacity: 0.5 }} /> 
          {trip.toCity}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
           <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
                 <Calendar style={{ width: 10, height: 10 }} /> START
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'white' }}>{formatDate(trip.startDate)}</div>
           </div>
           <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748b', fontSize: 11, fontWeight: 700, marginBottom: 2 }}>
                 <Wallet style={{ width: 10, height: 10 }} /> BUDGET
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#10b981' }}>₹{trip.budget?.toLocaleString()}</div>
           </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
             <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'linear-gradient(45deg, #1e293b, #0f172a)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
                <Users style={{ width: 12, height: 12, color: '#94a3b8' }} />
             </div>
             <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b' }}>{trip._count?.members || trip.members?.length || 0} Joined</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94a3b8', fontSize: 11 }}>
             <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: 'white' }}>
                 <span>@{trip.admin?.username || 'user'}</span>
                 {trip.admin?.isVerified && <ShieldCheck style={{ width: 12, height: 12, color: '#3b82f6' }} />}
               </div>
               <div style={{ fontSize: 9, color: '#64748b', fontWeight: 800 }}>
                 Score: {trip.admin?.reputationScore || 50}
               </div>
             </div>
             {isAdmin && <Star style={{ width: 12, height: 12, color: '#fbbf24', fill: '#fbbf24' }} />}
             {currentUserId !== (trip.adminId || trip.admin?.id) && (
               <div onClick={e => e.stopPropagation()}>
                 <FollowButton targetUserId={trip.adminId || trip.admin?.id} size="sm" variant="ghost" />
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TripsPage() {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [trips,        setTrips]       = useState<any[]>([]);
  const [myTrips,      setMyTrips]     = useState<any[]>([]);
  const [loading,      setLoading]     = useState(true);
  const [loadingMore,  setLoadingMore] = useState(false);
  const [hasMore,      setHasMore]     = useState(false);
  const [totalTrips,   setTotalTrips]  = useState(0);
  const [page,         setPage]        = useState(1);
  const [currentUser,  setCurrentUser] = useState<any>(null);

  const defaultTab = searchParams.get("tab") === "mine" ? "mine" : "browse";
  const [activeTab, setActiveTab] = useState<"browse" | "mine" | "matches">(defaultTab as any);
  const [matchResults, setMatchResults] = useState<any[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);

  const [search,     setSearch]     = useState("");
  const [tripType,   setTripType]   = useState("");
  const [sortKey,    setSortKey]    = useState("createdAt-desc");
  const [minBudget,  setMinBudget]  = useState("");
  const [maxBudget,  setMaxBudget]  = useState("");
  const [cityGuide,  setCityGuide]  = useState("");
  const [scoutPlaceholder, setScoutPlaceholder] = useState("Enter a city (e.g. Manali, Paris, Tokyo)...");

  const btn = (bg: string, col = 'white') => ({
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
    borderRadius: 14, background: bg, color: col, border: 'none',
    fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
    textDecoration: 'none'
  });

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setCurrentUser(JSON.parse(s));
  }, []);

  useEffect(() => {
    const examples = ["Manali", "Goa", "Paris", "Bali", "Tokyo", "New York"];
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % examples.length;
      setScoutPlaceholder(`Try "${examples[i]}"...`);
    }, 2600);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadTrips(true); }, 400);
    return () => clearTimeout(t);
  }, [search, tripType, sortKey, minBudget, maxBudget]);

  useEffect(() => {
    if (currentUser) {
      loadMyTrips();
      loadMatches();
    }
  }, [currentUser]);

  async function loadMatches() {
    setMatchLoading(true);
    try {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/users/matches?limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMatchResults(data);
    } catch (e) {
      console.error('Failed to load matches:', e);
    } finally {
      setMatchLoading(false);
    }
  }

  async function loadTrips(reset = false) {
    if (reset) setLoading(true); else setLoadingMore(true);
    try {
      const [sortBy, sortOrder] = sortKey.split("-");
      const token = getAccessToken();
      const params = new URLSearchParams({
        page:  reset ? "1" : String(page),
        limit: "12", sortBy, sortOrder,
      });
      if (search)    params.append("search",    search);
      if (tripType)  params.append("tripType",  tripType);
      if (minBudget) params.append("minBudget", minBudget);
      if (maxBudget) params.append("maxBudget", maxBudget);
      if (activeTab === "matches") params.append("matchmaking", "true");

      const headers: any = token ? { Authorization: `Bearer ${token}` } : {};
      const res  = await fetch(`${API_BASE_URL}/trips?${params}`, { headers });
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();

      if (reset) { setTrips(data.trips); setPage(1); }
      else       { setTrips(prev => [...prev, ...data.trips]); }
      setHasMore(data.pagination.hasMore);
      setTotalTrips(data.pagination.total);
    } catch (e: any) {
      toast.error(e.message || "Failed to load trips");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  async function loadMyTrips() {
    try {
      const token = getAccessToken();
      if (!token) return;
      const res = await fetch(`${API_BASE_URL}/trips?myTrips=true&limit=50&sortBy=createdAt&sortOrder=desc`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setMyTrips(data.trips || []);
    } catch {}
  }

  function handleLoadMore() {
    setPage(p => p + 1);
    loadTrips(false);
  }

  function handleGuideSearch(e: React.FormEvent) {
    e.preventDefault();
    if (cityGuide.trim()) {
      router.push(`/explore/guide/${encodeURIComponent(cityGuide.trim())}`);
    }
  }

  function clearFilters() {
    setSearch(""); setTripType(""); setSortKey("createdAt-desc");
    setMinBudget(""); setMaxBudget("");
  }

  const hasActiveFilters = search || tripType || minBudget || maxBudget;

  // ── Rotating hero background ──────────────────────────────────────────────
  const { category: themeCategory } = useContext(TravelThemeContext);
  const catKey = normalizeCategoryKey(themeCategory);
  const heroImages = catKey ? CATEGORY_IMAGE_SETS[catKey] : null;
  const [bgIdx, setBgIdx] = useState(0);

  useEffect(() => { setBgIdx(0); }, [themeCategory]);

  useEffect(() => {
    if (!heroImages || heroImages.length <= 1) return;
    const id = setInterval(() => setBgIdx(i => (i + 1) % heroImages.length), 10000);
    return () => clearInterval(id);
  }, [themeCategory]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="anim-in" style={{ padding: "0", color: "white", position: 'relative' }}>
      
      {/* ── HERO DISCOVERY SECTION ── */}
      <div style={{ 
        position: 'relative', 
        padding: '80px 40px', 
        background: 'linear-gradient(135deg, #020617 0%, #0f172a 100%)',
        borderRadius: '0 0 48px 48px',
        marginBottom: 40,
        overflow: 'hidden',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        {/* Rotating crossfade hero images */}
        {heroImages ? heroImages.map((url, i) => (
          <div key={url} style={{
            position: 'absolute', inset: 0, zIndex: 0,
            backgroundImage: `url(${url})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            opacity: i === bgIdx ? 1 : 0,
            transition: 'opacity 0.8s ease',
          }} />
        )) : (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'url(https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1600&q=80)', backgroundSize: 'cover', backgroundPosition: 'center' }} />
        )}
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.70)', zIndex: 0 }} />
        {/* Decor Orbs */}
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, background: 'rgba(56,189,248,0.05)', filter: 'blur(120px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 600, height: 600, background: 'rgba(56,189,248,0.04)', filter: 'blur(120px)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                 <div style={{ background: 'rgba(56,189,248,0.1)', padding: '6px 12px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Compass style={{ width: 14, height: 14, color: 'var(--accent)' }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Discovery Mode</span>
                 </div>
              </div>
              <h1 style={{ fontSize: 56, fontWeight: 700, margin: 0, letterSpacing: '-0.04em', lineHeight: 1, fontFamily: "'Space Grotesk', sans-serif" }}>Explore <span style={{ color: 'var(--accent)' }}>Adventures</span></h1>
              <p style={{ fontSize: 17, color: "#94a3b8", marginTop: 16, maxWidth: 540, lineHeight: 1.6 }}>
                Discover verified group trips, join like-minded travelers, and embark on unforgettable journeys across the globe.
              </p>
            </div>
            <Link href="/trips/create" className="btn-primary hover:scale-105 active:scale-95 transition-all" style={{ 
              textDecoration: 'none', padding: '16px 32px',
              borderRadius: 20, fontSize: 16, fontWeight: 800,
              display: 'flex', alignItems: 'center', gap: 10
            }}>
              <Plus style={{ width: 22, height: 22 }} /> Create New Trip
            </Link>
          </div>

          {/* MAGIC GUIDE WIDGET */}
          <div style={{ marginBottom: 40, padding: '24px 32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                 <Sparkles style={{ width: 20, height: 20, color: 'var(--accent)' }} /> AI Destination Scout
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Discover hidden secrets and expert itineraries for any city instantly.</p>
            </div>
            <form onSubmit={handleGuideSearch} style={{ display: 'flex', gap: 10, flex: '1 1 400px', maxWidth: 600 }}>
              <input 
                value={cityGuide}
                onChange={e => setCityGuide(e.target.value)}
                placeholder={scoutPlaceholder}
                className="ai-scout-input"
                style={{ flex: 1, padding: '12px 20px' }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>
                Explore Guide
              </button>
            </form>
          </div>

          {/* SEARCH BAR — enhanced */}
          <div
            className="search-glow-box"
            style={{ 
              background: 'rgba(255,255,255,0.03)',
              backdropFilter: 'blur(30px)',
              border: '1px solid rgba(255,255,255,0.10)',
              padding: '6px 6px 6px 8px', borderRadius: 36,
              display: 'flex', gap: 8, flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <div style={{ position: 'relative', flex: 1, minWidth: 320, display: 'flex', alignItems: 'center' }}>
              <Search style={{ position: 'absolute', left: 24, width: 22, height: 22, color: 'var(--accent)', flexShrink: 0 }} />
              <input 
                style={{ width: '100%', background: 'transparent', border: 'none', padding: '20px 48px 20px 64px', borderRadius: 28, color: 'white', fontSize: 16, outline: 'none', height: 64 }}
                placeholder="Search by city, name, or adventure type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 16, background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white', flexShrink: 0 }}>
                  <X style={{ width: 14, height: 14 }} />
                </button>
              )}
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 4px', height: 28 }} />
            <select 
              style={{ background: 'transparent', border: 'none', color: 'white', padding: '0 24px 0 12px', fontSize: 15, fontWeight: 700, outline: 'none', cursor: 'pointer', height: 64 }}
              value={sortKey} onChange={e => setSortKey(e.target.value)}
            >
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} style={{ background: '#0f172a' }}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* CONTENT GRID */}
      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '0 40px 100px', display: 'grid', gridTemplateColumns: '280px 1fr', gap: 48 }}>
        
        {/* SIDEBAR */}
        <div style={{ position: 'sticky', top: 100, height: 'fit-content' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            <SlidersHorizontal style={{ width: 20, height: 20, color: 'var(--accent)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, color: 'var(--accent)' }}>Filters</h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            {/* Tab Switcher */}
            {currentUser && (
               <div style={{ 
                 background: 'rgba(15,23,42,0.8)', 
                 padding: 4, borderRadius: 16, 
                 border: '1px solid rgba(255,255,255,0.05)', 
                 display: 'flex',
                 boxShadow: '0 10px 20px -5px rgba(0,0,0,0.3)',
                 marginBottom: 20
               }}>
                  {(['browse', 'matches', 'mine'] as const).map(tab => (
                    <button key={tab} onClick={() => { setActiveTab(tab); setPage(1); }} style={{ 
                      flex: 1, padding: '10px 4px', borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: 'pointer', transition: 'all 0.3s',
                      background: activeTab === tab ? '#f97316' : 'transparent',
                      color: activeTab === tab ? 'white' : '#64748b',
                      border: 'none',
                      textTransform: 'capitalize'
                    }}>{tab === 'browse' ? 'Browse' : tab === 'matches' ? 'For You' : 'My Trips'}</button>
                  ))}
               </div>
            )}

            {/* Categories */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, color: '#475569', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Experience Type</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {TRIP_TYPES.map(t => (
                  <button key={t} onClick={() => {
                    const newType = t === "All" ? "" : t;
                    setTripType(newType);
                    window.setCategoryPalette?.(newType || "default", true);
                  }} style={{ 
                    textAlign: 'left', padding: '12px 18px', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    background: (t === "All" && !tripType) || tripType === t ? 'rgba(56,189,248,0.1)' : 'transparent',
                    border: 'none',
                    color: (t === "All" && !tripType) || tripType === t ? 'var(--accent)' : '#94a3b8'
                  }} className="hover:translate-x-1 hover:text-white">{t}</button>
                ))}
              </div>
            </div>

            {/* Budget */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 900, color: '#475569', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Price Range (₹)</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input className="input-field" placeholder="Min Budget" type="number" value={minBudget} onChange={e => setMinBudget(e.target.value)} style={{ padding: '12px 18px', borderRadius: 14 }} />
                <input className="input-field" placeholder="Max Budget" type="number" value={maxBudget} onChange={e => setMaxBudget(e.target.value)} style={{ padding: '12px 18px', borderRadius: 14 }} />
              </div>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} style={{ 
                width: '100%', padding: '14px', borderRadius: 18, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)',
                color: '#ef4444', fontSize: 13, fontWeight: 800, cursor: 'pointer'
              }} className="hover:bg-red-500 hover:text-white transition-all">Clear All Filters</button>
            )}
            
            {/* Promo Card */}
            <div style={{ 
              background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
              padding: 24, borderRadius: 24, display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20,
              boxShadow: '0 20px 40px -15px rgba(124,58,237,0.4)'
            }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                 <Star style={{ width: 16, height: 16, color: 'white', fill: 'white' }} />
              </div>
              <h4 style={{ margin: 0, fontSize: 16, fontWeight: 900 }}>AI Matchmaking</h4>
              <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.8)', lineHeight: 1.5 }}>Find trips that match your travel personality perfectly.</p>
            </div>
          </div>
        </div>

        {/* MAIN LIST */}
        <div style={{ minHeight: '600px' }}>
          {loading ? (
             <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 32 }}>
                {[...Array(6)].map((_, i) => (
                  <div key={i} style={{ height: 280, borderRadius: 32, background: "rgba(15,23,42,0.4)", animation: "pulse 1.5s infinite" }} />
                ))}
             </div>
          ) : (activeTab === "browse" ? trips : activeTab === "matches" ? trips : myTrips).length === 0 ? (
             <div style={{ 
               padding: '100px 40px', textAlign: 'center', 
               background: 'rgba(15,23,42,0.4)', borderRadius: 48, 
               border: '1px solid rgba(255,255,255,0.05)',
               backdropFilter: 'blur(10px)'
             }}>
               {/* SVG Traveler with Backpack — empty state illustration */}
               <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
                 <svg width="96" height="120" viewBox="0 0 96 120" fill="none" xmlns="http://www.w3.org/2000/svg"
                   style={{ animation: 'float 3s ease-in-out infinite', filter: 'drop-shadow(0 8px 24px var(--accent))' }}>
                   {/* Body */}
                   <ellipse cx="48" cy="68" rx="18" ry="24" fill="var(--accent)" opacity="0.85"/>
                   {/* Head */}
                   <circle cx="48" cy="34" r="14" fill="var(--accent)" opacity="0.9"/>
                   {/* Hat brim */}
                   <rect x="32" y="23" width="32" height="5" rx="2.5" fill="var(--accent-hover)" opacity="0.95"/>
                   {/* Hat top */}
                   <rect x="36" y="12" width="24" height="13" rx="5" fill="var(--accent-hover)" opacity="0.95"/>
                   {/* Left arm */}
                   <rect x="26" y="52" width="8" height="22" rx="4" fill="var(--accent)" opacity="0.7" transform="rotate(-10 26 52)"/>
                   {/* Right arm */}
                   <rect x="62" y="52" width="8" height="22" rx="4" fill="var(--accent)" opacity="0.7" transform="rotate(10 66 52)"/>
                   {/* Backpack */}
                   <rect x="54" y="50" width="20" height="26" rx="6" fill="var(--accent-hover)" opacity="0.8"/>
                   <rect x="57" y="46" width="14" height="6" rx="3" fill="var(--accent-hover)" opacity="0.7"/>
                   {/* Backpack pocket */}
                   <rect x="57" y="60" width="14" height="10" rx="4" fill="var(--accent)" opacity="0.5"/>
                   {/* Legs */}
                   <rect x="39" y="88" width="9" height="24" rx="4.5" fill="var(--accent)" opacity="0.75"/>
                   <rect x="51" y="88" width="9" height="24" rx="4.5" fill="var(--accent)" opacity="0.75"/>
                   {/* Shoes */}
                   <ellipse cx="43" cy="113" rx="8" ry="4" fill="var(--accent-hover)" opacity="0.9"/>
                   <ellipse cx="55" cy="113" rx="8" ry="4" fill="var(--accent-hover)" opacity="0.9"/>
                   {/* Staff */}
                   <rect x="76" y="40" width="4" height="70" rx="2" fill="var(--accent)" opacity="0.4"/>
                 </svg>
               </div>
               <h3 style={{ fontSize: 24, fontWeight: 900, margin: 0, letterSpacing: '-0.02em' }}>No adventures found</h3>
               <p style={{ color: '#64748b', fontSize: 16, marginTop: 12, maxWidth: 400, margin: '12px auto' }}>We couldn't find any trips matching your current search. Try resetting your filters.</p>
               <button onClick={clearFilters} style={{ 
                 marginTop: 32, background: 'white', border: 'none', color: '#0f172a', 
                 padding: '14px 32px', borderRadius: 16, fontWeight: 800, cursor: 'pointer',
                 boxShadow: '0 10px 20px rgba(255,255,255,0.1)'
               }} className="hover:scale-105 active:scale-95 transition-all">Reset All Filters</button>
             </div>
          ) : (
             <>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                  <p style={{ fontSize: 14, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                     Showing {activeTab === "matches" ? matchResults.length + " AI" : activeTab === "browse" ? trips.length : myTrips.length} Results
                  </p>
               </div>
               <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 32 }}>
                 {activeTab !== "matches" && (activeTab === "browse" ? trips : myTrips).map(trip => (
                   <TripCard key={trip.id} trip={trip} currentUserId={currentUser?.id} />
                 ))}
                  {activeTab === "matches" && (matchLoading ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60 }}>
                      <Loader2 style={{ width: 28, height: 28, color: 'var(--accent)', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
                      <p style={{ color: '#64748b', marginTop: 16 }}>Finding your best matches...</p>
                    </div>
                  ) : matchResults.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60 }}>
                      <Sparkles style={{ width: 32, height: 32, color: 'var(--accent)', margin: '0 auto 12px' }} />
                      <p style={{ fontSize: 18, fontWeight: 700, color: '#94a3b8' }}>No matches found yet</p>
                      <p style={{ color: '#64748b', fontSize: 13, marginTop: 8 }}>Complete your profile to improve matching!</p>
                    </div>
                  ) : matchResults.map((match: any) => (
                    <div key={match.user.id} onClick={() => router.push('/profile/' + match.user.username)} style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(148,163,184,0.15)', borderRadius: 24, overflow: 'hidden', cursor: 'pointer', transition: 'all 0.3s' }} className="card-lift">
                      <div style={{ height: 4, background: match.matchPercentage >= 80 ? 'linear-gradient(90deg, #22c55e, #10b981)' : match.matchPercentage >= 60 ? 'linear-gradient(90deg, #f59e0b, #eab308)' : 'linear-gradient(90deg, #64748b, #94a3b8)' }} />
                      <div style={{ padding: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                          <div style={{ width: 52, height: 52, borderRadius: '50%', background: match.user.profileImage ? 'transparent' : 'linear-gradient(135deg, #38bdf8, #818cf8)', border: '2px solid rgba(56,189,248,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: 'white', overflow: 'hidden', flexShrink: 0 }}>
                            {match.user.profileImage ? <img src={match.user.profileImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (match.user.username || '').slice(0, 2).toUpperCase()}
                          </div>
                          <div style={{ flex: 1 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>@{match.user.username}</span>
                            {match.user.city && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{match.user.city}{match.user.state ? ', ' + match.user.state : ''}</div>}
                          </div>
                          <div style={{ background: match.matchPercentage >= 80 ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', padding: '6px 12px', borderRadius: 12, textAlign: 'center' }}>
                            <div style={{ fontSize: 18, fontWeight: 900, color: match.matchPercentage >= 80 ? '#22c55e' : '#f59e0b' }}>{match.matchPercentage}%</div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Match</div>
                          </div>
                        </div>
                        {match.user.bio && <p style={{ fontSize: 12, color: '#94a3b8', margin: '0 0 14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{match.user.bio}</p>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                          {(match.matchReasons || []).map((reason: string, idx: number) => (<span key={idx} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)', color: '#38bdf8' }}>{reason}</span>))}
                        </div>
                        {(match.user.interests || []).length > 0 && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>{match.user.interests.slice(0, 5).map((tag: string) => (<span key={tag} style={{ padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 600, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.15)', color: '#a855f7' }}>{tag}</span>))}</div>}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                          <span style={{ fontSize: 11, color: '#64748b' }}>{match.user.travelPersonality || 'Explorer'}</span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>Score: {match.user.reputationScore || 50}</span>
                        </div>
                      </div>
                    </div>
                  )))}
               </div>
               
               {activeTab === "browse" && hasMore && (
                 <div style={{ textAlign: 'center', marginTop: 64 }}>
                   <button onClick={handleLoadMore} disabled={loadingMore} style={{ 
                     background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                     color: 'white', padding: '18px 56px', borderRadius: 24, fontSize: 15, fontWeight: 800,
                     cursor: 'pointer', transition: 'all 0.3s', display: 'inline-flex', alignItems: 'center', gap: 12
                   }} className="hover:bg-white/5 active:scale-95">
                     {loadingMore ? <Loader2 style={{ width: 22, height: 22, animation: 'spin 1s linear infinite' }} /> : 'Load More Adventures'}
                   </button>
                   <p style={{ fontSize: 12, color: '#475569', marginTop: 16 }}>Showing {trips.length} of {totalTrips} Total Trips</p>
                 </div>
               )}
             </>
          )}
        </div>
      </div>
      {/* Category character illustration */}
      <CategoryCharacter />
    </div>
  );
}
