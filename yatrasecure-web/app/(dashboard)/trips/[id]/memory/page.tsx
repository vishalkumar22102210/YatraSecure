'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, Heart, Trophy, Wallet, ImageIcon as ImageIconLucide, BookOpen, Share2 } from 'lucide-react';
import { API_BASE_URL, getAccessToken } from '@/app/lib/api';
import TravelStats from '@/components/TravelStats';
import toast from 'react-hot-toast';

export default function MemoryLanePage() {
  const { id } = useParams();
  const router = useRouter();
  const [trip, setTrip] = useState<any>(null);
  const [insights, setInsights] = useState<any>(null);
  const [story, setStory] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  async function loadData() {
    setLoading(true);
    try {
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };

      // Load basic trip
      const tripRes = await fetch(`${API_BASE_URL}/trips/${id}`, { headers });
      if (tripRes.ok) setTrip(await tripRes.json());

      // Load insights
      const insightsRes = await fetch(`${API_BASE_URL}/trips/${id}/insights`, { headers });
      if (insightsRes.ok) setInsights(await insightsRes.json());

    } catch (e) {
      toast.error('Failed to load memories');
    } finally {
      setLoading(false);
    }
  }

  async function handleGenerateStory() {
    setGenerating(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/trips/${id}/story/generate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setStory(data.story);
    } catch (e) {
      toast.error('Failed to generate story');
    } finally {
      setGenerating(true); // stay true for a sec for effect
      setTimeout(() => setGenerating(false), 500);
    }
  }

  if (loading) return <div style={{ padding: 80, textAlign: 'center', color: '#64748b' }}>Reviving memories...</div>;

  return (
    <div className="anim-in" style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 100 }}>
      {/* Back Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: 14 }}>
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Trip
        </button>
        <div style={{ display: 'flex', gap: 12 }}>
           <button style={{ padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
             <Share2 style={{ width: 16, height: 16 }} /> Share Memory
           </button>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ 
        position: 'relative', height: 400, borderRadius: 40, overflow: 'hidden', marginBottom: 60,
        boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' 
      }}>
        <img 
          src={trip?.coverImage || 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1470'} 
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }}
        />
        <div style={{ 
          position: 'absolute', inset: 0, 
          background: 'linear-gradient(to top, #0f172a, transparent)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 60
        }}>
          <h1 style={{ fontSize: 56, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', margin: 0 }}>Memory Lane</h1>
          <p style={{ fontSize: 18, color: '#94a3b8', marginTop: 12 }}>Reflecting on the journey to {trip?.toCity}</p>
        </div>
      </div>

      {/* Key Highlights Bento */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, marginBottom: 60 }}>
        {[
          { icon: Wallet, color: '#10b981', label: 'Total Invested', value: `₹${insights?.totalSpent?.toLocaleString()}`, sub: 'Grand Total' },
          { icon: Trophy, color: '#f59e0b', label: 'Top Spender', value: insights?.topContributor?.username || 'Everyone', sub: 'The Rich Kid' },
          { icon: ImageIconLucide, color: '#ec4899', label: 'Moments Captured', value: insights?.photoCount || '0', sub: 'Photos Saved' },
          { icon: Heart, color: '#ef4444', label: 'Trip Members', value: insights?.memberCount || '0', sub: 'Shared Spirit' },
        ].map((item, i) => (
          <div key={i} className="glass-card" style={{ padding: 24, borderRadius: 24, textAlign: 'center', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <item.icon style={{ width: 22, height: 22, color: item.color }} />
            </div>
            <div style={{ fontSize: 11, color: '#64748b', fontWeight: 800, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: 'white' }}>{item.value}</div>
            <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* AI Story Section */}
      <div style={{ 
        background: 'linear-gradient(135deg, rgba(124,58,237,0.05), rgba(59,130,246,0.05))',
        border: '1px solid rgba(124,58,237,0.1)',
        padding: 60, borderRadius: 40, marginBottom: 60, textAlign: 'center'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
          <div style={{ width: 60, height: 60, borderRadius: 20, background: 'rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BookOpen style={{ width: 32, height: 32, color: '#7c3aed' }} />
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'white', margin: 0 }}>The Trip Memoir</h2>
          
          {story ? (
            <div className="anim-in" style={{ fontSize: 18, color: '#cbd5e1', lineHeight: 1.8, maxWidth: 700, fontStyle: 'italic', whiteSpace: 'pre-wrap' }}>
              "{story}"
            </div>
          ) : (
            <>
              <p style={{ color: '#94a3b8', fontSize: 15, maxWidth: 500 }}>
                Let our AI synthesize your itinerary, expenses, and photos into a beautiful narrative memory of this journey.
              </p>
              <button 
                onClick={handleGenerateStory}
                disabled={generating}
                style={{ 
                  padding: '16px 32px', borderRadius: 16, background: 'linear-gradient(45deg, #7c3aed, #3b82f6)', 
                  border: 'none', color: 'white', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10, 
                  cursor: 'pointer', boxShadow: '0 20px 40px -10px rgba(124,58,237,0.4)'
                }}>
                {generating ? <span className="animate-pulse">Writing your story...</span> : <><Sparkles style={{ width: 18, height: 18 }} /> Write Our Trip Story</>}
              </button>
            </>
          )}

          {story && (
             <button onClick={() => setStory('')} style={{ color: '#64748b', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', marginTop: 20 }}>Regenerate Story</button>
          )}
        </div>
      </div>

      {/* Visual Analytics */}
      <div style={{ marginBottom: 40 }}>
        <h3 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 24, textAlign: 'center' }}>Travel Analytics</h3>
        <TravelStats data={insights} />
      </div>

      {/* Footer Reflection */}
      <div style={{ textAlign: 'center', marginTop: 80, padding: 40, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <Sparkles style={{ width: 32, height: 40, color: '#f59e0b', opacity: 0.3, marginBottom: 20 }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>YatraSecure Memory Engine v1.0 • Built with Love</p>
      </div>
    </div>
  );
}
