"use client";

import React from "react";

declare global {
  interface Window {
    setCategoryPalette?: (category: string, persist?: boolean) => void;
  }
}

/* ─── Shared Context ──────────────────────────────────────────────────────── */
export const TravelThemeContext = React.createContext<{ category: string }>({ category: "default" });

/* ─── Splash Data ─────────────────────────────────────────────────────────── */
export const SPLASH_DATA: Record<string, { image: string; quote: string }> = {
  forest:    { image: "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80", quote: "In every walk with nature, one receives far more than he seeks." },
  mountains: { image: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80", quote: "The mountains are calling and I must go." },
  beach:     { image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80", quote: "The ocean stirs the heart, inspires the imagination." },
  desert:    { image: "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80", quote: "The desert is not a place of emptiness — it is a place of everything." },
  city:      { image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600&q=80", quote: "Cities have the capability of providing something for everybody." },
  adventure: { image: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=80", quote: "Life is either a daring adventure or nothing at all." },
};

/* ─── Rotating Image Sets ─────────────────────────────────────────────────── */
export const CATEGORY_IMAGE_SETS: Record<string, string[]> = {
  forest:    ["https://images.unsplash.com/photo-1448375240586-882707db888b?w=1600&q=80","https://images.unsplash.com/photo-1542401886-65d6c61db217?w=1600&q=80","https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?w=1600&q=80"],
  mountains: ["https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&q=80","https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=1600&q=80","https://images.unsplash.com/photo-1476610182048-b716b8518aae?w=1600&q=80"],
  beach:     ["https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1600&q=80","https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=1600&q=80","https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1600&q=80"],
  desert:    ["https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1600&q=80","https://images.unsplash.com/photo-1547234935-80c7145ec969?w=1600&q=80","https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1600&q=80"],
  city:      ["https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1600&q=80","https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1600&q=80","https://images.unsplash.com/photo-1514565131-fce0801e6785?w=1600&q=80"],
  adventure: ["https://images.unsplash.com/photo-1551632811-561732d1e306?w=1600&q=80","https://images.unsplash.com/photo-1539635278303-d4002c07eae3?w=1600&q=80","https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1600&q=80"],
};

/* ─── Helper ──────────────────────────────────────────────────────────────── */
export function normalizeCategoryKey(cat: string): string | null {
  const k = (cat || "").toLowerCase();
  if (k.includes("forest") || k.includes("nature"))  return "forest";
  if (k.includes("mountain"))                          return "mountains";
  if (k.includes("beach") || k.includes("ocean"))     return "beach";
  if (k.includes("desert") || k.includes("dune"))     return "desert";
  if (k.includes("city") || k.includes("urban"))      return "city";
  if (k.includes("adventure"))                         return "adventure";
  return null;
}

/* ─── Splash Screen ───────────────────────────────────────────────────────── */
function SplashScreen({ cat, fading, showBtn, onSkip }: {
  cat: string; fading: boolean; showBtn: boolean; onSkip: () => void;
}) {
  const data = SPLASH_DATA[cat];
  if (!data) return null;
  const label = cat.charAt(0).toUpperCase() + cat.slice(1);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, opacity: fading ? 0 : 1, transition: "opacity 0.4s ease-out" }}>
      {/* BG image */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${data.image})`, backgroundSize: "cover", backgroundPosition: "center" }} />
      {/* Overlay */}
      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)" }} />
      {/* Content */}
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, textAlign: "center", gap: 28 }}>
        <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "0.25em", textTransform: "uppercase", color: "var(--accent)", background: "rgba(0,0,0,0.5)", padding: "6px 20px", borderRadius: 999, border: "1px solid var(--accent)" }}>
          {label}
        </div>
        <blockquote style={{ fontSize: "clamp(22px,4vw,36px)", fontStyle: "italic", fontFamily: "'Georgia','Times New Roman',serif", color: "white", maxWidth: 780, lineHeight: 1.45, margin: 0, textShadow: "0 2px 24px rgba(0,0,0,0.6)" }}>
          "{data.quote}"
        </blockquote>
        <div style={{ opacity: showBtn ? 1 : 0, transform: showBtn ? "translateY(0)" : "translateY(12px)", transition: "opacity 0.5s ease, transform 0.5s ease", marginTop: 4 }}>
          <button onClick={onSkip} style={{ padding: "14px 44px", borderRadius: 999, background: "rgba(255,255,255,0.12)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,0.35)", color: "white", fontSize: 16, fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em", transition: "background 0.2s" }}>
            Let's Explore →
          </button>
        </div>
      </div>
      {/* Progress bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: "rgba(255,255,255,0.12)" }}>
        <div style={{ height: "100%", background: "var(--accent)", width: "0%", animation: "splashFill 5s linear forwards" }} />
      </div>
      <style>{`@keyframes splashFill { from { width:0% } to { width:100% } }`}</style>
    </div>
  );
}

/* ─── Provider ────────────────────────────────────────────────────────────── */
export function TravelThemeProvider({ children }: { children: React.ReactNode }) {
  const [category, setCategory] = React.useState("default");
  const [splash, setSplash]     = React.useState<{ cat: string; fading: boolean } | null>(null);
  const [showBtn, setShowBtn]   = React.useState(false);

  const splashTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const btnTimer    = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const applyFn     = React.useRef<(() => void) | null>(null);

  // Keep closeSplash stable via ref so it can be called from inside the effect
  const closeSplashRef = React.useRef<() => void>(() => {});
  closeSplashRef.current = () => {
    if (splashTimer.current) clearTimeout(splashTimer.current);
    if (btnTimer.current)    clearTimeout(btnTimer.current);
    setSplash(prev => prev ? { ...prev, fading: true } : null);
    setShowBtn(false);
    setTimeout(() => {
      setSplash(null);
      if (applyFn.current) { applyFn.current(); applyFn.current = null; }
    }, 400);
  };

  React.useEffect(() => {
    const root = document.documentElement;

    const basePalette: Record<string, string> = {
      "--accent":            "#38BDF8",
      "--accent-hover":      "#0EA5E9",
      "--cta-gradient":      "linear-gradient(135deg, #38BDF8, #0284C7)",
      "--shadow":            "0 4px 24px 0 rgba(56,189,248,0.08)",
      "--category-gradient": "linear-gradient(135deg, #38BDF8 0%, #0284C7 100%)",
    };

    const palettes: Record<string, Record<string, string>> = {
      mountains: { "--accent":"#4A6FA5","--accent-hover":"#6B8BAF","--cta-gradient":"linear-gradient(135deg,#4A6FA5,#6B8BAF)","--shadow":"0 4px 24px 0 rgba(74,111,165,0.15)","--category-gradient":"linear-gradient(135deg,#4A6FA5 0%,#F8FAFC 100%)" },
      beach:     { "--accent":"#00B4D8","--accent-hover":"#0096B7","--cta-gradient":"linear-gradient(135deg,#006994,#00B4D8)","--shadow":"0 4px 24px 0 rgba(0,180,216,0.15)","--category-gradient":"linear-gradient(135deg,#006994 0%,#00B4D8 50%,#F5DEB3 100%)" },
      forest:    { "--accent":"#52B788","--accent-hover":"#40916C","--cta-gradient":"linear-gradient(135deg,#2D6A4F,#52B788)","--shadow":"0 4px 24px 0 rgba(82,183,136,0.15)","--category-gradient":"linear-gradient(135deg,#2D6A4F 0%,#52B788 50%,#795548 100%)" },
      desert:    { "--accent":"#E9C46A","--accent-hover":"#C1440E","--cta-gradient":"linear-gradient(135deg,#C1440E,#E9C46A)","--shadow":"0 4px 24px 0 rgba(193,68,14,0.15)","--category-gradient":"linear-gradient(135deg,#C1440E 0%,#E9C46A 50%,#D4855A 100%)" },
      city:      { "--accent":"#7B2FBE","--accent-hover":"#9B51E0","--cta-gradient":"linear-gradient(135deg,#1A1A4E,#7B2FBE)","--shadow":"0 4px 24px 0 rgba(123,47,190,0.15)","--category-gradient":"linear-gradient(135deg,#1A1A4E 0%,#7B2FBE 50%,#C0C0C0 100%)" },
      adventure: { "--accent":"#FF6B35","--accent-hover":"#E85D25","--cta-gradient":"linear-gradient(135deg,#8B0000,#FF6B35)","--shadow":"0 4px 24px 0 rgba(255,107,53,0.15)","--category-gradient":"linear-gradient(135deg,#8B0000 0%,#FF6B35 50%,#111111 100%)" },
    };

    function applyNow(target: string, persist: boolean) {
      if (persist) { try { localStorage.setItem("active_palette", target); } catch (_) {} }
      const k = target.toLowerCase();
      const palette = palettes[k] ?? (
        k.includes("mountain") ? palettes.mountains :
        k.includes("beach") || k.includes("ocean") ? palettes.beach :
        k.includes("forest") || k.includes("nature") ? palettes.forest :
        k.includes("desert") || k.includes("dune") ? palettes.desert :
        k.includes("city")   || k.includes("urban") ? palettes.city :
        k === "default" || k === "all" || k === "" ? null : palettes.adventure
      );
      const merged = { ...basePalette, ...(palette ?? {}) };
      Object.entries(merged).forEach(([k, v]) => root.style.setProperty(k, v));
      root.setAttribute("data-category", target);
      setCategory(target);
    }

    let persisted = "default";
    try { persisted = localStorage.getItem("active_palette") || "default"; } catch (_) {}
    applyNow(persisted, false); // initial load — no splash

    window.setCategoryPalette = (category: string, persist = false) => {
      const target = category || "default";
      const splashKey = normalizeCategoryKey(target);

      // Show splash only when persisting a real category
      if (persist && splashKey) {
        applyFn.current = () => applyNow(target, true);
        setSplash({ cat: splashKey, fading: false });
        setShowBtn(false);
        btnTimer.current    = setTimeout(() => setShowBtn(true), 2000);
        splashTimer.current = setTimeout(() => closeSplashRef.current(), 5000);
      } else {
        applyNow(target, persist);
      }
    };

    // Counter animation
    const counters = document.querySelectorAll<HTMLElement>("[data-count]");
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const el = entry.target as HTMLElement;
        const target = Number(el.dataset.count || "0");
        if (!target || el.dataset.animated === "true") return;
        el.dataset.animated = "true";
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / 1200);
          const e = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.floor(target * e).toLocaleString("en-IN");
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        io.unobserve(el);
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      if (splashTimer.current) clearTimeout(splashTimer.current);
      if (btnTimer.current)    clearTimeout(btnTimer.current);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TravelThemeContext.Provider value={{ category }}>
      {splash && (
        <SplashScreen
          cat={splash.cat}
          fading={splash.fading}
          showBtn={showBtn}
          onSkip={() => closeSplashRef.current()}
        />
      )}
      <ImmersiveEffects category={category} />
      {children}
    </TravelThemeContext.Provider>
  );
}

/* ─── Immersive Effects (unchanged logic) ─────────────────────────────────── */
function ImmersiveEffects({ category }: { category: string }) {
  if (!category || category === "default" || category === "all") return null;

  const isForest    = category.includes("forest")    || category.includes("nature");
  const isDesert    = category.includes("desert")    || category.includes("dune");
  const isBeach     = category.includes("beach")     || category.includes("ocean");
  const isMountain  = category.includes("mountain");
  const isCity      = category.includes("city")      || category.includes("urban");
  const isAdventure = category.includes("adventure");

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      {isForest && (<>
        <div className="forest-mist" />
        {Array.from({ length: 18 }).map((_, i) => (
          <div key={i} className="forest-leaf" style={{ left:`${Math.random()*100}%`, animationDuration:`${8+Math.random()*7}s`, animationDelay:`-${Math.random()*15}s` }} />
        ))}
      </>)}
      {isDesert && (<>
        <div className="desert-vignette" />
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="desert-sand" style={{ left:`${Math.random()*100}%`, animationDuration:`${12+Math.random()*8}s`, animationDelay:`-${Math.random()*20}s` }} />
        ))}
      </>)}
      {isBeach && (<>
        <svg className="beach-wave" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="var(--accent)" fillOpacity="0.08" d="M0,192L48,197.3C96,203,192,213,288,229.3C384,245,480,267,576,250.7C672,235,768,181,864,181.3C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
        {Array.from({ length: 25 }).map((_, i) => (
          <div key={i} className="beach-bubble" style={{ left:`${Math.random()*100}%`, width:`${3+Math.random()*3}px`, height:`${3+Math.random()*3}px`, animationDuration:`${6+Math.random()*6}s`, animationDelay:`-${Math.random()*10}s` }} />
        ))}
      </>)}
      {isMountain && (<>
        <div className="mountain-mist" />
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="mountain-snow" style={{ left:`${Math.random()*100}%`, animationDuration:`${15+Math.random()*10}s`, animationDelay:`-${Math.random()*25}s` }} />
        ))}
      </>)}
      {isCity && (<>
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="city-bokeh" style={{ left:`${Math.random()*100}%`, top:`${Math.random()*100}%`, width:`${20+Math.random()*40}px`, height:`${20+Math.random()*40}px`, animationDuration:`${8+Math.random()*8}s`, animationDelay:`-${Math.random()*10}s` }} />
        ))}
      </>)}
      {isAdventure && (<>
        {Array.from({ length: 20 }).map((_, i) => (
          <div key={i} className="adventure-spark" style={{ left:`${Math.random()*100}%`, animationDuration:`${4+Math.random()*4}s`, animationDelay:`-${Math.random()*8}s` }} />
        ))}
      </>)}
    </div>
  );
}