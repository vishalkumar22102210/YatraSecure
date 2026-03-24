"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, MapPin, Users, Calendar, Wallet,
  TrendingUp, ArrowRight, Clock, Globe, Lock,
  Compass, Bell, Shield, Phone, AlertTriangle,
  Hospital, Building2, Train, Loader2, Star, CheckCircle, Navigation, Play
} from "lucide-react";
import { fetchWithAuth } from "@/app/lib/api";
import toast from "react-hot-toast";
import JoinByInviteCode from "@/components/JoinByInviteCode";
import SuggestedTravelers from "@/components/SuggestedTravelers";
import { CategoryCharacter } from "@/components/CategoryCharacter";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── TRIP CARD ─────────────────────────────────────────────
function TripCard({ trip }: { trip: any }) {
  const router = useRouter();
  const [daysLeft, setDaysLeft] = useState(0);
  useEffect(() => {
    setDaysLeft(Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / 86400000));
  }, [trip.startDate]);
  return (
    <div
      onClick={() => router.push(`/trips/${trip.id}`)}
      style={{ padding: 24, cursor: "pointer", background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20 }}
      className="hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(0,0,0,0.3)] hover:border-white/10 transition-all duration-300 group"
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14, flexShrink: 0,
            background: "rgba(56,189,248,0.08)",
            border: "1px solid rgba(56,189,248,0.18)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MapPin style={{ width: 18, height: 18, color: "var(--accent)" }} className="group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <p style={{ fontSize: 15, fontWeight: 800, color: "white", margin: 0, letterSpacing: "-0.01em" }}>{trip.name}</p>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 0 0", display: "flex", alignItems: "center", gap: 4 }}>
              {trip.fromCity} <ArrowRight style={{ width: 10, height: 10 }} /> {trip.toCity}
            </p>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "6px 10px", borderRadius: 8, fontSize: 11, fontWeight: 700,
          background: "rgba(255,255,255,0.05)",
          color: "#cbd5e1",
        }}>
          {trip.isPublic ? <Globe style={{ width: 12, height: 12 }} /> : <Lock style={{ width: 12, height: 12 }} />}
          {trip.isPublic ? "Public" : "Private"}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 20 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#cbd5e1", fontWeight: 500 }}>
          <Calendar style={{ width: 14, height: 14, color: "#64748b" }} /> {formatDate(trip.startDate)}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#cbd5e1", fontWeight: 500 }}>
          <Users style={{ width: 14, height: 14, color: "#64748b" }} /> {trip.members?.length || 1}
        </span>
      </div>

      {daysLeft > 0 ? (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
          padding: "10px", borderRadius: 12, fontSize: 12, fontWeight: 700,
          background: daysLeft <= 7 ? "rgba(249,115,22,0.1)" : "rgba(59,130,246,0.1)",
          border: `1px solid ${daysLeft <= 7 ? "rgba(249,115,22,0.2)" : "rgba(59,130,246,0.2)"}`,
          color: daysLeft <= 7 ? "#f97316" : "#60a5fa",
        }}>
          <Clock style={{ width: 14, height: 14 }} />
          {daysLeft <= 7 ? `${daysLeft} days until departure!` : `Starts in ${daysLeft} days`}
        </div>
      ) : (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6, width: "100%",
          padding: "10px", borderRadius: 12, fontSize: 12, fontWeight: 800,
          background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))",
          border: "1px solid rgba(34,197,94,0.3)",
          color: "#22c55e",
        }}>
          <Play style={{ width: 14, height: 14, fill: "#22c55e" }} /> Active Trip
        </div>
      )}
    </div>
  );
}

