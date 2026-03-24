'use client';

import { useState, useEffect } from 'react';
import { Users, Search, ChevronLeft, ChevronRight, MapPin, Star, ShieldCheck, User } from 'lucide-react';
import Link from 'next/link';
import { API_BASE_URL, fetchWithAuth } from '@/app/lib/api';
import FollowButton from '@/components/FollowButton';

interface MinimalUser {
  id: string;
  username: string;
  profileImage?: string;
  reputationScore: number;
  isVerified: boolean;
  travelPersonality?: string;
}

// Stable mock location generator
const getMockLocation = (str: string) => {
  const locs = ["Delhi, IN", "Mumbai, IN", "Bangalore, IN", "Goa, IN", "Dubai, UAE", "Bali, ID", "London, UK", "New York, US", "Tokyo, JP", "Paris, FR"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return locs[Math.abs(hash) % locs.length];
};

export default function NetworkPage() {
  const [users, setUsers] = useState<MinimalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);

  const fetchUsers = async (pageNumber: number) => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/users?page=${pageNumber}&limit=12`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.totalPages);
        setTotalUsers(data.total);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(page);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [page]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <Users className="w-6 h-6 text-blue-400" />
            Traveler Network
          </h1>
          <p className="text-slate-400 text-sm mt-1">Discover and connect with {totalUsers > 0 ? totalUsers : 'other'} verified travelers around the world.</p>
        </div>
      </div>

      {loading && users.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-[120px] rounded-2xl bg-white/5 border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {users.map((u, i) => {
              const location = getMockLocation(u.id);
              const persona = u.travelPersonality || 'Explorer';

              return (
                <Link 
                  href={`/profile/${u.username}`}
                  key={u.id}
                  className="group flex flex-col gap-4 p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/10 transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden"
                  style={{ animation: `fadeIn 0.4s ease-out ${i * 0.05}s both` }}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex items-start justify-between gap-4 z-10">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-300 border border-white/10 shrink-0 overflow-hidden shadow-inner">
                      {u.profileImage ? (
                        <img src={u.profileImage} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-6 h-6" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-100 truncate text-base">{u.username}</h3>
                        {u.isVerified && <ShieldCheck className="w-4 h-4 text-sky-400 shrink-0" />}
                      </div>
                      
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-slate-400 truncate">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{location}</span>
                        </span>
                        <span className="flex items-center gap-1 text-amber-400 font-semibold shrink-0">
                          <Star className="w-3 h-3 fill-amber-400" />
                          {u.reputationScore}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-auto pt-2 z-10">
                    <span className="px-3 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-full text-xs font-semibold whitespace-nowrap">
                      {persona}
                    </span>
                    
                    <div 
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                    >
                      <FollowButton targetUserId={u.id} size="sm" variant="default" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <span className="text-sm font-medium text-slate-300">
                Page <span className="text-white">{page}</span> of <span className="text-white">{totalPages}</span>
              </span>
              
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="p-2 rounded-xl bg-white/5 border border-white/10 text-white disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
