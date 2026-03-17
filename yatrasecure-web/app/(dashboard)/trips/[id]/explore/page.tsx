"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Map, Search, Sparkles, Loader2, Compass, PlusCircle, CheckCircle2 } from "lucide-react";
import { API_BASE_URL, getAccessToken } from "@/app/lib/api";

export default function ExploreGemsPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetchingTrip, setFetchingTrip] = useState(true);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    loadTrip();
  }, [tripId]);

  async function loadTrip() {
    setFetchingTrip(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Trip not found");
      const data = await res.json();
      setTrip(data);
    } catch (error) {
      toast.error("Could not load trip");
      router.push("/trips");
    } finally {
      setFetchingTrip(false);
    }
  }

  async function handleDiscover() {
    if (loading) return;
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/trips/${tripId}/explore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ query: query.trim() })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to discover places");

      setRecommendations(data.recommendations || []);
      toast.success("Discovered new places!");
    } catch (e: any) {
      toast.error(e.message || "Failed to get AI recommendations");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleDiscover();
  }

  if (fetchingTrip) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", background: "var(--bg)" }}>
        <Loader2 style={{ width: 32, height: 32, color: "var(--accent)", animation: "spin 1s linear infinite" }} />
      </div>
    );
  }

  return (
    <div className="anim-in" style={{ padding: "32px", maxWidth: 1000, margin: "0 auto", color: "white" }}>
      {/* HEADER */}
      <button onClick={() => router.push(`/trips/${tripId}`)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }} className="hover:text-white transition-colors">
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Trip
      </button>

      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <Compass style={{ width: 24, height: 24, color: "var(--accent)" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: "white" }}>AI Exploration Engine</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>Discover hidden gems and underrated places near <strong style={{ color: "#e2e8f0" }}>{trip?.toCity}</strong></p>
        </div>
      </div>

      {/* SEARCH BAR */}
      <div style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: "24px", marginBottom: 32, boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
         <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1, position: "relative" }}>
               <Search style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#64748b", width: 18, height: 18 }} />
               <input 
                 value={query}
                 onChange={(e) => setQuery(e.target.value)}
                 onKeyDown={handleKeyDown}
                 placeholder="e.g. 'Hidden cafes near the beach', 'Quiet spots for sunset', 'Local hidden waterfalls'"
                 style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "14px 16px 14px 44px", color: "white", outline: "none", fontSize: 15 }}
               />
            </div>
            <button 
               onClick={handleDiscover}
               disabled={loading}
               style={{ background: loading ? "rgba(139,92,246,0.5)" : "linear-gradient(135deg, #8b5cf6, #d946ef)", border: "none", color: "white", padding: "0 24px", borderRadius: 12, fontWeight: 600, fontSize: 15, cursor: loading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8, transition: "all 0.2s" }}
               className="hover:opacity-90"
            >
               {loading ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : <Sparkles style={{ width: 18, height: 18 }} />}
               Discover
            </button>
         </div>
      </div>

      {/* RESULTS GRID */}
      {recommendations.length > 0 && (
         <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 20 }}>
            {recommendations.map((gem: any) => (
               <div key={gem.id} style={{ background: "rgba(15,23,42,0.8)", borderRadius: 16, border: "1px solid rgba(139,92,246,0.2)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div style={{ height: 140, background: "rgba(139,92,246,0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                     <Map style={{ width: 40, height: 40, color: "#8b5cf6", opacity: 0.5 }} />
                  </div>
                  <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                     <h3 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 6px", color: "white" }}>{gem.name}</h3>
                     <p style={{ fontSize: 13, color: "#94a3b8", margin: "0 0 16px", lineHeight: 1.5 }}>{gem.shortDescription}</p>
                     
                     <div style={{ marginBottom: 16 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 12 }}>
                           <span style={{ color: "#64748b" }}>Distance</span>
                           <span style={{ color: "#c084fc", fontWeight: 600 }}>{gem.distance}</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                           <span style={{ color: "#64748b" }}>Best Time</span>
                           <span style={{ color: "#e2e8f0" }}>{gem.bestTime}</span>
                        </div>
                     </div>

                     <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                        {gem.activities?.map((act: string, idx: number) => (
                           <span key={idx} style={{ background: "rgba(139,92,246,0.1)", color: "#c084fc", padding: "4px 10px", borderRadius: 100, fontSize: 11, fontWeight: 600 }}>
                              {act}
                           </span>
                        ))}
                     </div>

                     <div style={{ background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 8, marginTop: "auto" }}>
                        <p style={{ fontSize: 11, color: "#fcd34d", fontWeight: 600, margin: "0 0 4px", textTransform: "uppercase" }}>Tips</p>
                        <p style={{ fontSize: 12, color: "#cbd5e1", margin: 0, lineHeight: 1.4 }}>{gem.tips}</p>
                     </div>

                     <button style={{ marginTop: 16, width: "100%", background: "none", border: "1px solid rgba(139,92,246,0.3)", color: "#c084fc", padding: "10px", borderRadius: 8, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", transition: "all 0.2s" }} className="hover:bg-purple-500/10" onClick={(e) => {
                       toast.success("Added to your Itinerary Ideas!");
                       const target = e.currentTarget;
                       target.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg> Saved`;
                       target.style.borderColor = "#22c55e";
                       target.style.color = "#22c55e";
                     }}>
                        <PlusCircle style={{ width: 16, height: 16 }} /> Save Idea
                     </button>
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
}