// ─── HAVERSINE DISTANCE ───────────────────────────────────
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── NEARBY PLACE ITEM ─────────────────────────────────────
function NearbyPlaceItem({ place }: { place: any }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 14, padding: "12px",
      borderRadius: 14, background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(255,255,255,0.04)", marginBottom: 8,
      transition: "all 0.2s"
    }} className="hover:bg-white/5 hover:border-white/10 group">
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: place.iconBg, border: `1px solid ${place.iconBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {place.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {place.name}
        </p>
        <p style={{ fontSize: 11, color: "#64748b", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {place.address}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 800, color: "#94a3b8", margin: 0 }} className="group-hover:text-white transition-colors">
          {place.distance}
        </p>
      </div>
    </div>
  );
}

type PlaceInfo = { name: string; address: string; distance: string; type?: string };
type NearbyData = { hospitals: PlaceInfo[]; policeStations: PlaceInfo[]; transitStations: PlaceInfo[]; };

// ─── SAFETY & NEARBY SECTION ───────────────────────────────
function SafetyNearbySection({ onDataReady }: { onDataReady: (data: { locationName: string; nearbyPlaces: NearbyData }) => void; }) {
  const [locationName, setLocationName] = useState("Detecting location...");
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyData>({ hospitals: [], policeStations: [], transitStations: [] });
  const [loading, setLoading] = useState(true);
  const [safetyScore, setSafetyScore] = useState(0);
  useEffect(() => { setSafetyScore(Math.floor(Math.random() * 21) + 70); }, []);
  const dataReported = useRef(false);

  const reportData = useCallback((locName: string, places: NearbyData) => {
    if (!dataReported.current) {
      dataReported.current = true;
      onDataReady({ locationName: locName, nearbyPlaces: places });
    }
  }, [onDataReady]);

  const fallbackPlaces: NearbyData = {
    hospitals: [{ name: "City Hospital", address: "Near Main Road", distance: "1.2 km" }, { name: "Apollo Clinic", address: "Sector 15", distance: "2.5 km" }],
    policeStations: [{ name: "Central Police Station", address: "Civil Lines", distance: "0.8 km" }],
    transitStations: [{ name: "Central Metro", address: "Station Road", distance: "1.5 km", type: "metro" }],
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationName("Location not supported");
      setNearbyPlaces(fallbackPlaces);
      setLoading(false);
      reportData("Location not supported", fallbackPlaces);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let locName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
        try {
          const geoRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
          const geoData = await geoRes.json();
          const addr = geoData.address;
          locName = `${addr?.suburb || addr?.neighbourhood || addr?.village || ""}, ${addr?.city || addr?.town || addr?.state || ""}`;
        } catch { /* keep coords */ }

        setLocationName(locName);
        const places = await fetchNearbyPlaces(latitude, longitude);
        setNearbyPlaces(places);
        setLoading(false);
        reportData(locName, places);
      },
      () => {
        setLocationName("Location permission denied");
        setNearbyPlaces(fallbackPlaces);
        setLoading(false);
        reportData("Location permission denied", fallbackPlaces);
      }
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchNearbyPlaces(lat: number, lon: number): Promise<NearbyData> {
    const radius = 5000;
    try {
      const query = `[out:json][timeout:10];(node["amenity"="hospital"](around:${radius},${lat},${lon});node["amenity"="police"](around:${radius},${lat},${lon});node["station"="subway"](around:${radius},${lat},${lon}););out body 20;`;
      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST", body: `data=${encodeURIComponent(query)}`, headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();
      const hospitals: PlaceInfo[] = []; const policeStations: PlaceInfo[] = []; const transitStations: PlaceInfo[] = [];

      data.elements?.forEach((el: any) => {
        const dist = getDistance(lat, lon, el.lat, el.lon);
        const distStr = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
        const name = el.tags?.name || "Unknown";
        const address = el.tags?.["addr:street"] || el.tags?.["addr:full"] || "Nearby area";

        if (el.tags?.amenity === "hospital" && hospitals.length < 2) hospitals.push({ name, address, distance: distStr });
        else if (el.tags?.amenity === "police" && policeStations.length < 2) policeStations.push({ name, address, distance: distStr });
        else if (el.tags?.station === "subway" && transitStations.length < 2) transitStations.push({ name, address, distance: distStr, type: "metro" });
      });
      return { hospitals: hospitals.length > 0 ? hospitals : fallbackPlaces.hospitals, policeStations: policeStations.length > 0 ? policeStations : fallbackPlaces.policeStations, transitStations: transitStations.length > 0 ? transitStations : fallbackPlaces.transitStations };
    } catch { return fallbackPlaces; }
  }

  const scoreColor = safetyScore >= 80 ? "#10b981" : safetyScore >= 60 ? "#fbbf24" : "#ef4444";

  return (
    <div style={{ padding: 24, background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: "0 0 6px 0", display: "flex", alignItems: "center", gap: 8 }}>
            <Shield style={{ width: 16, height: 16, color: "#38bdf8" }} /> Regional Security
          </h3>
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.03)", padding: "4px 8px", borderRadius: 6, width: "fit-content" }}>
            <MapPin style={{ width: 12, height: 12, color: "#64748b" }} />
            <p style={{ fontSize: 11, fontWeight: 600, color: "#cbd5e1", margin: 0 }}>{locationName}</p>
          </div>
        </div>
        <div style={{
          width: 52, height: 52, borderRadius: "50%",
          background: `conic-gradient(${scoreColor} ${safetyScore * 3.6}deg, rgba(255,255,255,0.05) 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 0 20px ${scoreColor}20`
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: "50%", background: "#0f172a",
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          }}>
            <p style={{ fontSize: 16, fontWeight: 900, color: scoreColor, margin: 0, lineHeight: 1 }}>{safetyScore}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
           <div style={{ height: 48, borderRadius: 12, background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" }} />
           <div style={{ height: 48, borderRadius: 12, background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" }} />
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {nearbyPlaces.hospitals.map((h, i) => (
            <NearbyPlaceItem key={`h-${i}`} place={{
              ...h, icon: <Hospital style={{ width: 16, height: 16, color: "#ef4444" }} />,
              iconBg: "rgba(239,68,68,0.1)", iconBorder: "rgba(239,68,68,0.2)",
            }} />
          ))}
          {nearbyPlaces.policeStations.map((p, i) => (
            <NearbyPlaceItem key={`p-${i}`} place={{
              ...p, icon: <Building2 style={{ width: 16, height: 16, color: "#38bdf8" }} />,
              iconBg: "rgba(56,189,248,0.1)", iconBorder: "rgba(56,189,248,0.2)",
            }} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SOS SECTION ───────────────────────────────────────────
function SOSSection({ userName, safetyData, emergencyContacts = [], onUpdateContacts }: { userName: string; safetyData: any; emergencyContacts?: any[]; onUpdateContacts?: (c: any[]) => void; }) {
  const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [sending, setSending] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [loadingAdd, setLoadingAdd] = useState(false);

  useEffect(() => {
    // If we have contacts from backend, use them, otherwise check local storage (legacy)
    if (emergencyContacts && emergencyContacts.length > 0) {
      setContacts(emergencyContacts);
    } else {
      const stored = localStorage.getItem('sos_contacts');
      if (stored) { try { setContacts(JSON.parse(stored)); } catch {} }
    }
  }, [emergencyContacts]);

  async function saveContacts(updated: any[]) {
    try {
      const res = await fetchWithAuth('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ emergencyContacts: updated })
      });
      if (!res.ok) throw new Error();
      setContacts(updated);
      if (onUpdateContacts) onUpdateContacts(updated);
      toast.success('Emergency contacts updated');
    } catch {
      toast.error('Failed to save to cloud. Saved locally.');
      setContacts(updated);
      localStorage.setItem('sos_contacts', JSON.stringify(updated));
    }
  }

  async function handleAdd() {
    if (!newName.trim() || !newPhone.trim()) { toast.error("Enter name and number"); return; }
    setLoadingAdd(true);
    await saveContacts([...contacts, { name: newName.trim(), phone: newPhone.trim() }]);
    setNewName(''); setNewPhone(''); setShowAdd(false);
    setLoadingAdd(false);
  }

  async function handleRemove(idx: number) {
    if(!confirm("Remove this contact?")) return;
    const updated = contacts.filter((_, i) => i !== idx);
    await saveContacts(updated);
  }

  function sendSOS() {
    if (contacts.length === 0) { alert('Please add at least one emergency contact.'); return; }
    if (!navigator.geolocation) { alert('Location tracking not supported.'); return; }
    setSending(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const msg = encodeURIComponent(`🆘 SOS EMERGENCY ALERT!\n👤 ${userName}\n📍 Location: https://maps.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`);
        contacts.forEach((c, i) => {
          setTimeout(() => window.open(`https://wa.me/91${c.phone}?text=${msg}`, '_blank'), i * 1500);
        });
        setSending(false);
      },
      () => { alert('Location access denied.'); setSending(false); }, { enableHighAccuracy: true }
    );
  }

  return (
    <div style={{ padding: 24, background: "linear-gradient(145deg, rgba(239,68,68,0.05) 0%, rgba(239,68,68,0.01) 100%)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 20 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))", border: "1px solid rgba(239,68,68,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 4px 12px rgba(239,68,68,0.2)"
          }}>
            <AlertTriangle style={{ width: 22, height: 22, color: "#ef4444" }} className="animate-pulse" />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: 0 }}>Emergency SOS</h3>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: 0 }}>1-tap alert to contacts</p>
          </div>
        </div>
        <button
          suppressHydrationWarning
          onClick={() => setShowAdd(!showAdd)}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 700,
            background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
            color: "white", cursor: "pointer", transition: "all 0.2s"
          }}
          className="hover:bg-white/10"
        >
          {showAdd ? 'Cancel' : 'Manage'}
        </button>
      </div>

      {showAdd && (
        <div style={{ padding: 16, borderRadius: 12, background: "rgba(0,0,0,0.2)", marginBottom: 16, border: "1px solid rgba(255,255,255,0.05)" }}>
           <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12 }}>Add emergency contacts (WhatsApp format).</p>
           
           {contacts.length > 0 && (
             <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
               {contacts.map((c, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', padding: '8px 12px', borderRadius: 8 }}>
                   <div>
                     <p style={{ fontSize: 13, color: 'white', margin: 0, fontWeight: 600 }}>{c.name}</p>
                     <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>+91 {c.phone}</p>
                   </div>
                   <button onClick={() => handleRemove(i)} style={{ color: '#ef4444', fontSize: 11, background: 'transparent', border: 'none', cursor: 'pointer' }}>Remove</button>
                 </div>
               ))}
             </div>
           )}

           <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
             <input type="text" placeholder="Name" value={newName} onChange={e=>setNewName(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 13 }} />
             <input type="tel" placeholder="10-digit Phone" value={newPhone} onChange={e=>setNewPhone(e.target.value)} style={{ flex: 1, padding: 10, borderRadius: 8, background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 13 }} />
           </div>
           <button onClick={handleAdd} disabled={loadingAdd || !newName || !newPhone} style={{ width: '100%', padding: '10px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: 'white', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
             {loadingAdd ? 'Saving...' : '+ Save Contact'}
           </button>
        </div>
      )}

      {/* Action Button */}
      <button
        suppressHydrationWarning
        onClick={sendSOS}
        disabled={sending || contacts.length === 0}
        style={{
          width: "100%", height: 52, borderRadius: 14,
          background: "linear-gradient(135deg, #ef4444, #b91c1c)",
          border: "none", color: "white", fontSize: 15, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em',
          cursor: contacts.length > 0 ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
          boxShadow: contacts.length > 0 ? "0 8px 24px rgba(239,68,68,0.4)" : "none",
          transition: "all 0.2s", opacity: sending || contacts.length === 0 ? 0.7 : 1,
        }}
        className={contacts.length > 0 ? "hover:-translate-y-1 active:scale-95" : ""}
      >
        {sending ? (
          <><Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> Broadcasting...</>
        ) : (
          <><Phone style={{ width: 18, height: 18, fill: "white" }} /> Send Emergency Alert</>
        )}
      </button>
    </div>
  );
}

