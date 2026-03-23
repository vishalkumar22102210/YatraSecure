"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Compass, Mountain, Landmark, Sunset, 
  Palmtree, Zap, Wallet, Heart, ArrowRight,
  Sparkles, Star, RefreshCw, Loader2, Plus, Users, Search
} from "lucide-react";
import toast from "react-hot-toast";
import { fetchWithAuth } from "@/app/lib/api";

type Question = {
  id: number;
  text: string;
  options: { label: string; icon: any; value: string; color: string }[];
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What's your ideal travel pace?",
    options: [
      { label: "High energy", icon: Zap, value: "active", color: "#f97316" },
      { label: "Slow & chill", icon: Sunset, value: "relaxed", color: "#7c3aed" },
      { label: "A mix of both", icon: Compass, value: "balanced", color: "#3b82f6" },
    ]
  },
  {
    id: 2,
    text: "Where do you find your peace?",
    options: [
      { label: "Mountains", icon: Mountain, value: "mountains", color: "#22c55e" },
      { label: "Beaches", icon: Palmtree, value: "beach", color: "#06b6d4" },
      { label: "City lights", icon: Landmark, value: "city", color: "#e11d48" },
    ]
  },
  {
    id: 3,
    text: "How do you manage your budget?",
    options: [
      { label: "Economy", icon: Wallet, value: "budget", color: "#fbbf24" },
      { label: "Luxury", icon: Heart, value: "luxury", color: "#ec4899" },
      { label: "Balanced", icon: Star, value: "mid", color: "#8b5cf6" },
    ]
  }
];

const PERSONALITIES: Record<string, { title: string; desc: string; icon: any; color: string }> = {
  "Adventure Seeker": {
    title: "Adventure Seeker",
    desc: "You live for the thrill! First to sign up for trekking, surfing, or unknown terrains.",
    icon: Mountain,
    color: "#f97316"
  },
  "Luxury Traveler": {
    title: "Luxury Traveler",
    desc: "You believe travel is about pampering yourself. High-end stays are your go-to.",
    icon: Sparkles,
    color: "#ec4899"
  },
  "Culture Enthusiast": {
    title: "Culture Enthusiast",
    desc: "Museums, historic landmarks, and local traditions drive your curiosity.",
    icon: Landmark,
    color: "#3b82f6"
  },
  "Budget Explorer": {
    title: "Budget Explorer",
    desc: "Pro at finding hidden gems without breaking the bank. Journey over fancy stay.",
    icon: Wallet,
    color: "#fbbf24"
  },
  "Soul Searcher": {
    title: "Soul Searcher",
    desc: "Travel is slow, spiritual, and deeply personal. You love sunsets and solo moments.",
    icon: Sunset,
    color: "#7c3aed"
  }
};

