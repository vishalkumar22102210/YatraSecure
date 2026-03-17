'use client';

import { useState, useEffect } from 'react';
import { 
  ShoppingBag, Star, MapPin, Tag, ShieldCheck, 
  Search, Filter, Sparkles, Loader2, Compass, 
  ArrowRight, Heart, Users
} from 'lucide-react';
import { API_BASE_URL, getAccessToken } from '@/app/lib/api';
import toast from 'react-hot-toast';

interface Offering {
  id: string;
  title: string;
  description: string;
  location: string;
  price: number;
  currency: string;
  category: string;
  groupDiscount: number;
  rating: number;
  verified: boolean;
  provider: string;
  vibe: string;
}

const CATEGORIES = ["All", "Adventure", "Food", "Culture", "Wellness", "Hidden Gems"];

export default function MarketplacePage() {
  const [offerings, setOfferings] = useState<Offering[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOfferings();
  }, [activeCategory]);

  async function fetchOfferings() {
    setLoading(true);
    try {
      const token = getAccessToken();
      const catParam = activeCategory !== "All" ? `?category=${activeCategory}` : "";
      const res = await fetch(`${API_BASE_URL}/trips/marketplace/offerings${catParam}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOfferings(data.offerings);
      } else {
        toast.error('Failed to load marketplace');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  const filtered = offerings.filter(o => 
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    o.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ padding: '40px 20px', maxWidth: 1400, margin: '0 auto' }}>
      
      {/* ══ HERO SECTION ══════════════════════════════════════════════════════ */}
      <style>{`@keyframes marqueeScroll { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }`}</style>
      <div style={{ 
        position: 'relative', overflow: 'hidden', padding: '80px 40px', 
        borderRadius: 40, background: 'linear-gradient(135deg, #0f172a, #1e293b)',
        border: '1px solid rgba(255,255,255,0.05)', marginBottom: 48,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center'
      }}>
        {/* Scrolling Destination Image Marquee Strip */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 40, zIndex: 0, pointerEvents: 'none' }}>
          <div style={{ display: 'flex', width: 'max-content', animation: 'marqueeScroll 28s linear infinite', height: '100%' }}>
            {[
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=60',
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=60',
              'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=60',
              'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=60',
              'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=60',
              'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&q=60',
              'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&q=60',
              'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&q=60',
              'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=600&q=60',
              'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=600&q=60',
              'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&q=60',
              'https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=600&q=60',
            ].map((src, idx) => (
              <div key={idx} style={{ flexShrink: 0, width: 320, height: '100%', overflow: 'hidden', opacity: 0.06 }}>
                <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        </div>

        <div style={{ 
          position: 'absolute', top: '-100px', right: '-100px', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(56,189,248,0.08) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 1
        }} />
        <div style={{ 
          position: 'absolute', bottom: '-100px', left: '-100px', width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 1
        }} />

        <div style={{ position: 'relative', zIndex: 2, display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.05)', padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 700, color: 'var(--accent)', marginBottom: 24, border: '1px solid rgba(56,189,248,0.2)' }}>
          <ShoppingBag style={{ width: 14, height: 14 }} /> VERIFIED EXPERIENCES
        </div>
        <h1 style={{ position: 'relative', zIndex: 2, fontSize: 72, fontWeight: 700, color: 'white', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 20, fontFamily: "'Space Grotesk', sans-serif" }}>
          Autonomous <span style={{ color: 'var(--accent)' }}>Marketplace</span>
        </h1>
        <p style={{ position: 'relative', zIndex: 2, fontSize: 20, color: '#94a3b8', maxWidth: 640, marginBottom: 40 }}>
          Verified local secrets, group-curated adventures, and exclusive traveler benefits—all in one place.
        </p>

        <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 700 }}>
          <Search style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: '#64748b', width: 20, height: 20 }} />
          <input 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by city, activity, or provider..."
            className="input-field"
            style={{ padding: '20px 20px 20px 60px', borderRadius: 24, fontSize: 16 }}
            onFocus={e => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
        </div>
      </div>

      {/* ══ CATEGORIES ═══════════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 40, flexWrap: 'wrap', justifyContent: 'center' }}>
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{ 
              padding: '12px 24px', borderRadius: 16, fontSize: 14, fontWeight: 700,
              background: activeCategory === cat ? 'var(--accent)' : 'rgba(255,255,255,0.03)',
              color: activeCategory === cat ? 'var(--bg)' : '#94a3b8',
              border: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', transition: 'all 0.2s'
            }}
            className="hover:scale-105 active:scale-95"
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ══ OFFERINGS GRID ═══════════════════════════════════════════════════ */}
      {loading ? (
        <div style={{ minHeight: '40vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Loader2 style={{ width: 40, height: 40, animation: 'spin 2s linear infinite', color: 'var(--accent)' }} />
          <p style={{ color: '#64748b', fontWeight: 600 }}>Curating premium offerings for you...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))', gap: 32 }}>
          {filtered.map(off => (
            <div key={off.id} style={{ 
              background: 'rgba(255,255,255,0.02)', borderRadius: 32, overflow: 'hidden', 
              border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column',
              transition: 'all 0.3s'
            }} className="hover:-translate-y-2 hover:bg-white/[0.04] hover:shadow-2xl group">
              
              <div style={{ padding: 32 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <ShieldCheck style={{ width: 12, height: 12 }} /> VERIFIED
                    </div>
                    {off.groupDiscount > 0 && (
                      <div style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316', padding: '4px 10px', borderRadius: 10, fontSize: 11, fontWeight: 800 }}>
                        -{off.groupDiscount}% GROUP DEAL
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fbbf24', fontSize: 13, fontWeight: 700 }}>
                    <Star style={{ width: 14, height: 14, fill: '#fbbf24' }} /> {off.rating}
                  </div>
                </div>

                <h3 style={{ fontSize: 24, fontWeight: 800, color: 'white', marginBottom: 12, letterSpacing: '-0.02em' }}>{off.title}</h3>
                <p style={{ fontSize: 15, color: '#94a3b8', lineHeight: 1.6, marginBottom: 24, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {off.description}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#cbd5e1' }}>
                     <MapPin style={{ width: 16, height: 16, color: 'var(--accent)' }} /> {off.location}
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, color: '#94a3b8' }}>
                     <Compass style={{ width: 16, height: 16 }} /> {off.vibe}
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#64748b', fontStyle: 'italic' }}>
                     By {off.provider}
                   </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <span style={{ fontSize: 14, color: '#64748b' }}>Starting from</span>
                    <div style={{ fontSize: 28, fontWeight: 900, color: 'white' }}>
                      {off.currency} {off.price.toLocaleString()}
                    </div>
                  </div>
                  <button className="btn-primary hover:scale-105 transition-transform" style={{ 
                    padding: '14px 28px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8
                  }}>
                    Explore Details <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ══ CTA SECTION ═══════════════════════════════════════════════════════ */}
      <div style={{ 
        marginTop: 80, padding: 60, borderRadius: 48, background: 'linear-gradient(135deg, rgba(56,189,248,0.06), rgba(56,189,248,0.02))',
        border: '1px solid rgba(56,189,248,0.12)', textAlign: 'center'
      }}>
        <h2 style={{ fontSize: 40, fontWeight: 950, color: 'white', marginBottom: 20 }}>Are you a local expert?</h2>
        <p style={{ color: '#94a3b8', fontSize: 18, maxWidth: 600, margin: '0 auto 40px' }}>
          YatraSecure is building the future of autonomous travel commerce. List your verified local experiences and reach thousands of explorers.
        </p>
        <button style={{ 
          padding: '18px 40px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', color: 'white', 
          fontWeight: 800, border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer' 
        }} className="hover:bg-white/10 transition-colors">
          Become a Verified Provider
        </button>
      </div>

    </div>
  );
}