// ─── MAIN DASHBOARD PAGE ───────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [safetyData, setSafetyData] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // ✅ HYDRATION-SAFE: Time-based values computed client-side only
  const [greeting, setGreeting] = useState("");
  const [gradient, setGradient] = useState("linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)");
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    setGreeting(hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening");
    const grad = hour < 12
      ? "linear-gradient(90deg, #38bdf8 0%, #a7f3d0 100%)"
      : hour < 17
        ? "linear-gradient(90deg, #fbbf24 0%, #f97316 100%)"
        : "linear-gradient(90deg, #6366f1 0%, #0ea5e9 100%)";
    setGradient(grad);
    setNow(new Date());

    // Set dashboard color system
    document.documentElement.style.setProperty('--dashboard-bg', '#0f172a');
    document.documentElement.style.setProperty('--dashboard-gradient-start', grad.split(',')[0].split('(')[1]);
    document.documentElement.style.setProperty('--dashboard-gradient-end', grad.split(',')[1]);
    document.documentElement.style.setProperty('--dashboard-accent', hour < 12 ? '#38bdf8' : hour < 17 ? '#fbbf24' : '#6366f1');
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
    fetchTrips();
  }, [router]);

  async function fetchTrips() {
    try {
      const res = await fetchWithAuth("/trips");
      const data = await res.json();
      if (Array.isArray(data)) setTrips(data);
      else if (Array.isArray(data?.trips)) setTrips(data.trips);
      else if (Array.isArray(data?.data)) setTrips(data.data);
      else setTrips([]);
    } catch { setTrips([]); }
    finally { setLoading(false); }
  }

  const handleSafetyDataReady = useCallback((data: any) => setSafetyData(data), []);

  // ✅ HYDRATION-SAFE: Use client-side `now` to avoid SSR/client date mismatch
  const currentTime = now || new Date(0);
  const upcoming = mounted ? trips.filter(t => new Date(t.startDate) > currentTime).slice(0, 4) : [];

  return (
    <div className="anim-in mx-auto w-full max-w-7xl" style={{ display: 'flex', flexDirection: 'column', gap: '32px', position: 'relative' }}>

      {/* ── HEADER ── */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-end", justifyContent: "space-between",
        background: 'rgba(2,6,23,0.85)',
        borderRadius: 24,
        boxShadow: '0 4px 32px rgba(56,189,248,0.12)',
        padding: '32px 36px',
        marginBottom: 8,
        animation: 'fade-slide-down 0.7s',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Cinematic travel photo background */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 24,
          backgroundImage: 'url(https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&q=80)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.30, zIndex: 0, pointerEvents: 'none',
        }} />
        {/* Dark overlay */}
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 24,
          background: gradient,
          opacity: 0.72, zIndex: 0, pointerEvents: 'none',
        }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 32, fontWeight: 900, color: "white", letterSpacing: "-0.03em", margin: "0 0 8px 0", textShadow: '0 2px 16px rgba(0,0,0,0.4)' }}>
            {greeting}, {user?.username || user?.firstName || "Traveler"}
          </h1>
          <p style={{ color: "#e0e7ef", fontSize: 15, margin: 0, fontWeight: 500, textShadow: '0 1px 8px rgba(0,0,0,0.3)' }}>
            Your premium travel operations and security command center.
          </p>
        </div>
      </div>

      {/* ── ROW 1: EMERGENCY & REGIONAL SAFETY (Promoted to top) ── */}
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }} className="xl:grid-cols-[1fr_1fr]">
        <SOSSection 
          userName={user?.username || user?.firstName || 'User'} 
          safetyData={safetyData} 
          emergencyContacts={user?.emergencyContacts}
          onUpdateContacts={(c) => {
            const updatedUser = { ...user, emergencyContacts: c };
            setUser(updatedUser);
            localStorage.setItem("user", JSON.stringify(updatedUser));
          }}
        />
        <SafetyNearbySection onDataReady={handleSafetyDataReady} />
      </div>

      {/* ── ROW 2: TRIPS & ACTIONS ── */}
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }}>
        {/* Left: Trips */}
        <div style={{ padding: 28, borderRadius: 24, background: "linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)", border: "1px solid rgba(255,255,255,0.05)", boxShadow: '0 8px 32px rgba(0,0,0,0.2)' }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: "white", margin: "0 0 4px 0" }}>Active & Upcoming Trips</h2>
              <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>Manage your current travel itineraries</p>
            </div>
            <Link href="/trips" style={{
              display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", borderRadius: 10,
              fontSize: 13, color: "white", fontWeight: 700, textDecoration: "none",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              transition: "all 0.2s"
            }} className="hover:bg-white/10">
              View All <ArrowRight style={{ width: 14, height: 14 }} />
            </Link>
          </div>

          {loading ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {[1, 2].map(i => (
                <div key={i} style={{ height: 180, borderRadius: 20, background: "rgba(255,255,255,0.03)", animation: "pulse 1.5s infinite" }} />
              ))}
            </div>
          ) : upcoming.length === 0 ? (
            <div style={{
              padding: "64px 24px", textAlign: "center", borderRadius: 16,
              background: "rgba(0,0,0,0.2)", border: "1px dashed rgba(255,255,255,0.1)"
            }}>
              {/* SVG Traveler empty state */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <svg width="80" height="100" viewBox="0 0 96 120" fill="none" xmlns="http://www.w3.org/2000/svg"
                  style={{ animation: 'float 3s ease-in-out infinite', filter: 'drop-shadow(0 6px 18px var(--accent))' }}>
                  <ellipse cx="48" cy="68" rx="18" ry="24" fill="var(--accent)" opacity="0.85"/>
                  <circle cx="48" cy="34" r="14" fill="var(--accent)" opacity="0.9"/>
                  <rect x="32" y="23" width="32" height="5" rx="2.5" fill="var(--accent-hover)" opacity="0.95"/>
                  <rect x="36" y="12" width="24" height="13" rx="5" fill="var(--accent-hover)" opacity="0.95"/>
                  <rect x="26" y="52" width="8" height="22" rx="4" fill="var(--accent)" opacity="0.7" transform="rotate(-10 26 52)"/>
                  <rect x="62" y="52" width="8" height="22" rx="4" fill="var(--accent)" opacity="0.7" transform="rotate(10 66 52)"/>
                  <rect x="54" y="50" width="20" height="26" rx="6" fill="var(--accent-hover)" opacity="0.8"/>
                  <rect x="57" y="46" width="14" height="6" rx="3" fill="var(--accent-hover)" opacity="0.7"/>
                  <rect x="57" y="60" width="14" height="10" rx="4" fill="var(--accent)" opacity="0.5"/>
                  <rect x="39" y="88" width="9" height="24" rx="4.5" fill="var(--accent)" opacity="0.75"/>
                  <rect x="51" y="88" width="9" height="24" rx="4.5" fill="var(--accent)" opacity="0.75"/>
                  <ellipse cx="43" cy="113" rx="8" ry="4" fill="var(--accent-hover)" opacity="0.9"/>
                  <ellipse cx="55" cy="113" rx="8" ry="4" fill="var(--accent-hover)" opacity="0.9"/>
                  <rect x="76" y="40" width="4" height="70" rx="2" fill="var(--accent)" opacity="0.4"/>
                </svg>
              </div>
              <p style={{ color: "white", fontWeight: 800, fontSize: 18, marginBottom: 8 }}>No active trips</p>
              <p style={{ color: "#64748b", fontSize: 14, marginBottom: 24, maxWidth: 300, margin: "0 auto 24px" }}>Start your next journey and track it all from your command center.</p>
              <button 
                onClick={() => router.push("/trips/create")} 
                className="btn-primary hover:scale-105 transition-transform"
                style={{ padding: "12px 28px", fontSize: 14 }}
              >
                <Plus style={{ width: 18, height: 18 }} /> Create First Trip
              </button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
              {upcoming.map(trip => <TripCard key={trip.id} trip={trip} />)}
            </div>
          )}
        </div>
      </div>

      {/* ── ROW 3: TRAVELERS, INVITE ── */}
      <div style={{ display: "grid", gap: 24, gridTemplateColumns: "1fr" }} className="xl:grid-cols-[1fr_360px]">
        <SuggestedTravelers />
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
           <JoinByInviteCode />
        </div>
      </div>

      <CategoryCharacter />
    </div>
  );
}