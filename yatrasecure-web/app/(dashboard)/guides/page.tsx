"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Compass, Map, BookOpen, Sparkles } from "lucide-react";
import { CategoryCharacter } from "@/components/CategoryCharacter";

export default function GuidesIndexPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/guides/${encodeURIComponent(query.trim().toLowerCase())}`);
  }

  const POPULAR = ["Goa", "Manali", "Rishikesh", "Jaipur", "Kerala", "Bali", "Dubai"];

  return (
    <div className="anim-in" style={{ padding: "40px", maxWidth: 900, margin: "0 auto", color: "white", position: 'relative' }}>
      <div style={{ textAlign: "center", marginBottom: 40, marginTop: 40 }}>
         <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
           {/* Rotating globe ring */}
           <svg
             width="80" height="80" viewBox="0 0 80 80"
             style={{ position: 'absolute', inset: 0, animation: 'spin 8s linear infinite', zIndex: 0, opacity: 0.55 }}
             fill="none" xmlns="http://www.w3.org/2000/svg"
           >
             <ellipse cx="40" cy="40" rx="36" ry="14" stroke="url(#grGlobe)" strokeWidth="2.5" strokeDasharray="6 4"/>
             <ellipse cx="40" cy="40" rx="36" ry="36" stroke="url(#grGlobe)" strokeWidth="1.5" strokeDasharray="4 6" opacity="0.5"/>
             <ellipse cx="40" cy="40" rx="14" ry="36" stroke="url(#grGlobe)" strokeWidth="1.5" strokeDasharray="5 5" opacity="0.4"/>
             <defs>
               <linearGradient id="grGlobe" x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
                 <stop offset="0%" stopColor="#10b981"/>
                 <stop offset="100%" stopColor="#06b6d4"/>
               </linearGradient>
             </defs>
           </svg>
           {/* Inner compass icon container */}
           <div style={{ position: 'relative', zIndex: 1, width: 56, height: 56, borderRadius: 16, background: "linear-gradient(135deg, #10b981, #06b6d4)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: '0 0 24px rgba(16,185,129,0.4)' }}>
              <Compass style={{ width: 28, height: 28, color: "white" }} />
           </div>
         </div>
         <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            AI Destination Guides <Sparkles style={{ width: 24, height: 24, color: "#facc15" }} />
         </h1>
         <p style={{ fontSize: 16, color: "#94a3b8", maxWidth: 500, margin: "0 auto" }}>
            Search for any city, country, or location in the world to get a beautifully crafted, highly-detailed travel guide generated instantly.
         </p>
      </div>

      <form onSubmit={handleSearch} style={{ display: "flex", gap: 12, marginBottom: 40 }}>
         <div style={{ flex: 1, position: "relative" }}>
            <Search style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", color: "#64748b", width: 20, height: 20 }} />
            <input 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="e.g. Amsterdam, Tokyo, Ladakh..."
              style={{ width: "100%", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, padding: "20px 20px 20px 48px", color: "white", outline: "none", fontSize: 16, boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
              onFocus={e => e.target.style.borderColor = "rgba(16,185,129,0.5)"}
              onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
            />
         </div>
         <button type="submit" disabled={!query.trim()} style={{ background: "linear-gradient(135deg, #10b981, #06b6d4)", color: "white", border: "none", padding: "0 32px", borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: query.trim() ? "pointer" : "not-allowed", opacity: query.trim() ? 1 : 0.5 }}>
            Explore
         </button>
      </form>

      <div>
         <h3 style={{ fontSize: 14, fontWeight: 700, color: "#cbd5e1", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>Popular Destinations</h3>
         <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
            {POPULAR.map(dest => (
               <button 
                  key={dest}
                  onClick={() => router.push(`/guides/${dest.toLowerCase()}`)}
                  style={{ background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.05)", padding: "12px 20px", borderRadius: 12, color: "white", fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", gap: 8, cursor: "pointer", transition: "all 0.2s" }}
                  className="hover:border-emerald-500/30 hover:bg-slate-800"
               >
                  <Map style={{ width: 14, height: 14, color: "#10b981" }} />
                  {dest}
               </button>
            ))}
         </div>
      </div>
      <CategoryCharacter />
    </div>
  );
}
