'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { 
  MapPin, Calendar, Star, Info, Shield, 
  Compass, ArrowLeft, Loader2, Sparkles, 
  Camera, Landmark, Map as MapIcon, Wallet
} from 'lucide-react';
import { API_BASE_URL, getAccessToken } from '@/app/lib/api';
import toast from 'react-hot-toast';

interface GuideData {
  city: string;
  description: string;
  bestTimeToVisit: string;
  topAttractions: { name: string; description: string }[];
  localSecrets: { name: string; description: string }[];
  itinerarySummary: string;
  safetyTips: string[];
  budgetLevel: string;
}

export default function DestinationGuidePage() {
  const { city } = useParams();
  const router = useRouter();
  const [guide, setGuide] = useState<GuideData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (city) fetchGuide();
  }, [city]);

  async function fetchGuide() {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/trips/explore/guide/${city}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setGuide(data);
      } else {
        toast.error('Failed to load guide');
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
        <Loader2 style={{ width: 48, height: 48, animation: 'spin 2s linear infinite', color: '#3b82f6', marginBottom: 20 }} />
        <h2 style={{ fontSize: 24, fontWeight: 800, color: 'white' }}>YatraSecure AI is scouting {city}...</h2>
        <p style={{ opacity: 0.6 }}>Gathering top attractions, local secrets, and travel tips.</p>
      </div>
    );
  }

  if (!guide) return null;

  const cardStyle = {
    background: 'rgba(15,23,42,0.6)',
    backdropFilter: 'blur(12px)',
    borderRadius: 24,
    border: '1px solid rgba(255,255,255,0.05)',
    padding: 32,
    marginBottom: 24
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <button 
        onClick={() => router.back()}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', marginBottom: 24, fontSize: 14 }}
        className="hover:text-white transition-colors"
      >
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back
      </button>

      <div style={{ marginBottom: 48 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ 
            background: 'rgba(59,130,246,0.1)', color: '#3b82f6', padding: '4px 12px', 
            borderRadius: 20, fontSize: 12, fontWeight: 700 
          }}>AI-CURATED GUIDE</span>
          <span style={{ 
            background: 'rgba(16,185,129,0.1)', color: '#10b981', padding: '4px 12px', 
            borderRadius: 20, fontSize: 12, fontWeight: 700 
          }}>{guide.budgetLevel.toUpperCase()}</span>
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', marginBottom: 16 }}>{guide.city}</h1>
        <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, maxWidth: 800 }}>{guide.description}</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        <div>
          {/* Top Attractions */}
          <div style={cardStyle}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <Landmark style={{ width: 24, height: 24, color: '#f59e0b' }} /> Top Attractions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {guide.topAttractions.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 16 }}>
                  <div style={{ 
                    minWidth: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.03)', 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#64748b' 
                  }}>
                    {i+1}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 4 }}>{a.name}</h4>
                    <p style={{ fontSize: 14, color: '#94a3b8', margin: 0 }}>{a.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Local Secrets */}
          <div style={{ ...cardStyle, background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(59,130,246,0.05))', border: '1px solid rgba(124,58,237,0.1)' }}>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
              <Compass style={{ width: 24, height: 24, color: '#7c3aed' }} /> Local Hidden Gems
            </h3>
            <div style={{ marginBottom: 20 }}>
               <button 
                 onClick={() => router.push(`/explore/hidden-gems/${city}`)}
                 style={{ width: '100%', padding: '14px', borderRadius: 16, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', color: '#a78bfa', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                 className="hover:bg-violet-500/20"
               >
                 <Sparkles style={{ width: 16, height: 16 }} /> Unlock AI Deep Secrets
               </button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {guide.localSecrets.map((s, i) => (
                <div key={i} style={{ padding: 20, borderRadius: 20, background: 'rgba(15,23,42,0.4)', border: '1px solid rgba(255,255,255,0.02)' }}>
                  <h4 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 8 }}>{s.name}</h4>
                  <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontStyle: 'italic' }}>"{s.description}"</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div>
          {/* Quick Info */}
          <div style={{ ...cardStyle, padding: 24 }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#3b82f6', marginBottom: 8 }}>
                <Calendar style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Best Time</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: 0 }}>{guide.bestTimeToVisit}</p>
            </div>

            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#10b981', marginBottom: 8 }}>
                <Wallet style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Budget Level</span>
              </div>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: 0 }}>{guide.budgetLevel}</p>
            </div>

            <div style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', marginBottom: 12 }}>
                <Shield style={{ width: 16, height: 16 }} />
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase' }}>Safety Tips</span>
              </div>
              <ul style={{ padding: 0, margin: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {guide.safetyTips.map((tip, i) => (
                  <li key={i} style={{ fontSize: 13, color: '#94a3b8', display: 'flex', gap: 8 }}>
                    <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ef4444', marginTop: 7 }} />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Itinerary Summary */}
          <div style={{ ...cardStyle, padding: 24, background: 'rgba(59,130,246,0.03)', border: '1px solid rgba(59,130,246,0.1)' }}>
             <h4 style={{ fontSize: 15, fontWeight: 700, color: '#3b82f6', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
               <MapIcon style={{ width: 16, height: 16 }} /> 3-Day Plan
             </h4>
             <p style={{ fontSize: 14, color: '#cbd5e1', lineHeight: 1.6, margin: 0 }}>{guide.itinerarySummary}</p>
          </div>
        </div>
      </div>

      <div style={{ 
        marginTop: 48, padding: 32, borderRadius: 32, background: 'linear-gradient(to right, #7c3aed, #3b82f6)', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
      }}>
        <div>
          <h3 style={{ fontSize: 24, fontWeight: 800, color: 'white', margin: '0 0 8px' }}>Ready for {guide.city}?</h3>
          <p style={{ color: 'rgba(255,255,255,0.8)', margin: 0 }}>Create a trip now and invite your friends!</p>
        </div>
        <button 
          onClick={() => router.push('/trips/create')}
          style={{ 
            padding: '16px 32px', borderRadius: 16, background: 'white', color: '#1e1b4b', 
            fontWeight: 700, border: 'none', cursor: 'pointer' 
          }}
          className="hover:scale-105 transition-transform"
        >
          Create Trip
        </button>
      </div>
    </div>
  );
}
