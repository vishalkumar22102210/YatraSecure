"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  ArrowLeft, MapPin, Calendar, Wallet, CheckCircle2, 
  Coffee, Compass, Loader2, Navigation, AlertCircle
} from "lucide-react";
import { getAccessToken } from "@/app/lib/api";

export default function DestinationGuidePage() {
  const params = useParams();
  const router = useRouter();
  const destinationStr = typeof params.destination === 'string' ? decodeURIComponent(params.destination) : '';
  const capitalizedDest = destinationStr.charAt(0).toUpperCase() + destinationStr.slice(1);

  const [guide, setGuide] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchGuide();
  }, [destinationStr]);

  async function fetchGuide() {
    setLoading(true);
    setError("");
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/guides/${encodeURIComponent(destinationStr)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load guide");
      
      setGuide(data);
    } catch (e: any) {
      setError(e.message);
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center", maxWidth: 600, margin: "100px auto" }}>
        <div style={{ width: 80, height: 80, borderRadius: 24, background: "rgba(16,185,129,0.1)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
           <Loader2 style={{ width: 40, height: 40, color: "#10b981", animation: "spin 1.5s linear infinite" }} />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: "white", marginBottom: 8 }}>Generating Guide...</h2>
        <p style={{ color: "#94a3b8", fontSize: 16 }}>AI is analyzing travel data for <strong style={{color:"white"}}>{capitalizedDest}</strong></p>
      </div>
    );
  }

  if (error || !guide) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <AlertCircle style={{ width: 48, height: 48, color: "#ef4444", margin: "0 auto 16px" }} />
        <h2 style={{ color: "white", fontSize: 20 }}>Oops! Failed to generate guide</h2>
        <button onClick={() => router.push("/guides")} style={{ marginTop: 20, background: "#1e293b", color: "white", border: "none", padding: "10px 20px", borderRadius: 8, cursor: "pointer" }}>Go Back</button>
      </div>
    );
  }

  return (
    <div className="anim-in" style={{ padding: "32px", maxWidth: 1000, margin: "0 auto", color: "white" }}>
      <button onClick={() => router.push("/guides")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 13, marginBottom: 24, padding: 0 }} className="hover:text-white transition-colors">
        <ArrowLeft style={{ width: 16, height: 16 }} /> Discover other places
      </button>

      {/* Hero */}
      <div style={{ position: "relative", borderRadius: 24, background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(59,130,246,0.2))", border: "1px solid rgba(16,185,129,0.3)", padding: "48px 32px", marginBottom: 40, overflow: "hidden" }}>
         <div style={{ position: "relative", zIndex: 1 }}>
            <h1 style={{ fontSize: 42, fontWeight: 900, margin: "0 0 16px", color: "white", letterSpacing: "-0.02em" }}>
               {guide.destination}
            </h1>
            <p style={{ fontSize: 16, color: "#e2e8f0", maxWidth: 600, lineHeight: 1.6, margin: "0 0 24px" }}>
               {guide.overview}
            </p>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
               <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(15,23,42,0.6)", padding: "8px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Calendar style={{ width: 16, height: 16, color: "#10b981" }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{guide.bestTime}</span>
               </div>
               <div style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(15,23,42,0.6)", padding: "8px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Wallet style={{ width: 16, height: 16, color: "#facc15" }} />
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Budget: {guide.budgetLevel}</span>
               </div>
            </div>
         </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: 32 }}>
         {/* Left Col */}
         <div>
            {/* Top Places */}
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
               <MapPin style={{ color: "#ef4444" }} /> Must-Visit Places
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 40 }}>
               {guide.topPlaces?.map((p: any, i: number) => (
                  <div key={i} style={{ background: "rgba(15,23,42,0.6)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 20, display: "flex", gap: 16 }}>
                     <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                           <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>{p.name}</h3>
                           <span style={{ background: "rgba(255,255,255,0.05)", padding: "4px 10px", borderRadius: 8, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>{p.type}</span>
                        </div>
                        <p style={{ fontSize: 14, color: "#cbd5e1", margin: 0, lineHeight: 1.5 }}>{p.description}</p>
                     </div>
                  </div>
               ))}
            </div>

            {/* 3 Day Itinerary */}
            <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
               <Navigation style={{ color: "#3b82f6" }} /> 3-Day Action Plan
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
               {guide.itinerary3Days?.map((day: any, i: number) => (
                  <div key={i} style={{ borderLeft: "2px solid rgba(59,130,246,0.3)", paddingLeft: 24, position: "relative" }}>
                     <div style={{ position: "absolute", left: -9, top: 0, width: 16, height: 16, borderRadius: "50%", background: "#3b82f6", border: "4px solid #0f172a" }} />
                     <h3 style={{ fontSize: 16, fontWeight: 800, color: "white", margin: "0 0 4px" }}>Day {day.day}: {day.title}</h3>
                     <ul style={{ margin: "12px 0 0", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
                        {day.activities?.map((act: string, j: number) => (
                           <li key={j} style={{ color: "#cbd5e1", fontSize: 14, lineHeight: 1.5 }}>{act}</li>
                        ))}
                     </ul>
                  </div>
               ))}
            </div>
         </div>

         {/* Right Col */}
         <div>
            {/* Local Food */}
            <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 24, marginBottom: 24 }}>
               <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <Coffee style={{ width: 18, height: 18, color: "#f97316" }} /> 
                  Local Food & Dishes
               </h3>
               <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {guide.localFood?.map((f: string, i: number) => (
                     <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316" }} />
                        <span style={{ fontSize: 14, color: "#e2e8f0" }}>{f}</span>
                     </div>
                  ))}
               </div>
            </div>

            {/* Travel Tips */}
            <div style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 16, padding: 24 }}>
               <h3 style={{ fontSize: 16, fontWeight: 800, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <Compass style={{ width: 18, height: 18, color: "#a78bfa" }} /> 
                  Pro Travel Tips
               </h3>
               <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {guide.travelTips?.map((tip: string, i: number) => (
                     <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "rgba(255,255,255,0.03)", padding: 12, borderRadius: 12 }}>
                        <CheckCircle2 style={{ width: 16, height: 16, color: "#a78bfa", marginTop: 2, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: "#cbd5e1", lineHeight: 1.5 }}>{tip}</span>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
