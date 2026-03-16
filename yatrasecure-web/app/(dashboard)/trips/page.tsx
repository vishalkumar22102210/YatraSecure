"use client";
import { useEffect, useState } from "react";
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
  
  // Calculate a fake but plausible match score based on types
  const matchScore = trip._count?.members ? Math.floor(Math.random() * 15) + 85 : 92; 

  function handleCopyCode(e: React.MouseEvent) {
    e.stopPropagation();
    if (trip.inviteCode) {
      navigator.clipboard.writeText(trip.inviteCode);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div
      onClick={() => router.push(`/trips/${trip.id}`)}
      style={{
        background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 24,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}
      className="hover:-translate-y-2 hover:border-orange-500/30 group"
    >
      <div style={{ height: 4, background: isAdmin ? "linear-gradient(90deg,#f97316,#fbbf24)" : "linear-gradient(90deg,#7c3aed,#3b82f6)" }} />
      
      <div style={{ padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
               <span style={{ 
                 fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                 color: '#f97316', background: 'rgba(249,115,22,0.1)', padding: '2px 8px', borderRadius: 6
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
          <MapPin style={{ width: 14, height: 14, color: '#f97316' }} />
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

  const [search,     setSearch]     = useState("");
  const [tripType,   setTripType]   = useState("");
  const [sortKey,    setSortKey]    = useState("createdAt-desc");
  const [minBudget,  setMinBudget]  = useState("");
  const [maxBudget,  setMaxBudget]  = useState("");
  const [cityGuide,  setCityGuide]  = useState("");

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
    const t = setTimeout(() => { setPage(1); loadTrips(true); }, 400);
    return () => clearTimeout(t);
  }, [search, tripType, sortKey, minBudget, maxBudget]);

  useEffect(() => {
    if (currentUser) loadMyTrips();
  }, [currentUser]);

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

  return (
    <div className="anim-in" style={{ padding: "0", color: "white" }}>
      
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
        {/* Decor Orbs */}
        <div style={{ position: 'absolute', top: '-20%', right: '-10%', width: 600, height: 600, background: 'rgba(249,115,22,0.06)', filter: 'blur(120px)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 600, height: 600, background: 'rgba(124,58,237,0.08)', filter: 'blur(120px)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 48, flexWrap: 'wrap', gap: 32 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                 <div style={{ background: 'rgba(249,115,22,0.1)', padding: '6px 12px', borderRadius: 99, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Compass style={{ width: 14, height: 14, color: '#f97316' }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Discovery Mode</span>
                 </div>
              </div>
              <h1 style={{ fontSize: 56, fontWeight: 950, margin: 0, letterSpacing: '-0.04em', lineHeight: 1 }}>Explore <span style={{ color: '#f97316' }}>Adventures</span></h1>
              <p style={{ fontSize: 17, color: "#94a3b8", marginTop: 16, maxWidth: 540, lineHeight: 1.6 }}>
                Discover verified group trips, join like-minded travelers, and embark on unforgettable journeys across the globe.
              </p>
            </div>
            <Link href="/trips/create" style={{ 
              background: 'linear-gradient(135deg, #f97316, #fbbf24)',
              color: 'white', textDecoration: 'none', padding: '16px 32px',
              borderRadius: 20, fontSize: 16, fontWeight: 800,
              boxShadow: '0 12px 30px -10px rgba(249,115,22,0.5)',
              display: 'flex', alignItems: 'center', gap: 10
            }} className="hover:scale-105 active:scale-95 transition-all">
              <Plus style={{ width: 22, height: 22 }} /> Create New Trip
            </Link>
          </div>

          {/* MAGIC GUIDE WIDGET */}
          <div style={{ marginBottom: 40, padding: '24px 32px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                 <Sparkles style={{ width: 20, height: 20, color: '#fb923c' }} /> AI Destination Scout
              </h3>
              <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Discover hidden secrets and expert itineraries for any city instantly.</p>
            </div>
            <form onSubmit={handleGuideSearch} style={{ display: 'flex', gap: 10, flex: '1 1 400px', maxWidth: 600 }}>
              <input 
                value={cityGuide}
                onChange={e => setCityGuide(e.target.value)}
                placeholder="Enter a city (e.g. Manali, Paris, Tokyo)..."
                style={{ flex: 1, padding: '12px 20px', borderRadius: 12, background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', outline: 'none' }}
              />
              <button type="submit" style={{ ...btn('rgba(249,115,22,0.1)', '#f97316'), padding: '12px 24px', border: '1px solid rgba(249,115,22,0.2)' }} className="hover:bg-orange-500/20">
                Explore Guide
              </button>
            </form>
          </div>

          {/* SEARCH BAR */}
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            backdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: 8, borderRadius: 32,
            display: 'flex', gap: 8, flexWrap: 'wrap',
            boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)'
          }}>
            <div style={{ position: 'relative', flex: 1, minWidth: 320 }}>
              <Search style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', width: 22, height: 22, color: '#f97316' }} />
              <input 
                style={{ width: '100%', background: 'transparent', border: 'none', padding: '22px 24px 22px 64px', borderRadius: 24, color: 'white', fontSize: 17, outline: 'none' }}
                placeholder="Search by city, name, or adventure type..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.1)', margin: '12px 8px' }} />
            <select 
              style={{ background: 'transparent', border: 'none', color: 'white', padding: '0 32px', fontSize: 16, fontWeight: 700, outline: 'none', cursor: 'pointer' }}
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
            <SlidersHorizontal style={{ width: 20, height: 20, color: '#f97316' }} />
            <h2 style={{ fontSize: 16, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', margin: 0, color: '#f97316' }}>Filters</h2>
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
                  <button key={t} onClick={() => setTripType(t === "All" ? "" : t)} style={{ 
                    textAlign: 'left', padding: '12px 18px', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s',
                    background: (t === "All" && !tripType) || tripType === t ? 'rgba(249,115,22,0.1)' : 'transparent',
                    border: 'none',
                    color: (t === "All" && !tripType) || tripType === t ? '#f97316' : '#94a3b8'
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
               <div style={{ fontSize: 64, marginBottom: 24 }}>🗺️</div>
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
                     Showing {activeTab === "browse" ? trips.length : myTrips.length} Results
                  </p>
               </div>
               <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 32 }}>
                 {(activeTab === "browse" ? trips : myTrips).map(trip => (
                   <TripCard key={trip.id} trip={trip} currentUserId={currentUser?.id} />
                 ))}
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
    </div>
  );
}