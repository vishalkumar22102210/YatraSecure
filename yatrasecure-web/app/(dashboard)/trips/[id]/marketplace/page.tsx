"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, ShoppingBag, Loader2, Star, MapPin, PlusCircle } from "lucide-react";
import { API_BASE_URL, getAccessToken } from "@/app/lib/api";

interface MarketplaceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  rating: number;
  location: string;
}

interface MarketplaceCategory {
  title: string;
  items: MarketplaceItem[];
}

export default function MarketplacePage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<MarketplaceCategory[]>([]);

  useEffect(() => {
    loadData();
  }, [tripId]);

  async function loadData() {
    setLoading(true);
    try {
      const token = getAccessToken();
      
      // Load Trip Data
      const tripRes = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!tripRes.ok) throw new Error("Trip not found");
      const tripData = await tripRes.json();
      setTrip(tripData);

      // Load Marketplace Recommendations
      const mktRes = await fetch(`/api/trips/${tripId}/marketplace`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      const mktData = await mktRes.json();
      if (!mktRes.ok) throw new Error(mktData.message || "Failed to load marketplace");
      
      setCategories(mktData.categories || []);
    } catch (e: any) {
      toast.error(e.message || "Failed to load marketplace");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="anim-in" style={{ padding: "32px", maxWidth: 1200, margin: "0 auto", color: "white" }}>
      {/* HEADER */}
      <button onClick={() => router.push(`/trips/${tripId}`)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }} className="hover:text-white transition-colors">
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Trip
      </button>

      <div style={{ marginBottom: 32, display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: "linear-gradient(135deg, #10b981, #3b82f6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ShoppingBag style={{ width: 24, height: 24, color: "white" }} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: "0 0 4px", color: "white" }}>Autonomous Travel Marketplace</h1>
          <p style={{ fontSize: 14, color: "#94a3b8", margin: 0 }}>Discover AI-curated experiences, guides, and stays for <strong style={{ color: "#e2e8f0" }}>{trip?.toCity || 'your destination'}</strong></p>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 60, textAlign: "center" }}>
          <Loader2 style={{ width: 32, height: 32, color: "#10b981", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
          <p style={{ color: "#94a3b8", fontSize: 15 }}>AI is analyzing trends and curating the best local experiences...</p>
        </div>
      ) : categories.length === 0 ? (
        <div style={{ padding: 60, textAlign: "center", background: "rgba(15,23,42,0.5)", borderRadius: 16, border: "1px dashed rgba(255,255,255,0.1)" }}>
          <p style={{ color: "#94a3b8", fontSize: 15 }}>No recommendations found right now. Try again later!</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
           {categories.map((cat, idx) => (
             <div key={idx}>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: "white", paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)", marginBottom: 20 }}>
                   {cat.title}
                </h2>
                {cat.items.length === 0 ? (
                   <p style={{ color: "#64748b", fontSize: 14 }}>No highly-rated items found in this category.</p>
                ) : (
                   <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 20 }}>
                      {cat.items.map((item) => (
                         <div key={item.id} style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, overflow: "hidden", display: "flex", flexDirection: "column", transition: "all 0.2s" }} className="hover:border-emerald-500/30 hover:bg-slate-800/80">
                            <div style={{ padding: 20, flex: 1, display: "flex", flexDirection: "column" }}>
                               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 8 }}>
                                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0, color: "white", lineHeight: 1.3 }}>{item.name}</h3>
                                  <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(250,204,21,0.1)", color: "#facc15", padding: "4px 8px", borderRadius: 8, fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
                                    <Star style={{ width: 12, height: 12, fill: "currentColor" }} /> {item.rating}
                                  </div>
                               </div>
                               
                               <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#94a3b8", fontSize: 12, marginBottom: 12 }}>
                                  <MapPin style={{ width: 12, height: 12 }} /> <span>{item.location}</span>
                               </div>

                               <p style={{ fontSize: 13, color: "#cbd5e1", margin: "0 0 16px", lineHeight: 1.5, flex: 1 }}>{item.description}</p>
                               
                               <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                                  <span style={{ fontSize: 16, fontWeight: 800, color: "#10b981" }}>₹{item.price.toLocaleString()}</span>
                                  <button style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", color: "#34d399", padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 6, cursor: "pointer", transition: "all 0.2s" }} className="hover:bg-emerald-500/20" onClick={(e) => {
                                     toast.success("Added to itinerary Ideas!");
                                  }}>
                                     <PlusCircle style={{ width: 14, height: 14 }} /> Add
                                  </button>
                               </div>
                            </div>
                         </div>
                      ))}
                   </div>
                )}
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
