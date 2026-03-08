"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  Plus, Search, SlidersHorizontal, MapPin, Calendar,
  Wallet, Users, ArrowRight, Globe, Lock, Loader2, X,
  KeyRound, Copy, Check,
} from "lucide-react";
import { API_BASE_URL, getAccessToken } from "@/app/lib/api";

const TRIP_TYPES = ["All", "Group", "Solo", "Family", "Adventure", "Pilgrimage", "Business"];
const SORT_OPTIONS = [
  { value: "createdAt-desc", label: "Newest First"       },
  { value: "createdAt-asc",  label: "Oldest First"       },
  { value: "startDate-asc",  label: "Start Date: Earliest" },
  { value: "startDate-desc", label: "Start Date: Latest"   },
  { value: "budget-asc",     label: "Budget: Low → High"  },
  { value: "budget-desc",    label: "Budget: High → Low"  },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ─── Trip Card ──────────────────────────────────────────────────────────────── */
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
      className="card"
      style={{ padding: 0, overflow: "hidden", cursor: "pointer", transition: "transform 0.15s, border-color 0.15s" }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(249,115,22,0.3)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = "translateY(0)";    (e.currentTarget as HTMLElement).style.borderColor = "#1e293b"; }}
    >
      {/* Color bar */}
      <div style={{ height: 3, background: isAdmin ? "linear-gradient(90deg,#f97316,#fbbf24)" : isMember ? "linear-gradient(90deg,#7c3aed,#a78bfa)" : "linear-gradient(90deg,#1e40af,#3b82f6)" }} />

      <div style={{ padding: "16px 18px" }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10, gap: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {trip.name}
            </h3>
            <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "#64748b" }}>
              <MapPin style={{ width: 10, height: 10 }} />
              {trip.fromCity} → {trip.toCity}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
            <span style={{
              display: "flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600,
              padding: "2px 8px", borderRadius: 999,
              background: trip.isPublic ? "rgba(96,165,250,0.08)" : "rgba(251,191,36,0.08)",
              color: trip.isPublic ? "#60a5fa" : "#fbbf24",
              border: `1px solid ${trip.isPublic ? "rgba(96,165,250,0.15)" : "rgba(251,191,36,0.15)"}`,
            }}>
              {trip.isPublic ? <Globe style={{ width: 9, height: 9 }} /> : <Lock style={{ width: 9, height: 9 }} />}
              {trip.isPublic ? "Public" : "Private"}
            </span>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 999, background: status.bg, color: status.color }}>
              {status.label}
            </span>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          {[
            { icon: Calendar, value: formatDate(trip.startDate), color: "#7c3aed" },
            { icon: Users,    value: `${trip._count?.members ?? trip.members?.length ?? 0} members`, color: "#f97316" },
            { icon: Wallet,   value: `₹${trip.budget?.toLocaleString()}`, color: "#10b981" },
          ].map(({ icon: Icon, value, color }) => (
            <div key={value} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#64748b" }}>
              <Icon style={{ width: 10, height: 10, color }} />
              {value}
            </div>
          ))}
        </div>

        {/* ── Invite Code row (Private trips — admin/member only) ── */}
        {!trip.isPublic && trip.inviteCode && (isAdmin || isMember) && (
          <div
            onClick={e => e.stopPropagation()}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", borderRadius: 10, marginBottom: 12,
              background: "rgba(251,191,36,0.06)",
              border: "1px solid rgba(251,191,36,0.15)",
            }}
          >
            <KeyRound style={{ width: 12, height: 12, color: "#fbbf24", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#64748b", flexShrink: 0 }}>Code:</span>
            <span style={{
              fontSize: 13, fontWeight: 800, color: "#fbbf24",
              fontFamily: "monospace", letterSpacing: "0.15em",
            }}>
              {trip.inviteCode}
            </span>
            <button
              onClick={handleCopyCode}
              style={{
                marginLeft: "auto", display: "flex", alignItems: "center", gap: 4,
                padding: "3px 10px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                cursor: "pointer", transition: "all 0.15s",
                background: copied ? "rgba(34,197,94,0.15)" : "rgba(251,191,36,0.12)",
                border: `1px solid ${copied ? "rgba(34,197,94,0.25)" : "rgba(251,191,36,0.2)"}`,
                color: copied ? "#22c55e" : "#fbbf24",
              }}
            >
              {copied ? <Check style={{ width: 10, height: 10 }} /> : <Copy style={{ width: 10, height: 10 }} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        )}

        {/* Footer row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(124,58,237,0.1)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.2)" }}>
              {trip.tripType}
            </span>
            {isAdmin && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(249,115,22,0.1)", color: "#f97316", border: "1px solid rgba(249,115,22,0.2)" }}>
                Admin
              </span>
            )}
            {isMember && !isAdmin && (
              <span style={{ fontSize: 10, fontWeight: 600, padding: "3px 8px", borderRadius: 6, background: "rgba(167,139,250,0.1)", color: "#a78bfa", border: "1px solid rgba(167,139,250,0.2)" }}>
                Member
              </span>
            )}
            <span style={{ fontSize: 10, color: "#334155" }}>@{trip.admin?.username}</span>
          </div>
          <ArrowRight style={{ width: 13, height: 13, color: "#334155" }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════════ */
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
  const [showFilters,  setShowFilters] = useState(false);

  const defaultTab = searchParams.get("tab") === "mine" ? "mine" : "browse";
  const [activeTab, setActiveTab] = useState<"browse" | "mine">(defaultTab as any);

  const [search,     setSearch]     = useState("");
  const [tripType,   setTripType]   = useState("");
  const [sortKey,    setSortKey]    = useState("createdAt-desc");
  const [minBudget,  setMinBudget]  = useState("");
  const [maxBudget,  setMaxBudget]  = useState("");

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setCurrentUser(JSON.parse(s));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); loadTrips(true); }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, tripType, sortKey, minBudget, maxBudget]);

  useEffect(() => {
    if (currentUser) loadMyTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  async function loadTrips(reset = false) {
    reset ? setLoading(true) : setLoadingMore(true);
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

  function clearFilters() {
    setSearch(""); setTripType(""); setSortKey("createdAt-desc");
    setMinBudget(""); setMaxBudget("");
  }

  const hasActiveFilters = search || tripType || minBudget || maxBudget;

  if (loading) return (
    <div className="anim-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <div style={{ width: 160, height: 28, borderRadius: 8, background: "#1a2744", marginBottom: 8, animation: "pulse 1.5s ease-in-out infinite" }} />
          <div style={{ width: 100, height: 16, borderRadius: 6, background: "#1a2744", animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
        <div style={{ width: 120, height: 40, borderRadius: 10, background: "#1a2744", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
        {[...Array(6)].map((_, i) => (
          <div key={i} style={{ height: 160, borderRadius: 14, background: "#1a2744", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    </div>
  );

  return (
    <div className="anim-in">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Browse Trips</h1>
          <p className="page-subtitle">
            {activeTab === "browse"
              ? `${totalTrips} public trip${totalTrips !== 1 ? "s" : ""} available`
              : `${myTrips.length} of your trips`}
          </p>
        </div>
        <Link href="/trips/create" className="btn-primary" style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 18px", textDecoration: "none" }}>
          <Plus style={{ width: 16, height: 16 }} /> Create Trip
        </Link>
      </div>

      {/* TABS */}
      {currentUser && (
        <div style={{ display: "flex", gap: 4, marginBottom: 20, background: "#1a2744", borderRadius: 12, padding: 4, width: "fit-content" }}>
          {(["browse", "mine"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.15s",
                background: activeTab === tab ? "rgba(249,115,22,0.15)" : "transparent",
                border: activeTab === tab ? "1px solid rgba(249,115,22,0.3)" : "1px solid transparent",
                color: activeTab === tab ? "#f97316" : "#475569",
              }}
            >
              {tab === "browse" ? "🌍 Browse All" : `🧳 My Trips ${myTrips.length > 0 ? `(${myTrips.length})` : ""}`}
            </button>
          ))}
        </div>
      )}

      {/* SEARCH + SORT */}
      {activeTab === "browse" && (
        <>
          <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
            <div style={{ position: "relative", flex: 1, minWidth: 200 }}>
              <Search style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#475569", pointerEvents: "none" }} />
              <input className="input-field" style={{ paddingLeft: 42 }} placeholder="Search trips by name or city..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && (
                <button onClick={() => setSearch("")} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569" }}>
                  <X style={{ width: 13, height: 13 }} />
                </button>
              )}
            </div>
            <select className="input-field" style={{ width: "auto", minWidth: 160 }} value={sortKey} onChange={e => setSortKey(e.target.value)}>
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={() => setShowFilters(!showFilters)}
              style={{
                display: "flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: 10,
                fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                background: showFilters || hasActiveFilters ? "rgba(249,115,22,0.1)" : "transparent",
                border: `1px solid ${showFilters || hasActiveFilters ? "rgba(249,115,22,0.3)" : "#1e293b"}`,
                color: showFilters || hasActiveFilters ? "#f97316" : "#475569",
              }}
            >
              <SlidersHorizontal style={{ width: 14, height: 14 }} /> Filters
              {hasActiveFilters && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316" }} />}
            </button>
          </div>

          {showFilters && (
            <div className="card" style={{ padding: "16px 18px", marginBottom: 14 }}>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "flex-end" }}>
                <div style={{ minWidth: 120 }}>
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Min Budget</label>
                  <input type="number" className="input-field" style={{ padding: "8px 12px" }} placeholder="₹0" value={minBudget} onChange={e => setMinBudget(e.target.value)} />
                </div>
                <div style={{ minWidth: 120 }}>
                  <label style={{ display: "block", fontSize: 11, color: "#64748b", fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em" }}>Max Budget</label>
                  <input type="number" className="input-field" style={{ padding: "8px 12px" }} placeholder="₹∞" value={maxBudget} onChange={e => setMaxBudget(e.target.value)} />
                </div>
                {hasActiveFilters && (
                  <button onClick={clearFilters} style={{ padding: "8px 14px", borderRadius: 9, fontSize: 12, fontWeight: 600, color: "#ef4444", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", cursor: "pointer" }}>
                    Clear All
                  </button>
                )}
              </div>
            </div>
          )}

          <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
            {TRIP_TYPES.map(t => (
              <button key={t} onClick={() => setTripType(t === "All" ? "" : t)}
                style={{
                  padding: "7px 16px", borderRadius: 999, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s",
                  background: (t === "All" && !tripType) || tripType.toLowerCase() === t.toLowerCase() ? "linear-gradient(135deg,#f97316,#fbbf24)" : "transparent",
                  border: (t === "All" && !tripType) || tripType.toLowerCase() === t.toLowerCase() ? "1px solid transparent" : "1px solid #1e293b",
                  color: (t === "All" && !tripType) || tripType.toLowerCase() === t.toLowerCase() ? "white" : "#475569",
                  boxShadow: (t === "All" && !tripType) || tripType.toLowerCase() === t.toLowerCase() ? "0 3px 10px rgba(249,115,22,0.3)" : "none",
                }}
              >{t}</button>
            ))}
          </div>
        </>
      )}

      {/* BROWSE ALL */}
      {activeTab === "browse" && (
        <>
          {trips.length === 0 ? (
            <div className="card" style={{ padding: "56px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🏕️</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: "white", marginBottom: 6 }}>No trips found</p>
              <p style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>
                {hasActiveFilters ? "Try adjusting your filters" : "Be the first to create a trip!"}
              </p>
              {hasActiveFilters
                ? <button onClick={clearFilters} className="btn-ghost" style={{ padding: "9px 20px" }}>Clear Filters</button>
                : <Link href="/trips/create" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", textDecoration: "none" }}>
                    <Plus style={{ width: 15, height: 15 }} /> Create Trip
                  </Link>}
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {trips.map(trip => <TripCard key={trip.id} trip={trip} currentUserId={currentUser?.id} />)}
              </div>
              {hasMore && (
                <div style={{ textAlign: "center", marginTop: 24 }}>
                  <button onClick={handleLoadMore} disabled={loadingMore} className="btn-ghost" style={{ padding: "11px 28px", fontSize: 13 }}>
                    {loadingMore
                      ? <><Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> Loading...</>
                      : `Load More (${totalTrips - trips.length} remaining)`}
                  </button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* MY TRIPS */}
      {activeTab === "mine" && (
        <>
          {myTrips.length === 0 ? (
            <div className="card" style={{ padding: "56px 24px", textAlign: "center" }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>✈️</p>
              <p style={{ fontSize: 16, fontWeight: 600, color: "white", marginBottom: 6 }}>No trips yet</p>
              <p style={{ fontSize: 13, color: "#475569", marginBottom: 20 }}>Create your first trip or join one!</p>
              <Link href="/trips/create" className="btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", textDecoration: "none" }}>
                <Plus style={{ width: 15, height: 15 }} /> Create Trip
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
              {myTrips.map(trip => <TripCard key={trip.id} trip={trip} currentUserId={currentUser?.id} />)}
            </div>
          )}
        </>
      )}
    </div>
  );
}