export default function PersonalityQuiz({ onComplete, initialPersonality }: { onComplete: (p: string) => void; initialPersonality?: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0); 
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(false);
  const [finalPersonality, setFinalPersonality] = useState(initialPersonality || "");

  const handleAnswer = (qId: number, val: string) => {
    const nextAnswers = { ...answers, [qId]: val };
    setAnswers(nextAnswers);
    if (step < QUESTIONS.length) {
      setStep(step + 1);
    }
  };

  const calculateResult = async () => {
    setLoading(true);
    let result = "Soul Searcher";
    const a1 = answers[1];
    const a2 = answers[2];
    const a3 = answers[3];

    if (a1 === "active" && a2 === "mountains") result = "Adventure Seeker";
    else if (a3 === "luxury") result = "Luxury Traveler";
    else if (a2 === "city") result = "Culture Enthusiast";
    else if (a3 === "budget") result = "Budget Explorer";
    else result = "Soul Searcher";

    try {
      await fetchWithAuth("/users/me", {
        method: "PATCH",
        body: JSON.stringify({ travelPersonality: result })
      });
      setFinalPersonality(result);
      onComplete(result);
      setStep(0);
    } catch (e) {
      toast.error("Failed to save personality");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === QUESTIONS.length + 1 && !loading && !finalPersonality) {
        // Trigger calc
    }
  }, [step, loading, finalPersonality]);

  // COMPLETE STATE: Compact Card with Quick Actions
  if (finalPersonality && step === 0) {
     const p = PERSONALITIES[finalPersonality] || PERSONALITIES["Soul Searcher"];
     const Icon = p.icon;
     return (
        <div style={{ 
          padding: 24, 
          background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', 
          borderRadius: 20, 
          border: '1px solid rgba(255,255,255,0.05)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
        }} className="card">
           <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ 
                  width: 48, height: 48, borderRadius: 14, 
                  background: `linear-gradient(135deg, ${p.color}20, ${p.color}05)`, 
                  border: `1px solid ${p.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 12px ${p.color}20`
                }}>
                   <Icon style={{ width: 24, height: 24, color: p.color }} />
                </div>
                <div>
                   <p style={{ fontSize: 11, fontWeight: 800, color: p.color, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>Persona Matched</p>
                   <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: '2px 0 4px 0' }}>{p.title}</h3>
                </div>
              </div>
              <button 
                onClick={() => { setFinalPersonality(""); setStep(1); }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', padding: '8px', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s' }}
                className="hover:text-white hover:bg-white/10"
                title="Retake Quiz"
              >
                <RefreshCw style={{ width: 14, height: 14 }} />
              </button>
           </div>
           
           <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 20px 0', lineHeight: 1.5 }}>
             {p.desc}
           </p>

           <div style={{ height: 1, background: 'rgba(255,255,255,0.05)', marginBottom: 20 }} />
           
           <p style={{ fontSize: 12, fontWeight: 700, color: 'white', marginBottom: 12 }}>Recommended Actions</p>
           
           <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              <button onClick={() => router.push('/trips/create')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))', border: '1px solid rgba(249,115,22,0.3)', borderRadius: 10, color: '#f97316', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-orange-500/20">
                 <Plus style={{ width: 14, height: 14 }} /> New Trip
              </button>
              <button onClick={() => router.push('/trips')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-white/10">
                 <Search style={{ width: 14, height: 14, color: '#94a3b8' }} /> Find Trips
              </button>
              <button onClick={() => router.push('/explore')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-white/10">
                 <Compass style={{ width: 14, height: 14, color: '#94a3b8' }} /> Explore
              </button>
              <button onClick={() => router.push('/community')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-white/10">
                 <Users style={{ width: 14, height: 14, color: '#94a3b8' }} /> Connect
              </button>
           </div>
        </div>
     );
  }

  // QUIZ STATE (Compact)
  return (
    <div className="card anim-in" style={{ padding: 24, background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden' }}>
      
      {/* Intro Step */}
      {step === 0 && (
        <div style={{ textAlign: 'center' }}>
           <div style={{ 
             width: 56, height: 56, borderRadius: '50%', margin: '0 auto 16px',
             background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))',
             border: '1px solid rgba(249,115,22,0.2)',
             display: 'flex', alignItems: 'center', justifyContent: 'center' 
           }}>
              <Compass style={{ width: 28, height: 28, color: '#f97316' }} className="anim-float" />
           </div>
           <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 8 }}>Travel Persona</h2>
           <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 24px 0', lineHeight: 1.5 }}>
             A quick 3-question quiz to curate your perfect dashboard experience.
           </p>
           <button 
             suppressHydrationWarning
             onClick={() => setStep(1)}
             style={{ 
               background: 'linear-gradient(135deg, #f97316, #fbbf24)', padding: '12px 24px', 
               borderRadius: 12, border: 'none', color: 'white', fontSize: 14, fontWeight: 800,
               boxShadow: '0 8px 20px -6px rgba(249,115,22,0.4)', cursor: 'pointer', width: '100%'
             }}
             className="hover:scale-[1.02] active:scale-95 transition-transform"
           >
             Start Assessment
           </button>
        </div>
      )}

      {/* Question Steps */}
      {step >= 1 && step <= QUESTIONS.length && (
        <div className="anim-in">
           <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Q{step} of {QUESTIONS.length}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                 {[1,2,3].map(i => (
                   <div key={i} style={{ width: 16, height: 4, borderRadius: 2, background: i <= step ? '#f97316' : 'rgba(255,255,255,0.1)' }} />
                 ))}
              </div>
           </div>
           
           <h2 style={{ fontSize: 16, fontWeight: 800, color: 'white', marginBottom: 20, lineHeight: 1.3 }}>{QUESTIONS[step-1].text}</h2>
           
           <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {QUESTIONS[step-1].options.map(opt => {
                const Icon = opt.icon;
                return (
                  <button 
                    suppressHydrationWarning
                    key={opt.value}
                    onClick={() => handleAnswer(step, opt.value)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', padding: '12px 16px', borderRadius: 12, 
                      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                      transition: 'all 0.2s', cursor: 'pointer' 
                    }}
                    className="hover:bg-white/10 hover:border-white/20 group"
                  >
                    <div style={{ background: `${opt.color}15`, width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                       <Icon style={{ width: 16, height: 16, color: opt.color || '#fff' }} className="group-hover:scale-110 transition-transform" />
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'white', margin: 0 }}>{opt.label}</p>
                  </button>
                );
              })}
           </div>
        </div>
      )}

      {/* Calculating State */}
      {step === QUESTIONS.length + 1 && loading && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
           <Loader2 style={{ width: 32, height: 32, color: '#f97316', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
           <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>Analyzing...</h3>
        </div>
      )}

      {/* Finished Button (Intermediate) */}
      {step === QUESTIONS.length && !loading && !answers[QUESTIONS.length] && (
         <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button 
              suppressHydrationWarning
              onClick={calculateResult}
              style={{ width: '100%', padding: '12px 24px', borderRadius: 12, background: 'linear-gradient(135deg, #f97316, #fbbf24)', border: 'none', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
              className="hover:scale-[1.02] active:scale-95 transition-transform"
            >
              Reveal My Persona
            </button>
         </div>
      )}
    </div>
  );
}
