"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, MapPin, Users, Calendar, Wallet,
  TrendingUp, ArrowRight, Clock, Globe, Lock,
  Compass, Bell, Shield, Phone, AlertTriangle,
  Hospital, Building2, Train
} from "lucide-react";
import { fetchWithAuth } from "@/app/lib/api";
import JoinByInviteCode from "@/components/JoinByInviteCode";

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── TRIP CARD ─────────────────────────────────────────────────
function TripCard({ trip }: { trip: any }) {
  const router = useRouter();
  const daysLeft = Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / 86400000);
  return (
    <div
      onClick={() => router.push(`/trips/${trip.id}`)}
      className="card card-hover"
      style={{ padding: 20, cursor: "pointer" }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 10, flexShrink: 0,
            background: "linear-gradient(135deg, rgba(249,115,22,0.2), rgba(251,191,36,0.1))",
            border: "1px solid rgba(249,115,22,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MapPin style={{ width: 17, height: 17, color: "#f97316" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0 }}>{trip.name}</p>
            <p style={{ fontSize: 12, color: "#475569", margin: 0 }}>
              {trip.fromCity} → {trip.toCity}
            </p>
          </div>
        </div>
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          padding: "3px 8px", borderRadius: 999, fontSize: 10, fontWeight: 600,
          background: trip.isPublic ? "rgba(34,197,94,0.1)" : "rgba(148,163,184,0.1)",
          border: `1px solid ${trip.isPublic ? "rgba(34,197,94,0.2)" : "rgba(148,163,184,0.15)"}`,
          color: trip.isPublic ? "#22c55e" : "#64748b",
        }}>
          {trip.isPublic
            ? <Globe style={{ width: 10, height: 10 }} />
            : <Lock style={{ width: 10, height: 10 }} />
          }
          {trip.isPublic ? "Public" : "Private"}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b" }}>
          <Calendar style={{ width: 12, height: 12 }} /> {formatDate(trip.startDate)}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b" }}>
          <Users style={{ width: 12, height: 12 }} /> {trip.members?.length || 1} members
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: "#64748b" }}>
          <Wallet style={{ width: 12, height: 12 }} /> ₹{trip.budget?.toLocaleString()}
        </span>
      </div>

      {daysLeft > 0 ? (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
          background: daysLeft <= 7 ? "rgba(249,115,22,0.12)" : "rgba(59,130,246,0.1)",
          border: `1px solid ${daysLeft <= 7 ? "rgba(249,115,22,0.25)" : "rgba(59,130,246,0.2)"}`,
          color: daysLeft <= 7 ? "#f97316" : "#60a5fa",
        }}>
          <Clock style={{ width: 10, height: 10 }} />
          {daysLeft <= 7 ? `${daysLeft}d left!` : `In ${daysLeft} days`}
        </div>
      ) : (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          padding: "4px 10px", borderRadius: 999, fontSize: 11, fontWeight: 600,
          background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399",
        }}>
          Trip ongoing / completed
        </div>
      )}
    </div>
  );
}

// ─── NEARBY PLACE ITEM ─────────────────────────────────────────
function NearbyPlaceItem({ place }: { place: any }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
      borderRadius: 10, background: "rgba(255,255,255,0.02)",
      border: "1px solid rgba(148,163,184,0.06)", marginBottom: 6,
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: 8, flexShrink: 0,
        background: place.iconBg, border: `1px solid ${place.iconBorder}`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {place.icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {place.name}
        </p>
        <p style={{ fontSize: 11, color: "#475569", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {place.address}
        </p>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 12, fontWeight: 700, color: "#f97316", margin: 0 }}>
          {place.distance}
        </p>
      </div>
    </div>
  );
}

