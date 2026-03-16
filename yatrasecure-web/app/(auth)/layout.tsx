import { MapPin, Shield, MessageCircle, Wallet, Headphones } from "lucide-react";

const features = [
  { icon: Shield,        title: "Verified Identity",  desc: "Every member is ID-verified. Trust starts here."      },
  { icon: MessageCircle, title: "Real-time Sync",     desc: "WebSockets powered group chat for instant updates."   },
  { icon: Wallet,        title: "Smart Split",        desc: "Automated expense tracking and transparent settlements." },
  { icon: Headphones,    title: "Always Safe",        desc: "24/7 SOS and emergency trip monitoring."              },
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      backgroundColor: "#080b12", // Deeper, more premium dark
      fontFamily: "Inter, sans-serif",
    }}>

      {/* ══ LEFT PANEL (Brand & Value Prop) ══════════════════════════════════ */}
      <div
        className="hidden lg:flex"
        style={{
          width: "45%",
          minHeight: "100vh",
          position: "relative",
          overflow: "hidden",
          background: "#0f1422", // Subtle contrast
          borderRight: "1px solid rgba(255,255,255,0.03)",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "50px 60px",
        }}
      >
        {/* Glow & Art */}
        <div style={{
          position: "absolute", top: "-10%", left: "-10%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 60%)",
          filter: "blur(40px)", pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", right: "-10%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 60%)",
          filter: "blur(60px)", pointerEvents: "none",
        }} />
        
        {/* Top: Logo */}
        <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            width: 38, height: 38, borderRadius: 12,
            background: "linear-gradient(135deg, #f97316, #ea580c)",
            boxShadow: "0 4px 16px rgba(249,115,22,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MapPin style={{ width: 18, height: 18, color: "white" }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: "-0.02em" }}>
            YatraSecure
          </span>
        </div>

        {/* Middle: Content */}
        <div style={{ position: "relative", zIndex: 1, marginTop: 40, marginBottom: 40 }}>
          <h1 style={{
            fontSize: "clamp(36px, 4vw, 48px)", fontWeight: 900, color: "white",
            lineHeight: 1.1, letterSpacing: "-0.035em", marginBottom: 20,
          }}>
            Travel together.<br />
            <span style={{
              background: "linear-gradient(135deg, #fbbf24, #f97316)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>
              Zero stress.
            </span>
          </h1>

          <p style={{
            fontSize: 16, color: "#8b98ac",
            lineHeight: 1.6, maxWidth: 400, marginBottom: 50,
            fontWeight: 400,
          }}>
            The modern operating system for group travel. Plan, chat, and split expenses securely in one place.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
            {features.map(({ icon: Icon, title, desc }) => (
              <div key={title} style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                  background: "rgba(249,115,22,0.06)", // Extremely subtle orange
                  border: "1px solid rgba(249,115,22,0.15)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon style={{ width: 18, height: 18, color: "#f97316" }} />
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#e2e8f0", marginBottom: 4 }}>{title}</p>
                  <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom: Review/Stats */}
        <div style={{ position: "relative", zIndex: 1, borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
             <div style={{ display: "flex" }}>
               {[1,2,3].map(i => (
                 <div key={i} style={{
                   width: 32, height: 32, borderRadius: "50%",
                   background: "linear-gradient(135deg,#f97316,#fbbf24)",
                   border: "2px solid #0f1422",
                   marginLeft: i > 1 ? -12 : 0,
                   display: "flex", alignItems: "center", justifyContent: "center",
                   fontSize: 10, fontWeight: 800, color: "white"
                 }}>
                   {["RS", "PM", "AK"][i-1]}
                 </div>
               ))}
             </div>
             <div>
               <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>
                 {[1,2,3,4,5].map(i => <Shield key={i} style={{ width: 12, height: 12, color: "#fbbf24", fill: "#fbbf24" }} />)}
               </div>
               <p style={{ fontSize: 12, color: "#64748b", margin: 0, fontWeight: 500 }}>
                 Loved by <span style={{ color: "white", fontWeight: 700 }}>5,000+</span> travelers
               </p>
             </div>
          </div>
        </div>
      </div>

      {/* ══ RIGHT PANEL (Forms) ═══════════════════════════════════════════════ */}
      <div style={{
        flex: 1,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#080b12",
        overflowY: "auto",
        padding: "40px 24px",
        position: "relative",
      }}>
        {/* Mobile logo */}
        <div
          className="lg:hidden"
          style={{
            position: "absolute", top: 24, left: "50%",
            transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <div style={{
            width: 30, height: 30, borderRadius: 9,
            background: "linear-gradient(135deg,#f97316,#fbbf24)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <MapPin style={{ width: 15, height: 15, color: "white" }} />
          </div>
          <span style={{ fontWeight: 800, color: "white", fontSize: 15 }}>YatraSecure</span>
        </div>

        {/* Form content */}
        <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
