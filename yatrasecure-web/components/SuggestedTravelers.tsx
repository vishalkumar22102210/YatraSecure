'use client';

import { useState, useEffect } from 'react';
import { Sparkles, MapPin, Star, ShieldCheck, User, ArrowRight } from 'lucide-react';
import { API_BASE_URL, fetchWithAuth } from '@/app/lib/api';
import FollowButton from './FollowButton';
import Link from 'next/link';

interface SuggestedUser {
  id: string;
  username: string;
  profileImage?: string;
  reputationScore: number;
  isVerified: boolean;
  travelPersonality?: string;
  matchScore?: number;
}

// Helper to generate a stable pseudo-random match percentage based on string
const getMatchPercentage = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return 60 + (Math.abs(hash) % 36); // Match between 60% and 95%
};

// Helper to get a stable mock location based on string
const getMockLocation = (str: string) => {
  const locs = ["Delhi, IN", "Mumbai, IN", "Bangalore, IN", "Goa, IN", "Dubai, UAE", "Bali, ID"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return locs[Math.abs(hash) % locs.length];
};

export default function SuggestedTravelers() {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  async function fetchSuggestions() {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/social/suggestions`);
      if (res.ok) {
        setUsers(await res.json());
      }
    } catch (e) {
      console.error('Error fetching suggestions', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)' }}>
        <div style={{ height: 20, width: 140, background: 'rgba(255,255,255,0.1)', borderRadius: 6, marginBottom: 20, animation: 'pulse 1.5s infinite' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.05)', animation: 'pulse 1.5s infinite' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 14, width: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
                <div style={{ height: 12, width: '60%', background: 'rgba(255,255,255,0.05)', borderRadius: 4, animation: 'pulse 1.5s infinite' }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  
  if (users.length === 0) return null;

  return (
    <div style={{ 
      padding: "24px", 
      background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
      borderRadius: 20, 
      border: '1px solid rgba(255,255,255,0.05)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
          <Sparkles style={{ width: 16, height: 16, color: '#f59e0b' }} /> Network Suggestions
        </h3>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 600, letterSpacing: '0.05em' }}>AI MATCHED</span>
        <Link href="/network" style={{ fontSize: 13, color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }} className="hover:text-blue-400 transition-colors">
          View All <ArrowRight style={{ width: 14, height: 14 }} />
        </Link>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {users.map((u, i) => {
          const matchPercent = u.matchScore || 0;
          const location = getMockLocation(u.id);
          const persona = u.travelPersonality || 'Explorer';
          
          return (
            <Link 
              href={`/profile/${u.username}`}
              key={u.id}
              style={{ 
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                padding: '16px', borderRadius: '16px',
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                cursor: 'pointer', textDecoration: 'none',
                animation: `fadeIn 0.3s ease-out ${i * 0.1}s both`,
              }}
              className="hover:bg-white/10 hover:border-white/20 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                <div style={{ position: 'relative', flexShrink: 0 }}>
                  <div style={{ 
                    width: 44, height: 44, borderRadius: 14, 
                    background: 'linear-gradient(135deg, #1e293b, #0f172a)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 800, color: '#cbd5e1', overflow: 'hidden',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                  }}>
                    {u.profileImage ? <img src={u.profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <User style={{ width: 20, height: 20, color: '#64748b' }}/>}
                  </div>
                  {/* Match Match indicator dot */}
                  <div style={{ 
                    position: 'absolute', bottom: -2, right: -2, 
                    width: 14, height: 14, borderRadius: '50%', 
                    background: matchPercent > 80 ? '#10b981' : '#f59e0b', border: '2px solid #0f172a'
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {u.username}
                    </p>
                    {u.isVerified && <ShieldCheck style={{ width: 14, height: 14, color: '#38bdf8', flexShrink: 0 }} />}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#94a3b8', minWidth: 0 }}>
                      <MapPin style={{ width: 10, height: 10, flexShrink: 0 }} />
                      <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{location}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#fbbf24', fontWeight: 600, flexShrink: 0 }}>
                      <Star style={{ width: 10, height: 10, fill: '#fbbf24' }} /> {u.reputationScore}
                    </div>
                  </div>

                  {/* Badges / Persona / Match */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                    <span style={{ 
                      fontSize: 10, fontWeight: 600, color: '#a855f7', 
                      background: 'rgba(168,85,247,0.1)', padding: '2px 6px', borderRadius: 4,
                      border: '1px solid rgba(168,85,247,0.2)', whiteSpace: 'nowrap'
                    }}>{persona}</span>
                    <span style={{ 
                      fontSize: 10, fontWeight: 600, color: matchPercent > 80 ? '#10b981' : '#f59e0b', 
                      background: matchPercent > 80 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', padding: '2px 6px', borderRadius: 4,
                      border: matchPercent > 80 ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(245,158,11,0.2)', whiteSpace: 'nowrap'
                    }}>{matchPercent}% Match</span>
                  </div>
                </div>
              </div>

              <div 
                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                onClick={(e) => {
                  // Prevent the Link from navigating when clicking the follow button
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <FollowButton targetUserId={u.id} size="sm" variant="outline" />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