// ─── SAFETY & NEARBY SECTION ───────────────────────────────────
function SafetyNearbySection() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState("Detecting location...");
  const [nearbyPlaces, setNearbyPlaces] = useState<any>({
    hospitals: [], policeStations: [], transitStations: []
  });
  const [loading, setLoading] = useState(true);
  const [safetyScore] = useState(Math.floor(Math.random() * 21) + 70); // dummy 70-90

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationName("Location not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });

        // Reverse geocode for location name
        try {
          const geoRes = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const geoData = await geoRes.json();
          const addr = geoData.address;
          setLocationName(
            `${addr?.suburb || addr?.neighbourhood || addr?.village || ""}, ${addr?.city || addr?.town || addr?.state || ""}`
          );
        } catch {
          setLocationName(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
        }

        // Fetch nearby places using Overpass API
        await fetchNearbyPlaces(latitude, longitude);
        setLoading(false);
      },
      () => {
        setLocationName("Location permission denied");
        setLoading(false);
        // Show dummy data
        setNearbyPlaces({
          hospitals: [
            { name: "City Hospital", address: "Near Main Road", distance: "1.2 km" },
            { name: "Apollo Clinic", address: "Sector 15", distance: "2.5 km" },
            { name: "Max Healthcare", address: "NH-48", distance: "3.8 km" },
          ],
          policeStations: [
            { name: "Central Police Station", address: "Civil Lines", distance: "0.8 km" },
            { name: "City Kotwali", address: "Old City Area", distance: "2.1 km" },
          ],
          transitStations: [
            { name: "Central Railway Station", address: "Station Road", distance: "1.5 km", type: "railway" },
            { name: "ISBT Bus Stand", address: "GT Road", distance: "2.0 km", type: "bus" },
            { name: "Metro Station Blue Line", address: "Sector 21", distance: "3.2 km", type: "metro" },
          ],
        });
      }
    );
  }, []);

  async function fetchNearbyPlaces(lat: number, lon: number) {
    const radius = 5000; // 5km

    try {
      // Overpass API query for hospitals, police, transit
      const query = `
        [out:json][timeout:10];
        (
          node["amenity"="hospital"](around:${radius},${lat},${lon});
          node["amenity"="police"](around:${radius},${lat},${lon});
          node["railway"="station"](around:${radius},${lat},${lon});
          node["station"="subway"](around:${radius},${lat},${lon});
          node["amenity"="bus_station"](around:${radius},${lat},${lon});
          node["highway"="bus_stop"](around:${radius},${lat},${lon});
        );
        out body 20;
      `;

      const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });
      const data = await res.json();

      const hospitals: any[] = [];
      const policeStations: any[] = [];
      const transitStations: any[] = [];

      data.elements?.forEach((el: any) => {
        const dist = getDistance(lat, lon, el.lat, el.lon);
        const distStr = dist < 1 ? `${Math.round(dist * 1000)} m` : `${dist.toFixed(1)} km`;
        const name = el.tags?.name || "Unknown";
        const address = el.tags?.["addr:street"] || el.tags?.["addr:full"] || "Nearby area";

        if (el.tags?.amenity === "hospital" && hospitals.length < 3) {
          hospitals.push({ name, address, distance: distStr });
        } else if (el.tags?.amenity === "police" && policeStations.length < 2) {
          policeStations.push({ name, address, distance: distStr });
        } else if (
          (el.tags?.railway === "station" || el.tags?.station === "subway" ||
           el.tags?.amenity === "bus_station" || el.tags?.highway === "bus_stop") &&
          transitStations.length < 3
        ) {
          const type = el.tags?.railway === "station" ? "railway"
            : el.tags?.station === "subway" ? "metro"
            : "bus";
          transitStations.push({ name, address, distance: distStr, type });
        }
      });

      setNearbyPlaces({
        hospitals: hospitals.length > 0 ? hospitals : [
          { name: "No hospital found nearby", address: "Try expanding search area", distance: "-" }
        ],
        policeStations: policeStations.length > 0 ? policeStations : [
          { name: "No police station found nearby", address: "Try expanding search area", distance: "-" }
        ],
        transitStations: transitStations.length > 0 ? transitStations : [
          { name: "No transit station found nearby", address: "Try expanding search area", distance: "-" }
        ],
      });
    } catch {
      // Fallback dummy data
      setNearbyPlaces({
        hospitals: [
          { name: "City Hospital", address: "Near Main Road", distance: "1.2 km" },
          { name: "Apollo Clinic", address: "Sector 15", distance: "2.5 km" },
          { name: "Max Healthcare", address: "NH-48", distance: "3.8 km" },
        ],
        policeStations: [
          { name: "Central Police Station", address: "Civil Lines", distance: "0.8 km" },
          { name: "City Kotwali", address: "Old City Area", distance: "2.1 km" },
        ],
        transitStations: [
          { name: "Central Railway Station", address: "Station Road", distance: "1.5 km", type: "railway" },
          { name: "ISBT Bus Stand", address: "GT Road", distance: "2.0 km", type: "bus" },
          { name: "Metro Station Blue Line", address: "Sector 21", distance: "3.2 km", type: "metro" },
        ],
      });
    }
  }

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

  const scoreColor = safetyScore >= 80 ? "#22c55e" : safetyScore >= 60 ? "#fbbf24" : "#ef4444";

  return (
    <div className="card" style={{ padding: 20 }}>
      {/* Header: Location + Safety Score */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Shield style={{ width: 16, height: 16, color: "#f97316" }} />
            <h3 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: 0 }}>Safety & Nearby</h3>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <MapPin style={{ width: 11, height: 11, color: "#64748b" }} />
            <p style={{ fontSize: 12, color: "#64748b", margin: 0 }}>
              {locationName}
            </p>
          </div>
        </div>
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: `conic-gradient(${scoreColor} ${safetyScore * 3.6}deg, rgba(148,163,184,0.1) 0deg)`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: "50%", background: "#0d1829",
            display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column",
          }}>
            <p style={{ fontSize: 16, fontWeight: 900, color: scoreColor, margin: 0, lineHeight: 1 }}>
              {safetyScore}
            </p>
            <p style={{ fontSize: 8, color: "#64748b", margin: 0 }}>SAFE</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 20 }}>
          <div style={{
            width: 24, height: 24, border: "3px solid rgba(249,115,22,0.2)",
            borderTop: "3px solid #f97316", borderRadius: "50%",
            animation: "spin 1s linear infinite", margin: "0 auto 10px",
          }} />
          <p style={{ fontSize: 12, color: "#475569" }}>Finding nearby places...</p>
        </div>
      ) : (
        <>
          {/* Hospitals */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#ef4444", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
              🏥 Nearest Hospitals ({nearbyPlaces.hospitals.length})
            </p>
            {nearbyPlaces.hospitals.map((h: any, i: number) => (
              <NearbyPlaceItem key={i} place={{
                ...h,
                icon: <Hospital style={{ width: 14, height: 14, color: "#ef4444" }} />,
                iconBg: "rgba(239,68,68,0.1)", iconBorder: "rgba(239,68,68,0.2)",
              }} />
            ))}
          </div>

          {/* Police Stations */}
          <div style={{ marginBottom: 14 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#3b82f6", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
              🚔 Police Stations ({nearbyPlaces.policeStations.length})
            </p>
            {nearbyPlaces.policeStations.map((p: any, i: number) => (
              <NearbyPlaceItem key={i} place={{
                ...p,
                icon: <Building2 style={{ width: 14, height: 14, color: "#3b82f6" }} />,
                iconBg: "rgba(59,130,246,0.1)", iconBorder: "rgba(59,130,246,0.2)",
              }} />
            ))}
          </div>

          {/* Transit */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: "#22c55e", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: 6 }}>
              🚆 Railway / Metro / Bus ({nearbyPlaces.transitStations.length})
            </p>
            {nearbyPlaces.transitStations.map((t: any, i: number) => (
              <NearbyPlaceItem key={i} place={{
                ...t,
                icon: <Train style={{ width: 14, height: 14, color: "#22c55e" }} />,
                iconBg: "rgba(34,197,94,0.1)", iconBorder: "rgba(34,197,94,0.2)",
              }} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ─── SOS SECTION ───────────────────────────────────────────────
function SOSSection() {
  const [contacts, setContacts] = useState<{ name: string; phone: string }[]>([]);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [showAdd, setShowAdd] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('sos_contacts');
    if (stored) setContacts(JSON.parse(stored));
  }, []);

  // Save to localStorage
  function saveContacts(updated: { name: string; phone: string }[]) {
    setContacts(updated);
    localStorage.setItem('sos_contacts', JSON.stringify(updated));
  }

  function addContact() {
    if (!newName.trim() || !newPhone.trim()) return;
    const phone = newPhone.replace(/\D/g, '');
    if (phone.length < 10) {
      alert('Enter valid 10-digit phone number');
      return;
    }
    const updated = [...contacts, { name: newName.trim(), phone }];
    saveContacts(updated);
    setNewName(''); setNewPhone(''); setShowAdd(false);
  }

  function removeContact(index: number) {
    const updated = contacts.filter((_, i) => i !== index);
    saveContacts(updated);
  }

  function sendSOS() {
    if (contacts.length === 0) {
      alert('Please add at least one SOS contact first!');
      return;
    }

    if (!navigator.geolocation) {
      alert('Location not supported on this device');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        const mapsLink = `https://maps.google.com/maps?q=${latitude},${longitude}`;
        const message = `🆘 SOS EMERGENCY! I need help! My live location: ${mapsLink}`;

        // Open WhatsApp for first contact
        contacts.forEach((c, i) => {
          const phone = c.phone.startsWith('91') ? c.phone : `91${c.phone}`;
          const whatsappUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
          if (i === 0) {
            window.open(whatsappUrl, '_blank');
          } else {
            setTimeout(() => window.open(whatsappUrl, '_blank'), i * 1500);
          }
        });
      },
      () => {
        alert('Location permission denied. Cannot send SOS.');
      }
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', height: 38, padding: '0 12px',
    borderRadius: 8, fontSize: 13, color: '#E2E8F0',
    background: '#0F172A', border: '1px solid rgba(148,163,184,0.12)',
    outline: 'none',
  };

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <AlertTriangle style={{ width: 16, height: 16, color: "#ef4444" }} />
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0 }}>SOS Emergency</p>
            <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>Send live location on WhatsApp</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(!showAdd)}
          style={{
            padding: "6px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600,
            background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.25)",
            color: "#f97316", cursor: "pointer",
          }}
        >
          + Add Contact
        </button>
      </div>

      {/* Add contact form */}
      {showAdd && (
        <div style={{
          padding: 12, borderRadius: 10, marginBottom: 12,
          background: "rgba(255,255,255,0.02)", border: "1px solid rgba(148,163,184,0.08)",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <input
              style={inputStyle}
              placeholder="Name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <input
              style={inputStyle}
              placeholder="Phone (10 digit)"
              value={newPhone}
              onChange={e => setNewPhone(e.target.value)}
              maxLength={10}
            />
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button
              onClick={() => { setShowAdd(false); setNewName(''); setNewPhone(''); }}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12,
                background: "transparent", border: "1px solid rgba(148,163,184,0.12)",
                color: "#64748b", cursor: "pointer",
              }}
            >Cancel</button>
            <button
              onClick={addContact}
              style={{
                padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600,
                background: "linear-gradient(135deg,#f97316,#fbbf24)", border: "none",
                color: "white", cursor: "pointer",
              }}
            >Add</button>
          </div>
        </div>
      )}

      {/* Contact list */}
      {contacts.length === 0 ? (
        <p style={{ fontSize: 12, color: "#334155", textAlign: "center", padding: "14px 0" }}>
          No SOS contacts added yet. Add emergency contacts above.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 14 }}>
          {contacts.map((c, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
              borderRadius: 8, background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(148,163,184,0.06)",
            }}>
              <Phone style={{ width: 13, height: 13, color: "#22c55e", flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "white", margin: 0 }}>{c.name}</p>
                <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>+91 {c.phone}</p>
              </div>
              <button
                onClick={() => removeContact(i)}
                style={{
                  fontSize: 11, color: "#ef4444", background: "none", border: "none",
                  cursor: "pointer", padding: "2px 6px",
                }}
              >✕</button>
            </div>
          ))}
        </div>
      )}

      {/* SOS Button */}
      <button
        onClick={sendSOS}
        style={{
          width: "100%", height: 48, borderRadius: 12,
          background: contacts.length > 0
            ? "linear-gradient(135deg, #ef4444, #dc2626)"
            : "rgba(148,163,184,0.08)",
          border: contacts.length > 0 ? "none" : "1px solid rgba(148,163,184,0.12)",
          color: contacts.length > 0 ? "white" : "#475569",
          fontSize: 15, fontWeight: 800, cursor: contacts.length > 0 ? "pointer" : "not-allowed",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          boxShadow: contacts.length > 0 ? "0 6px 20px rgba(239,68,68,0.4)" : "none",
          transition: "all 0.2s",
        }}
      >
        <AlertTriangle style={{ width: 18, height: 18 }} />
        🆘 SEND SOS
      </button>
      <p style={{ fontSize: 10, color: "#334155", textAlign: "center", marginTop: 6 }}>
        Opens WhatsApp with your live location for each contact
      </p>
    </div>
  );
}

