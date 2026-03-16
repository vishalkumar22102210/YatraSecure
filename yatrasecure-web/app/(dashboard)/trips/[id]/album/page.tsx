"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Image as ImageIcon, UploadCloud, X, Loader2, Calendar, Heart } from "lucide-react";
import { API_BASE_URL, getAccessToken } from "@/app/lib/api";

export default function TripAlbumPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const fileRef = useRef<HTMLInputElement>(null);
  const [trip, setTrip] = useState<any>(null);
  const [photos, setPhotos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Preview modal
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [tripId]);

  async function loadData() {
    setLoading(true);
    try {
      const token = getAccessToken();
      const headers = { Authorization: `Bearer ${token}` };

      const [tripRes, photosRes] = await Promise.all([
        fetch(`${API_BASE_URL}/trips/${tripId}`, { headers }),
        fetch(`/api/trips/${tripId}/photos`, { headers })
      ]);
      
      if (tripRes.ok) setTrip(await tripRes.json());
      if (photosRes.ok) setPhotos(await photosRes.json());
    } catch (e: any) {
      toast.error("Failed to load album");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10MB allowed"); return; }
    
    setUploading(true);
    try {
      const token = getAccessToken();
      
      const fd = new FormData();
      fd.append("file", file);
      
      const uploadRes = await fetch(`${API_BASE_URL}/upload/trip-photo/${tripId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd
      });
      const uploadData = await uploadRes.json();
      if (!uploadRes.ok) throw new Error(uploadData.message || "Failed to upload image");
      
      const photoRes = await fetch(`/api/trips/${tripId}/photos`, {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url: uploadData.url, caption: "Trip memory" })
      });
      
      const newPhoto = await photoRes.json();
      if (!photoRes.ok) throw new Error("Failed to save photo record");
      
      setPhotos([newPhoto, ...photos]);
      toast.success("Photo added to album!");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleLike(photoId: string) {
    // Optimistic update
    setPhotos(prev => prev.map(p => {
      if (p.id === photoId) {
        return {
          ...p,
          isLiked: !p.isLiked,
          likeCount: p.isLiked ? p.likeCount - 1 : p.likeCount + 1
        };
      }
      return p;
    }));

    try {
      const token = getAccessToken();
      const res = await fetch(`/api/trips/${tripId}/photos/${photoId}/like`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to toggle like");
    } catch (e: any) {
      toast.error(e.message);
      // Revert if failed
      loadData();
    }
  }

  function getTripDay(createdAt: string) {
    if (!trip?.startDate) return "Photos";
    const start = new Date(trip.startDate);
    const curr = new Date(createdAt);
    const diff = Math.floor((curr.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? `Day ${diff}` : "Pre-trip";
  }

  const groupedPhotos = photos.reduce((acc: any, photo) => {
    const day = getTripDay(photo.createdAt);
    if (!acc[day]) acc[day] = [];
    acc[day].push(photo);
    return acc;
  }, {});

  return (
    <div className="anim-in" style={{ padding: "40px 24px", maxWidth: 1200, margin: "0 auto", color: "white" }}>
      
      {/* ── BACKGROUND DECOR ── */}
      <div style={{ position: 'fixed', top: '5%', right: '10%', width: 400, height: 400, background: 'rgba(236,72,153,0.03)', filter: 'blur(120px)', borderRadius: '50%', zIndex: -1 }} />
      <div style={{ position: 'fixed', bottom: '5%', left: '10%', width: 350, height: 350, background: 'rgba(139,92,246,0.03)', filter: 'blur(120px)', borderRadius: '50%', zIndex: -1 }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 48 }}>
        <div>
          <button onClick={() => router.push(`/trips/${tripId}`)} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", cursor: "pointer", fontSize: 13, padding: "10px 16px", borderRadius: 12, marginBottom: 16 }} className="hover:text-white hover:bg-white/5 transition-all">
            <ArrowLeft style={{ width: 16, height: 16 }} /> Back
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #ec4899, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: '0 8px 20px -6px rgba(236,72,153,0.4)' }}>
              <ImageIcon style={{ width: 28, height: 28, color: "white" }} />
            </div>
            <div>
              <h1 style={{ fontSize: 32, fontWeight: 900, margin: 0, letterSpacing: '-0.04em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Memories</h1>
              <p style={{ fontSize: 14, color: "#64748b", margin: 4, fontWeight: 600 }}>{trip?.name || 'Loading trip...'}</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => fileRef.current?.click()} 
          disabled={uploading}
          style={{ 
            background: "linear-gradient(135deg, #ec4899, #db2777)", 
            color: "white", border: "none", 
            padding: "14px 28px", borderRadius: 14, 
            display: "flex", alignItems: "center", gap: 10, 
            fontSize: 15, fontWeight: 800, 
            cursor: uploading ? "not-allowed" : "pointer", 
            boxShadow: '0 10px 25px -8px rgba(236,72,153,0.5)'
          }}
          className="hover:scale-105 transition-all active:scale-95"
        >
          {uploading ? <Loader2 style={{ width: 20, height: 20, animation: "spin 1s linear infinite" }} /> : <UploadCloud style={{ width: 20, height: 20 }} />}
          Share Memory
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleUpload} />
      </div>

      {loading && photos.length === 0 ? (
         <div style={{ padding: 100, textAlign: "center" }}>
           <Loader2 style={{ width: 44, height: 44, color: "#ec4899", animation: "spin 1s linear infinite", margin: "0 auto" }} />
           <p style={{ marginTop: 20, color: '#64748b', fontSize: 14 }}>Developing photos...</p>
         </div>
      ) : photos.length === 0 ? (
         <div style={{ padding: 80, textAlign: "center", background: "rgba(15,23,42,0.4)", borderRadius: 32, border: "1px dashed rgba(255,255,255,0.08)", backdropFilter: 'blur(20px)' }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: "rgba(236,72,153,0.05)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
               <ImageIcon style={{ width: 36, height: 36, color: "#ec4899" }} />
            </div>
            <h3 style={{ fontSize: 22, fontWeight: 800, color: "white", marginBottom: 12 }}>No memories yet</h3>
            <p style={{ fontSize: 15, color: "#94a3b8", maxWidth: 350, margin: "0 auto 32px", lineHeight: 1.6 }}>This album is empty. Capture special moments and share them with your trip mates!</p>
            <button onClick={() => fileRef.current?.click()} style={{ background: "rgba(255,255,255,0.05)", color: "white", padding: "12px 32px", borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)", fontSize: 15, fontWeight: 700, cursor: "pointer" }} className="hover:bg-white/10 transition-all">Select Image</button>
         </div>
      ) : (
         <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
            {Object.entries(groupedPhotos).map(([day, dayPhotos]: [any, any]) => (
               <div key={day}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 900, color: 'white', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{day}</h2>
                    <div style={{ flex: 1, height: 1, background: 'linear-gradient(to right, rgba(255,255,255,0.1), transparent)' }} />
                  </div>
                  
                  <div style={{ 
                    display: "grid", 
                    gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", 
                    gridAutoRows: "320px",
                    gap: 20 
                  }}>
                     {dayPhotos.map((p: any, idx: number) => (
                        <div 
                          key={p.id} 
                          className="group" 
                          style={{ 
                            borderRadius: 24, 
                            overflow: "hidden", 
                            position: "relative", 
                            cursor: "pointer", 
                            background: "#0f172a",
                            gridRow: idx % 3 === 0 ? "span 2" : "span 1",
                            border: '1px solid rgba(255,255,255,0.05)'
                          }}
                        >
                           <img 
                             src={p.url} 
                             alt="Memory" 
                             style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1)" }} 
                             className="group-hover:scale-110" 
                             onClick={() => setPreview(p.url)}
                           />
                           
                           {/* TOP OVERLAY (Likes) */}
                           <div style={{ position: "absolute", top: 16, right: 16, zIndex: 5 }}>
                              <button 
                                onClick={(e) => { e.stopPropagation(); handleLike(p.id); }}
                                style={{ 
                                  background: "rgba(0,0,0,0.3)", 
                                  backdropFilter: 'blur(10px)',
                                  border: "1px solid rgba(255,255,255,0.1)", 
                                  color: p.isLiked ? "#ec4899" : "white", 
                                  padding: "8px 14px", 
                                  borderRadius: 100, 
                                  display: "flex", 
                                  alignItems: "center", 
                                  gap: 6, 
                                  fontSize: 13, 
                                  fontWeight: 800,
                                  transition: 'all 0.2s'
                                }}
                                className="hover:scale-110 active:scale-90"
                              >
                                <Heart style={{ width: 14, height: 14, fill: p.isLiked ? "#ec4899" : "none" }} />
                                {p.likeCount || 0}
                              </button>
                           </div>

                           {/* BOTTOM OVERLAY */}
                           <div 
                             style={{ 
                               position: "absolute", 
                               inset: 0, 
                               background: "linear-gradient(to top, rgba(0,0,0,0.95), rgba(0,0,0,0.4) 30%, transparent 60%)", 
                               opacity: 0, transition: "opacity 0.3s ease", 
                               display: "flex", flexDirection: "column", 
                               justifyContent: "flex-end", padding: 24 
                             }} 
                             className="group-hover:opacity-100"
                             onClick={() => setPreview(p.url)}
                           >
                              <div style={{ transform: 'translateY(10px)', transition: 'transform 0.3s ease' }} className="group-hover:translate-y-0">
                                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                   <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                                      <img src={p.user?.profileImage || `https://ui-avatars.com/api/?name=${p.user?.username}&background=random`} alt="user" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                   </div>
                                   <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>@{p.user?.username}</span>
                                </div>
                                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 6 }}>
                                   <Calendar style={{ width: 12, height: 12, opacity: 0.6 }} />
                                   {new Date(p.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
               </div>
            ))}
         </div>
      )}

      {/* Preview Modal */}
      {preview && (
         <div 
           className="anim-in"
           onClick={() => setPreview(null)} 
           style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.98)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 40, backdropFilter: 'blur(20px)' }}
         >
            <button style={{ position: "absolute", top: 32, right: 32, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", width: 48, height: 48, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }} className="hover:bg-white/10 transition-all active:scale-90">
               <X style={{ width: 24, height: 24 }} />
            </button>
            <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
               <img 
                 src={preview} 
                 alt="Fullscreen" 
                 style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 24, boxShadow: '0 30px 60px -12px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.05)' }} 
               />
            </div>
         </div>
      )}
    </div>
  );
}
