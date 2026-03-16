'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  Sparkles, MapPin, Compass, ArrowLeft, Loader2, 
  Star, Info, Camera, Music, Coffee, Ghost, Clock, Users
} from 'lucide-react';
import { API_BASE_URL, getAccessToken } from '@/app/lib/api';
import toast from 'react-hot-toast';

interface Gem {
  name: string;
  description: string;
  vibe: string;
  crowdLevel: string;
  bestTime: string;
  travelTip: string;
  coordinates?: { lat: number; lng: number };
}

interface ExplorationData {
  city: string;
  tagline: string;
  gems: Gem[];
}

export default function HiddenGemsPage() {
  const { city } = useParams();
  const router = useRouter();
  const [data, setData] = useState<ExplorationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (city) fetchGems();
  }, [city]);

  async function fetchGems() {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/trips/explore/hidden-gems/${city}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      } else {
        toast.error('Failed to load gems');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
        <Loader2 style={{ width: 48, height: 48, animation: 'spin 2s linear infinite', color: '#f59e0b', marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>Scanning {city} for secrets...</h2>
        <p style={{ opacity: 0.6 }}>Our AI scouts are digging deep into travel lore.</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
      <button 
        onClick={() => router.back()}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: 24, fontSize: 14 }}
        className="hover:text-white transition-colors"
      >
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back
      </button>

      <div style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 800, marginBottom: 16 }}>
          <Sparkles style={{ width: 14, height: 14 }} /> AI EXPLORATION ENGINE
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 950, color: 'white', letterSpacing: '-0.04em', marginBottom: 12 }}>{data.city} Secrets</h1>
        <p style={{ fontSize: 20, color: '#94a3b8', fontStyle: 'italic', maxWidth: 600, margin: '0 auto' }}>"{data.tagline}"</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(450px, 1fr))', gap: 24 }}>
        {data.gems.map((gem, i) => (
          <div key={i} style={{ 
            background: 'rgba(255,255,255,0.02)', 
            backdropFilter: 'blur(20px)',
            borderRadius: 24, padding: 32, border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex', flexDirection: 'column', gap: 16,
            transition: 'all 0.3s'
          }} className="hover:-translate-y-2 hover:bg-white/[0.04] hover:border-orange-500/30">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: 'white', margin: 0 }}>{gem.name}</h3>
              <span style={{ 
                background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 10px', 
                borderRadius: 10, fontSize: 11, fontWeight: 800, textTransform: 'uppercase' 
              }}>{gem.vibe}</span>
            </div>
            
            <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{gem.description}</p>
            
            <div style={{ padding: 16, borderRadius: 16, background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.1)' }}>
              <p style={{ fontSize: 13, color: '#f59e0b', fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles style={{ width: 14, height: 14 }} /> Expert Tip
              </p>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, fontStyle: 'italic' }}>{gem.travelTip}</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#64748b' }}>
                <Clock style={{ width: 14, height: 14 }} /> {gem.bestTime}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: gem.crowdLevel === 'Low' ? '#22c55e' : gem.crowdLevel === 'Moderate' ? '#f59e0b' : '#ef4444', fontWeight: 700 }}>
                <Users style={{ width: 14, height: 14 }} /> {gem.crowdLevel} Density
              </div>
              <button 
                className="hover:text-white transition-colors"
                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f59e0b', fontSize: 13, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <MapPin style={{ width: 14, height: 14 }} /> View on Map
              </button>
            </div>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: 64, textAlign: 'center', padding: 48, borderRadius: 40, 
        background: 'linear-gradient(135deg, rgba(245,158,11,0.05), rgba(59,130,246,0.05))',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <h2 style={{ fontSize: 32, fontWeight: 900, color: 'white', marginBottom: 16 }}>Found something intriguing?</h2>
        <p style={{ color: '#94a3b8', marginBottom: 32, maxWidth: 500, margin: '0 auto 32px' }}>
          Add these hidden gems to your itinerary or start a specialized exploration trip with fellow adventurers.
        </p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
          <button 
            onClick={() => router.push('/trips/create')}
            style={{ padding: '16px 32px', borderRadius: 16, background: '#f59e0b', color: 'white', fontWeight: 800, border: 'none', cursor: 'pointer' }}
          >
            Start Exploration Trip
          </button>
          <button 
            onClick={() => router.back()}
            style={{ padding: '16px 32px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', color: 'white', fontWeight: 700, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' }}
          >
            Back to Guide
          </button>
        </div>
      </div>
    </div>
  );
}