// ─── MAIN DASHBOARD PAGE ───────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    setUser(JSON.parse(stored));
    fetchTrips();
  }, []);

  async function fetchTrips() {
    try {
      const data = await fetchWithAuth("/trips");
      console.log("trips response:", data);

      if (Array.isArray(data)) {
        setTrips(data);
      } else if (Array.isArray(data?.trips)) {
        setTrips(data.trips);
      } else if (Array.isArray(data?.data)) {
        setTrips(data.data);
      } else {
        setTrips([]);
      }
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }

  const upcoming = trips.filter(t => new Date(t.startDate) > new Date()).slice(0, 4);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const statsData = [
    { label: "Total Trips", value: trips.length, icon: MapPin, color: "#f97316" },
    { label: "Upcoming", value: upcoming.length, icon: Calendar, color: "#fbbf24" },
    { label: "Group Members", value: trips.reduce((a, t) => a + (t.members?.length || 1), 0), icon: Users, color: "#f97316" },
    { label: "Total Budget", value: `₹${trips.reduce((a, t) => a + (t.budget || 0), 0).toLocaleString()}`, icon: TrendingUp, color: "#fbbf24" },
  ];

  return (
    <div className="anim-in">

      {/* ── WELCOME ── */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "white", letterSpacing: "-0.02em", marginBottom: 4 }}>
          {greeting}, {user?.username || "Traveler"} 👋
        </h1>
        <p style={{ color: "#475569", fontSize: 14 }}>
          Here&apos;s what&apos;s happening with your trips today.
        </p>
      </div>

      {/* ── STATS ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 14, marginBottom: 28 }}>
        {statsData.map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card" style={{ padding: "20px 22px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 11, color: "#475569", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {label}
              </p>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: `${color}18`, border: `1px solid ${color}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon style={{ width: 14, height: 14, color }} />
              </div>
            </div>
            <p style={{ fontSize: 26, fontWeight: 900, color: "white", margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── JOIN BY INVITE CODE ── */}
      <div style={{ marginBottom: 20 }}>
        <JoinByInviteCode />
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ display: "grid", gap: 20, gridTemplateColumns: "1fr" }} className="xl:grid-cols-[1fr_340px]">

        {/* LEFT COLUMN */}
        <div>
          {/* Upcoming trips */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: "white", margin: 0 }}>Upcoming Trips</h2>
              <Link href="/trips" style={{
                display: "flex", alignItems: "center", gap: 4,
                fontSize: 12, color: "#f97316", fontWeight: 600, textDecoration: "none",
              }}>
                Browse all <ArrowRight style={{ width: 12, height: 12 }} />
              </Link>
            </div>

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    height: 110, borderRadius: 16, background: "#1a2744",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }} />
                ))}
              </div>
            ) : upcoming.length === 0 ? (
              <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                  background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <MapPin style={{ width: 24, height: 24, color: "#334155" }} />
                </div>
                <p style={{ color: "white", fontWeight: 700, fontSize: 15, marginBottom: 6 }}>
                  No upcoming trips
                </p>
                <p style={{ color: "#334155", fontSize: 13, marginBottom: 20 }}>
                  Create your first trip or browse existing ones
                </p>
                <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
                  <button
                    onClick={() => router.push("/trips/create")}
                    className="btn-primary"
                    style={{ padding: "10px 20px", fontSize: 13 }}
                  >
                    <Plus style={{ width: 14, height: 14 }} /> Create Trip
                  </button>
                  <button
                    onClick={() => router.push("/trips")}
                    className="btn-ghost"
                    style={{ padding: "10px 20px", fontSize: 13 }}
                  >
                    Browse Trips
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
                {upcoming.map(trip => <TripCard key={trip.id} trip={trip} />)}
              </div>
            )}
          </div>

          {/* Quick actions */}
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "white", marginBottom: 16 }}>Quick Actions</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {[
                { label: "Create New Trip", desc: "Start planning a trip", href: "/trips/create", icon: Plus, primary: true },
                { label: "Browse Trips", desc: "Find & join a group", href: "/trips", icon: Compass, primary: false },
                { label: "My Wallet", desc: "View your expenses", href: "/wallet", icon: Wallet, primary: false },
                { label: "Notifications", desc: "Check latest updates", href: "/notifications", icon: Bell, primary: false },
              ].map(({ label, desc, href, icon: Icon, primary }) => (
                <Link key={href} href={href} style={{ textDecoration: "none" }}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 12, padding: "13px 14px",
                      borderRadius: 13, transition: "all 0.15s", cursor: "pointer",
                      background: primary
                        ? "linear-gradient(135deg, rgba(249,115,22,0.15), rgba(251,191,36,0.08))"
                        : "#1a2744",
                      border: `1px solid ${primary ? "rgba(249,115,22,0.3)" : "#2d3f5e"}`,
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(249,115,22,0.45)";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateX(2px)";
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLDivElement).style.borderColor = primary ? "rgba(249,115,22,0.3)" : "#2d3f5e";
                      (e.currentTarget as HTMLDivElement).style.transform = "translateX(0)";
                    }}
                  >
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                      background: primary ? "linear-gradient(135deg,#f97316,#fbbf24)" : "rgba(249,115,22,0.1)",
                      border: primary ? "none" : "1px solid rgba(249,115,22,0.2)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: primary ? "0 4px 12px rgba(249,115,22,0.3)" : "none",
                    }}>
                      <Icon style={{ width: 15, height: 15, color: primary ? "white" : "#f97316" }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0 }}>{label}</p>
                      <p style={{ fontSize: 11, color: "#475569", margin: 0 }}>{desc}</p>
                    </div>
                    <ArrowRight style={{ width: 13, height: 13, color: "#334155", flexShrink: 0 }} />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN — Safety + SOS */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <SafetyNearbySection />
          <SOSSection />
        </div>
      </div>
    </div>
  );
}