"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  ArrowLeft, UserPlus, UserCheck, MapPin, 
  Map, Loader2, Users, Compass, Star, ShieldCheck, User
} from "lucide-react";
import { API_BASE_URL, getAccessToken } from "@/app/lib/api";
import FollowButton from "@/components/FollowButton";
import Link from 'next/link';

export default function PublicProfilePage() {
  const params = useParams();
  const router = useRouter();
  const username = params.username as string;

  const [profile, setProfile] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<'followers' | 'following' | 'mutuals' | null>(null);
  const [connectionUsers, setConnectionUsers] = useState<any[]>([]);
  const [connectionsLoading, setConnectionsLoading] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setCurrentUser(JSON.parse(s));
    loadProfile(s ? JSON.parse(s).id : null);
  }, [username]);

  async function loadProfile(currentUserId: string | null) {
    try {
      const token = getAccessToken();
      const headers: any = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/users/profile/${username}${currentUserId ? `?userId=${currentUserId}` : ''}`, {
        headers
      });

      if (!res.ok) {
        if (res.status === 404) {
          toast.error("User not found");
          router.push("/dashboard");
          return;
        }
        throw new Error("Failed to load profile");
      }
      
      const data = await res.json();
      setProfile(data);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleFollow() {
    if (!currentUser) {
      toast.error("Please log in to follow");
      return;
    }
    
    setFollowLoading(true);
    try {
      const token = getAccessToken();
      const method = profile.isFollowing ? "DELETE" : "POST";
      
      const res = await fetch(`${API_BASE_URL}/users/profile/${username}/follow`, {
        method,
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Action failed");
      
      // Optimistic update
      setProfile((prev: any) => ({
        ...prev,
        isFollowing: !prev.isFollowing,
        _count: {
          ...prev._count,
          followers: prev._count.followers + (prev.isFollowing ? -1 : 1)
        }
      }));
      
      toast.success(profile.isFollowing ? "Unfollowed" : "Following");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setFollowLoading(false);
    }
  }

  async function loadConnections(tab: 'followers' | 'following' | 'mutuals') {
    if (activeTab === tab) {
      setActiveTab(null); // Toggle off
      return;
    }
    
    setActiveTab(tab);
    setConnectionsLoading(true);
    setConnectionUsers([]);

    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/users/profile/${username}/${tab}`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setConnectionUsers(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setConnectionsLoading(false);
    }
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 400 }}>
       <Loader2 style={{ width: 32, height: 32, color: "#3b82f6", animation: "spin 1s linear infinite" }} />
    </div>
  );

  if (!profile) return null;

  const isSelf = currentUser?.username === profile.username;
  const avatarText = profile.username.slice(0, 2).toUpperCase();

  return (
    <div className="anim-in" style={{ maxWidth: 700, margin: "0 auto", padding: "20px" }}>
      <button onClick={() => router.back()} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13, marginBottom: 24, padding: 0 }} className="hover:text-white transition-colors">
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back
      </button>

      {/* COVER & HEADER */}
      <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: 24, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
         <div style={{ height: 140, background: "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.2))" }} />
         
         <div style={{ padding: "0 24px 24px", marginTop: -40, position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 16 }}>
               {/* Avatar */}
               <div style={{ width: 88, height: 88, borderRadius: "50%", background: "#0f172a", border: "4px solid #06090e", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
                  {profile.profileImage ? (
                     <img src={profile.profileImage} alt={profile.username} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                     <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg, #3b82f6, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28, fontWeight: 900, color: "white" }}>
                        {avatarText}
                     </div>
                  )}
               </div>

               {/* Action Button */}
               {!isSelf && (
                 <button 
                   onClick={toggleFollow} 
                   disabled={followLoading}
                   style={{ 
                     display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s",
                     background: profile.isFollowing ? "rgba(255,255,255,0.1)" : "#3b82f6",
                     color: "white", border: profile.isFollowing ? "1px solid rgba(255,255,255,0.2)" : "none"
                   }}
                 >
                   {followLoading ? <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} /> : (profile.isFollowing ? <UserCheck style={{ width: 16, height: 16 }} /> : <UserPlus style={{ width: 16, height: 16 }} />)}
                   {profile.isFollowing ? "Following" : "Follow"}
                 </button>
               )}
               {isSelf && (
                 <button onClick={() => router.push('/profile')} style={{ background: "rgba(255,255,255,0.1)", color: "white", border: "1px solid rgba(255,255,255,0.2)", padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                   Edit Profile
                 </button>
               )}
            </div>

            {/* Info */}
            <div>
               <h1 style={{ fontSize: 24, fontWeight: 800, color: "white", margin: "0 0 4px" }}>@{profile.username}</h1>
               {(profile.city || profile.country) && (
                 <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 13, marginBottom: 12 }}>
                   <MapPin style={{ width: 14, height: 14 }} />
                   {profile.city}{profile.city && profile.country ? ", " : ""}{profile.country}
                 </div>
               )}
               
               {profile.bio && (
                 <p style={{ fontSize: 14, color: "#cbd5e1", lineHeight: 1.5, margin: "0 0 16px", maxWidth: 500 }}>
                   {profile.bio}
                 </p>
               )}

               {/* Stats */}
               <div style={{ display: "flex", gap: 24, padding: "16px 0", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                     <span style={{ fontSize: 18, fontWeight: 800, color: "white" }}>{profile._count?.trips || 0}</span>
                     <span style={{ fontSize: 13, color: "#64748b", fontWeight: 600 }}>Trips</span>
                  </div>
                  
                  <button 
                    onClick={() => loadConnections('followers')}
                    style={{ background: 'none', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: "flex", alignItems: "center", gap: 8, transition: 'all 0.2s', ...(activeTab === 'followers' ? { background: 'rgba(59,130,246,0.1)', outline: '1px solid rgba(59,130,246,0.3)' } : {}) }}
                    className="hover:bg-white/5"
                  >
                     <span style={{ fontSize: 18, fontWeight: 800, color: activeTab === 'followers' ? '#60a5fa' : 'white' }}>{profile._count?.followers || 0}</span>
                     <span style={{ fontSize: 13, color: activeTab === 'followers' ? '#93c5fd' : '#64748b', fontWeight: 600 }}>Followers</span>
                  </button>

                  <button 
                    onClick={() => loadConnections('following')}
                    style={{ background: 'none', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: "flex", alignItems: "center", gap: 8, transition: 'all 0.2s', ...(activeTab === 'following' ? { background: 'rgba(59,130,246,0.1)', outline: '1px solid rgba(59,130,246,0.3)' } : {}) }}
                    className="hover:bg-white/5"
                  >
                     <span style={{ fontSize: 18, fontWeight: 800, color: activeTab === 'following' ? '#60a5fa' : 'white' }}>{profile._count?.following || 0}</span>
                     <span style={{ fontSize: 13, color: activeTab === 'following' ? '#93c5fd' : '#64748b', fontWeight: 600 }}>Following</span>
                  </button>

                  {!isSelf && (
                    <button 
                      onClick={() => loadConnections('mutuals')}
                      style={{ background: 'none', border: 'none', padding: '6px 12px', borderRadius: 8, cursor: 'pointer', display: "flex", alignItems: "center", gap: 8, transition: 'all 0.2s', ...(activeTab === 'mutuals' ? { background: 'rgba(168,85,247,0.1)', outline: '1px solid rgba(168,85,247,0.3)' } : {}) }}
                      className="hover:bg-white/5"
                    >
                      <Users style={{ width: 14, height: 14, color: activeTab === 'mutuals' ? '#c084fc' : '#64748b' }} />
                      <span style={{ fontSize: 13, color: activeTab === 'mutuals' ? '#d8b4fe' : '#64748b', fontWeight: 600 }}>Mutuals</span>
                    </button>
                  )}
               </div>
            </div>
         </div>
      </div>

      {/* CONNECTIONS VIEWER */}
      {activeTab && (
        <div className="mt-6 p-6 bg-slate-900/60 rounded-3xl border border-white/5 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            {activeTab === 'mutuals' && <Users className="w-4 h-4 text-purple-400"/>}
            {activeTab === 'mutuals' ? 'Mutual Connections' : activeTab === 'followers' ? 'Followers' : 'Following'}
          </h3>

          {connectionsLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
          ) : connectionUsers.length === 0 ? (
            <div className="text-center p-8 text-slate-400 text-sm bg-black/20 rounded-xl border border-white/5">
              No {activeTab} found
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectionUsers.map((u, i) => (
                <Link 
                  href={`/profile/${u.username}`}
                  key={u.id}
                  className="group flex flex-col p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10 transition-all hover:-translate-y-1 relative overflow-hidden"
                  style={{ animation: `fadeIn 0.3s ease-out ${i * 0.05}s both` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-slate-300 border border-white/10 shrink-0 overflow-hidden shadow-inner">
                      {u.profileImage ? (
                        <img src={u.profileImage} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-100 truncate text-sm">{u.username}</h3>
                        {u.isVerified && <ShieldCheck className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                      </div>
                      <div className="flex items-center gap-3 text-xs mt-1">
                        <span className="flex items-center gap-1 text-amber-400 font-semibold shrink-0">
                          <Star className="w-3 h-3 fill-amber-400" /> {u.reputationScore}
                        </span>
                        {/* MUTUAL BADGE */}
                        {u.isMutual && (
                          <span className="px-2 py-0.5 bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/20 rounded-md text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                            <Users className="w-3 h-3" /> Mutual
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5 z-10">
                    <span className="text-xs text-slate-500 font-medium">
                      {u.travelPersonality || 'Explorer'}
                    </span>
                    <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                      {(!currentUser || currentUser.id !== u.id) && (
                        <FollowButton targetUserId={u.id} size="sm" variant={u.isMutual ? "default" : "outline"} />
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TRAVEL STYLE */}
      {profile.travelStyle && profile.travelStyle.length > 0 && (
         <div style={{ marginTop: 24, background: "rgba(15,23,42,0.6)", borderRadius: 20, padding: 24, border: "1px solid rgba(255,255,255,0.05)" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
               <Compass style={{ width: 18, height: 18, color: "#8b5cf6" }} /> Travel Style
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
               {profile.travelStyle.map((style: string) => (
                  <span key={style} style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#c4b5fd", padding: "6px 14px", borderRadius: 999, fontSize: 12, fontWeight: 600 }}>
                     {style}
                  </span>
               ))}
            </div>
         </div>
      )}
    </div>
  );
}
