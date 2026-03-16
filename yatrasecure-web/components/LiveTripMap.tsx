'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Users, Radar, Navigation } from 'lucide-react';
import 'leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css';
import 'leaflet-defaulticon-compatibility';

// ─── Types ─────────────────────────────────────────────────────────────────
interface MemberLocation {
  userId: string;
  username: string;
  lat: number;
  lng: number;
  profileImage?: string;
}

interface LiveTripMapProps {
  tripId: string;
  toCity: string;
  members: any[];
}

// ─── Custom Avatar Icon ──────────────────────────────────────────────────
function createAvatarIcon(username: string, imageUrl?: string, color: string = '#f97316') {
  const avatarUrl = imageUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`;
  
  return L.divIcon({
    className: '',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <div style="
          width: 44px; height: 44px; border-radius: 50%; 
          background: ${color}; padding: 3px;
          box-shadow: 0 4px 15px rgba(0,0,0,0.5);
          animation: map-pulse 2s infinite ease-in-out;
        ">
          <img src="${avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover; border: 2px solid white;" />
        </div>
        <div style="
          background: rgba(15,23,42,0.9); color: white; border: 1px solid rgba(255,255,255,0.1);
          padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 800;
          margin-top: 4px; white-space: nowrap; box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        ">
          ${username}
        </div>
        <style>
          @keyframes map-pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0px ${color}66; }
            50% { transform: scale(1.05); box-shadow: 0 0 0 10px ${color}00; }
            100% { transform: scale(1); box-shadow: 0 0 0 0px ${color}00; }
          }
        </style>
      </div>
    `,
    iconSize: [44, 60],
    iconAnchor: [22, 44],
    popupAnchor: [0, -44],
  });
}

// ─── Auto-fit bounds ─────────────────────────────────────────────────────────
function FitBounds({ locations, center }: { locations: MemberLocation[], center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (locations.length === 0) return;
    const bounds = L.latLngBounds(locations.map((p) => [p.lat, p.lng]));
    bounds.extend(center);
    map.fitBounds(bounds, { padding: [100, 100], maxZoom: 13 });
  }, [locations, center, map]);
  return null;
}

// ─── Geocode via Nominatim ───────────────────────────────────────────────────
async function geocode(place: string): Promise<[number, number] | null> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place + ', India')}&format=json&limit=1`
    );
    const data = await res.json();
    if (data?.[0]) return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch (e) {
    console.error('Geocode error:', e);
  }
  return null;
}

export default function LiveTripMap({ tripId, toCity, members }: LiveTripMapProps) {
  const [destCoords, setDestCoords] = useState<[number, number] | null>(null);
  const [memberLocs, setMemberLocs] = useState<MemberLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const coords = await geocode(toCity);
      if (coords) {
        setDestCoords(coords);
        
        // Simulate live locations around the destination
        const locs = members.slice(0, 5).map((m, i) => {
          const user = m.user || m;
          return {
            userId: user.id,
            username: user.username,
            profileImage: user.profileImage,
            lat: coords[0] + (Math.random() - 0.5) * 0.05,
            lng: coords[1] + (Math.random() - 0.5) * 0.05,
          };
        });
        setMemberLocs(locs);
      }
      setLoading(false);
    })();
  }, [toCity, members]);

  if (loading || !destCoords) {
    return (
      <div style={{
        height: 400, borderRadius: 24, background: 'rgba(15,23,42,0.8)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden'
      }}>
        <Radar className="anim-pulse" style={{ width: 48, height: 48, color: '#f97316', marginBottom: 16 }} />
        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>Initializing Live Radar…</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: 500, borderRadius: 32, overflow: 'hidden', border: '1px solid rgba(148,163,184,0.2)', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.5)' }}>
      
      {/* Radar Overlay Controls */}
      <div style={{
        position: 'absolute', top: 20, right: 20, zIndex: 1000,
        display: 'flex', flexDirection: 'column', gap: 10
      }}>
        <div style={{
          background: 'rgba(15,23,42,0.9)', backdropFilter: 'blur(10px)',
          padding: '12px 16px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 10px 20px rgba(0,0,0,0.3)'
        }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
          <div>
            <div style={{ fontSize: 10, color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>Live Signal</div>
            <div style={{ fontSize: 13, color: 'white', fontWeight: 900 }}>{memberLocs.length} Active Members</div>
          </div>
        </div>
      </div>

      <MapContainer
        center={destCoords}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
        />

        <FitBounds locations={memberLocs} center={destCoords} />

        {/* Destination Marker */}
        <Marker position={destCoords} icon={L.divIcon({
          className: '',
          html: `
            <div style="background: #f97316; width: 24, height: 24, border-radius: 50%; border: 4px solid white; box-shadow: 0 0 20px #f97316;"></div>
          `
        })}>
          <Popup>
            <div style={{ color: '#0f172a', fontWeight: 700 }}>{toCity} Destination</div>
          </Popup>
        </Marker>

        {/* Destination Radiance Circle */}
        <Circle 
          center={destCoords} 
          radius={2000} 
          pathOptions={{ color: '#f97316', fillColor: '#f97316', fillOpacity: 0.1, weight: 1, dashArray: '5, 5' }} 
        />

        {/* Member Markers */}
        {memberLocs.map((loc) => (
          <Marker 
            key={loc.userId} 
            position={[loc.lat, loc.lng]} 
            icon={createAvatarIcon(loc.username, loc.profileImage)}
          >
            <Popup>
              <div style={{ minWidth: 120 }}>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>{loc.username}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>Active 2m ago</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Footer Meta */}
      <div style={{
        position: 'absolute', bottom: 20, left: 20, right: 20, zIndex: 1000,
        background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(10px)',
        padding: '12px 20px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Radar style={{ width: 16, height: 16, color: '#f97316' }} />
          <span style={{ fontSize: 12, color: 'white', fontWeight: 700 }}>Real-time location sharing active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Navigation style={{ width: 12, height: 12, color: '#64748b' }} />
          <span style={{ fontSize: 10, color: '#64748b', fontWeight: 800 }}>VIBRANT MAP ENGINE v2.0</span>
        </div>
      </div>
    </div>
  );
}
