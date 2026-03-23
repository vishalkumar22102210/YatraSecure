"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  User, Mail, MapPin, Phone, Camera, Save, Loader2, AlertCircle, Check,
  ShieldCheck, Sparkles, Briefcase, Heart, Globe, Home, Calendar,
  Shield, AlertTriangle, ChevronDown, GraduationCap, Compass, Mountain,
} from "lucide-react";
import { fetchWithAuth } from "@/app/lib/api";
import toast from "react-hot-toast";
import ChipsInput from "@/components/ChipsInput";

/* ─── Preset options ─── */
const GENDER_OPTIONS   = ["Male", "Female", "Non-binary", "Prefer not to say"];
const PROF_OPTIONS     = ["Student", "Working Professional", "Freelancer", "Entrepreneur", "Other"];
const TRAVEL_STYLES    = ["Budget", "Mid-range", "Luxury", "Backpacking", "Solo", "Group", "Adventure", "Leisure", "Cultural"];
const BUDGET_OPTIONS   = ["₹0-5K", "₹5K-15K", "₹15K-50K", "₹50K-1L", "₹1L+"];
const PERSONALITY_OPTS = ["Introvert", "Extrovert", "Ambivert"];
const INTEREST_PRESETS = [
  "Photography", "Trekking", "Food", "History", "Music", "Art",
  "Beach", "Mountains", "Wildlife", "Temples", "Nightlife", "Shopping",
  "Yoga", "Camping", "Road Trips", "Volunteering", "Scuba Diving", "Skiing",
];

/* ─── Section wrapper ─── */
function Section({ icon: Icon, title, subtitle, children, accentColor = "rgba(56,189,248,0.15)" }: any) {
  return (
    <div className="card" style={{ padding: 24, marginBottom: 16 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <div style={{
          width: 34, height: 34, borderRadius: 10,
          background: accentColor,
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon style={{ width: 16, height: 16, color: "white" }} />
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", margin: 0 }}>{title}</h3>
          {subtitle && <p style={{ fontSize: 12, color: "#64748b", margin: 0, marginTop: 2 }}>{subtitle}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

/* ─── Small reusable input field ─── */
function Field({ label, icon: Icon, type = "text", value, onChange, placeholder, disabled, readOnly }: any) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 7 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {Icon && <Icon style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#475569", pointerEvents: "none" }} />}
        <input
          type={type}
          className="input-field"
          style={{ paddingLeft: Icon ? 42 : 14, ...(disabled ? { opacity: 0.5, cursor: "not-allowed" } : {}) }}
          placeholder={placeholder}
          value={value || ""}
          onChange={onChange}
          readOnly={readOnly}
          disabled={disabled}
        />
      </div>
    </div>
  );
}

/* ─── Select dropdown ─── */
function SelectField({ label, icon: Icon, value, onChange, options, placeholder }: any) {
  return (
    <div>
      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 7 }}>{label}</label>
      <div style={{ position: "relative" }}>
        {Icon && <Icon style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#475569", pointerEvents: "none" }} />}
        <select
          className="input-field"
          style={{ paddingLeft: Icon ? 42 : 14, appearance: "none", cursor: "pointer", color: value ? "white" : "#64748b" }}
          value={value || ""}
          onChange={onChange}
        >
          <option value="">{placeholder || "Select..."}</option>
          {options.map((o: string) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#475569", pointerEvents: "none" }} />
      </div>
    </div>
  );
}

/* ─── Chip toggle grid ─── */
function ChipGrid({ options, selected, onToggle }: { options: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {options.map(opt => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            style={{
              padding: "6px 14px",
              borderRadius: 99,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              border: active ? "1px solid rgba(56,189,248,0.4)" : "1px solid rgba(255,255,255,0.08)",
              background: active ? "rgba(56,189,248,0.12)" : "rgba(15,23,42,0.4)",
              color: active ? "#38bdf8" : "#94a3b8",
              transition: "all 0.2s",
            }}
          >
            {active && <Check style={{ width: 12, height: 12, display: "inline", marginRight: 4, verticalAlign: "middle" }} />}
            {opt}
          </button>
        );
      })}
    </div>
  );
}


/* ════════════════════════════════════
   MAIN PROFILE PAGE
   ═══════════════════════════════════ */
export default function ProfilePage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [user, setUser]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState(false);

  /* Form state */
  const [form, setForm] = useState({
    username: "", bio: "", age: "",
    gender: "", city: "", hometown: "", state: "", phone: "",
    professionalStatus: "",
    travelStyle: [] as string[],
    interests: [] as string[],
    budgetRange: "",
    travelPersonality: "",
    emergencyContacts: [] as any[],
  });

  /* ── Load user ── */
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res  = await fetchWithAuth("/users/me");
      const data = await res.json();
      setUser(data);
      setForm({
        username:           data.username           || "",
        bio:                data.bio                || "",
        age:                data.age                || "",
        gender:             data.gender             || "",
        city:               data.city               || "",
        hometown:           data.hometown           || "",
        state:              data.state              || "",
        phone:              data.phone              || "",
        professionalStatus: data.professionalStatus || "",
        travelStyle:        data.travelStyle        || [],
        interests:          data.interests          || [],
        budgetRange:        data.budgetRange        || "",
        travelPersonality:  data.travelPersonality  || "",
        emergencyContacts:  Array.isArray(data.emergencyContacts) ? data.emergencyContacts : [],
      });
    } catch { toast.error("Failed to load profile"); }
    finally  { setLoading(false); }
  }

  /* ── Save ── */
  async function onSave() {
    setSaving(true); setError(""); setSuccess(false);
    try {
      const payload: any = { ...form };
      if (payload.age) payload.age = parseInt(payload.age, 10);
      else delete payload.age;

      const res  = await fetchWithAuth("/users/me", { method: "PATCH", body: JSON.stringify(payload) });
      const data = await res.json();
      const updated = { ...JSON.parse(localStorage.getItem("user") || "{}"), ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setSuccess(true);
      toast.success("Profile updated!");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update");
      toast.error("Save failed");
    } finally { setSaving(false); }
  }

  /* ── Avatar upload ── */
  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB allowed"); return; }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const token = localStorage.getItem("accessToken");
      const res   = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/upload/profile-picture`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      const updated = { ...user, profileImage: data.url };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      toast.success("Profile picture updated!");
    } catch (err: any) { toast.error(err.message || "Upload failed"); }
    finally { setUploading(false); }
  }

  /* ── Helpers ── */
  const set = (key: string, val: any) => setForm(p => ({ ...p, [key]: val }));
  const toggleArray = (key: string, val: string) => {
    setForm(p => {
      const arr = (p as any)[key] as string[];
      return { ...p, [key]: arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val] };
    });
  };

  /* Emergency contacts helpers */
  const addEmergencyContact = () => {
    if (form.emergencyContacts.length >= 3) return;
    set("emergencyContacts", [...form.emergencyContacts, { name: "", phone: "", relation: "" }]);
  };
  const updateContact = (idx: number, field: string, val: string) => {
    const updated = [...form.emergencyContacts];
    updated[idx] = { ...updated[idx], [field]: val };
    set("emergencyContacts", updated);
  };
  const removeContact = (idx: number) => {
    set("emergencyContacts", form.emergencyContacts.filter((_: any, i: number) => i !== idx));
  };

  const avatar = user?.username?.slice(0, 2).toUpperCase() || "YS";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <Loader2 style={{ width: 28, height: 28, color: "var(--accent)", animation: "spin 1s linear infinite" }} />
    </div>
  );

  return (
    <div className="anim-in" style={{ maxWidth: 640, margin: "0 auto", paddingBottom: 40 }}>

      {/* ══ Page header ══ */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Build your travel identity — the more you share, the better your matches</p>
      </div>

      {/* ══ 0 · AVATAR CARD ══ */}
      <div className="card" style={{ padding: 28, marginBottom: 16, display: "flex", alignItems: "center", gap: 24, flexWrap: "wrap" }}>
        <div style={{ position: "relative" }}>
          <div style={{
            width: 80, height: 80, borderRadius: "50%",
            background: user?.profileImage ? "transparent" : "var(--cta-gradient)",
            border: "3px solid rgba(56,189,248,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, fontWeight: 900, color: "white", overflow: "hidden", flexShrink: 0,
          }}>
            {user?.profileImage
              ? <img src={user.profileImage} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : avatar}
          </div>
          <button
            onClick={() => fileRef.current?.click()} disabled={uploading}
            style={{
              position: "absolute", bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: "50%",
              background: "var(--cta-gradient)", border: "2px solid var(--bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "0 2px 8px rgba(56,189,248,0.4)",
            }}
          >
            {uploading
              ? <Loader2 style={{ width: 12, height: 12, color: "white", animation: "spin 1s linear infinite" }} />
              : <Camera  style={{ width: 12, height: 12, color: "white" }} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onAvatarChange} />
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 4, display: "flex", alignItems: "center", gap: 8 }}>
            {user?.username}
            {user?.isVerified && <ShieldCheck style={{ width: 18, height: 18, color: "#22c55e" }} />}
          </p>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>{user?.email}</p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {user?.travelPersonality && (
              <span className="badge" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#a855f7", fontWeight: 700 }}>
                {user.travelPersonality}
              </span>
            )}
            <span className="badge" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316", fontWeight: 700 }}>
              {user?.reputationScore > 600 ? "Platinum Legend" : user?.reputationScore > 300 ? "Gold Explorer" : user?.reputationScore > 100 ? "Silver Adventurer" : "Bronze Traveler"}
            </span>
          </div>
        </div>
      </div>

      {/* Reputation bar */}
      <div className="card" style={{ padding: 24, marginBottom: 16, background: "linear-gradient(135deg, rgba(56,189,248,0.05), rgba(15,23,42,0.5))" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: "white", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles style={{ width: 16, height: 16, color: "var(--accent)" }} /> AI Reputation Score
          </h3>
          <span style={{ fontSize: 24, fontWeight: 900, color: "white" }}>
            {user?.reputationScore || 0} <span style={{ fontSize: 14, color: "#475569", fontWeight: 500 }}>/ 1000</span>
          </span>
        </div>
        <div style={{ width: "100%", height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 10, overflow: "hidden", marginBottom: 12 }}>
          <div style={{ width: `${(user?.reputationScore || 0) / 10}%`, height: "100%", background: "var(--cta-gradient)", borderRadius: 10, transition: "width 1s ease" }} />
        </div>
        <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
          Reputation calculated from community contributions, verified trips, and connections.
        </p>
      </div>

      {/* Error / Success banners */}
      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, marginBottom: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)" }}>
          <AlertCircle style={{ width: 15, height: 15, color: "#ef4444", flexShrink: 0 }} />
          <p style={{ color: "#ef4444", fontSize: 13, margin: 0 }}>{error}</p>
        </div>
      )}
      {success && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, marginBottom: 16, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.25)" }}>
          <Check style={{ width: 15, height: 15, color: "#22c55e", flexShrink: 0 }} />
          <p style={{ color: "#22c55e", fontSize: 13, margin: 0 }}>Profile updated successfully!</p>
        </div>
      )}


      {/* ══ 1 · BASIC INFO ══ */}
      <Section icon={User} title="Basic Info" subtitle="Name, age, gender, and bio" accentColor="rgba(56,189,248,0.15)">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Username" icon={User} value={form.username} onChange={(e: any) => set("username", e.target.value)} placeholder="your_username" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Age" icon={Calendar} type="number" value={form.age} onChange={(e: any) => set("age", e.target.value)} placeholder="e.g. 25" />
            <SelectField label="Gender" icon={User} value={form.gender} onChange={(e: any) => set("gender", e.target.value)} options={GENDER_OPTIONS} placeholder="Select gender" />
          </div>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 7 }}>Bio</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Tell fellow travelers about yourself..."
              value={form.bio}
              onChange={(e) => set("bio", e.target.value)}
              style={{ resize: "vertical", minHeight: 80 }}
            />
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{(form.bio || "").length}/500 characters</p>
          </div>
          {/* Email — read only */}
          <Field label="Email (cannot change)" icon={Mail} value={user?.email} disabled readOnly />
        </div>
      </Section>


      {/* ══ 2 · LOCATION & TRAVEL ══ */}
      <Section icon={MapPin} title="Location & Travel" subtitle="Where you live and where you're headed" accentColor="rgba(34,197,94,0.15)">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="City" icon={MapPin} value={form.city} onChange={(e: any) => set("city", e.target.value)} placeholder="e.g. Delhi" />
            <Field label="Hometown" icon={Home} value={form.hometown} onChange={(e: any) => set("hometown", e.target.value)} placeholder="e.g. Jaipur" />
          </div>
          <Field label="State" icon={Globe} value={form.state} onChange={(e: any) => set("state", e.target.value)} placeholder="e.g. Rajasthan" />
          <Field label="Phone" icon={Phone} type="tel" value={form.phone} onChange={(e: any) => set("phone", e.target.value)} placeholder="+91 XXXXXXXXXX" />
        </div>
      </Section>


      {/* ══ 3 · INTERESTS ══ */}
      <Section icon={Heart} title="Interests" subtitle="What excites you — pick as many as you like" accentColor="rgba(239,68,68,0.15)">
        <p style={{ fontSize: 12, color: "#64748b", marginBottom: 12 }}>Quick picks:</p>
        <ChipGrid options={INTEREST_PRESETS} selected={form.interests} onToggle={(v) => toggleArray("interests", v)} />
        <div style={{ marginTop: 16 }}>
          <ChipsInput
            label="Custom Interests"
            placeholder="Type a custom interest..."
            tags={form.interests.filter(t => !INTEREST_PRESETS.includes(t))}
            onChange={(customTags) => {
              const presetSelected = form.interests.filter(t => INTEREST_PRESETS.includes(t));
              set("interests", [...presetSelected, ...customTags]);
            }}
            maxTags={20}
          />
        </div>
      </Section>


      {/* ══ 4 · PROFESSIONAL ══ */}
      <Section icon={Briefcase} title="Professional" subtitle="What do you do for a living?" accentColor="rgba(168,85,247,0.15)">
        <SelectField label="Status" icon={GraduationCap} value={form.professionalStatus} onChange={(e: any) => set("professionalStatus", e.target.value)} options={PROF_OPTIONS} placeholder="Select your status" />
      </Section>


      {/* ══ 5 · TRAVEL PREFERENCES ══ */}
      <Section icon={Compass} title="Travel Preferences" subtitle="Your ideal travel setup" accentColor="rgba(249,115,22,0.15)">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>Travel Style</label>
            <ChipGrid options={TRAVEL_STYLES} selected={form.travelStyle} onToggle={(v) => toggleArray("travelStyle", v)} />
          </div>
          <SelectField label="Budget Range" icon={Mountain} value={form.budgetRange} onChange={(e: any) => set("budgetRange", e.target.value)} options={BUDGET_OPTIONS} placeholder="Select budget" />
        </div>
      </Section>


      {/* ══ 6 · PERSONALITY ══ */}
      <Section icon={Sparkles} title="Personality" subtitle="How would you describe yourself?" accentColor="rgba(234,179,8,0.15)">
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {PERSONALITY_OPTS.map(opt => {
            const active = form.travelPersonality === opt;
            return (
              <button
                key={opt}
                onClick={() => set("travelPersonality", opt)}
                style={{
                  flex: 1, minWidth: 100, padding: "14px 10px",
                  borderRadius: 14, fontSize: 13, fontWeight: 700,
                  cursor: "pointer", textAlign: "center",
                  border: active ? "1.5px solid rgba(234,179,8,0.5)" : "1px solid rgba(255,255,255,0.08)",
                  background: active ? "rgba(234,179,8,0.1)" : "rgba(15,23,42,0.4)",
                  color: active ? "#eab308" : "#94a3b8",
                  transition: "all 0.25s",
                }}
              >
                {opt === "Introvert" && "🧘 "}{opt === "Extrovert" && "🎉 "}{opt === "Ambivert" && "⚖️ "}
                {opt}
              </button>
            );
          })}
        </div>
      </Section>


      {/* ══ 7 · SAFETY ══ */}
      <Section icon={Shield} title="Safety" subtitle="Verification & emergency contacts" accentColor="rgba(239,68,68,0.15)">
        {/* Verification status */}
        <div style={{
          display: "flex", alignItems: "center", gap: 12, padding: 16, borderRadius: 12, marginBottom: 20,
          background: user?.isVerified ? "rgba(34,197,94,0.08)" : "rgba(249,115,22,0.08)",
          border: `1px solid ${user?.isVerified ? "rgba(34,197,94,0.2)" : "rgba(249,115,22,0.2)"}`,
        }}>
          {user?.isVerified
            ? <ShieldCheck style={{ width: 20, height: 20, color: "#22c55e" }} />
            : <AlertTriangle style={{ width: 20, height: 20, color: "#f97316" }} />}
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: "white", margin: 0 }}>
              {user?.isVerified ? "Identity Verified ✓" : "Not Verified Yet"}
            </p>
            <p style={{ fontSize: 12, color: "#64748b", margin: 0, marginTop: 2 }}>
              {user?.isVerified ? "Your profile is verified and trusted." : "Complete verification to boost your reputation score."}
            </p>
          </div>
        </div>

        {/* Emergency contacts */}
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#94a3b8", marginBottom: 10 }}>
          Emergency Contacts <span style={{ fontSize: 11, fontWeight: 400, color: "#64748b" }}>({form.emergencyContacts.length}/3)</span>
        </label>

        {form.emergencyContacts.map((contact: any, i: number) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: 8, marginBottom: 10,
            padding: 12, borderRadius: 12,
            background: "rgba(15,23,42,0.3)", border: "1px solid rgba(255,255,255,0.05)",
          }}>
            <input
              className="input-field" placeholder="Name" value={contact.name || ""}
              onChange={(e) => updateContact(i, "name", e.target.value)}
              style={{ fontSize: 12 }}
            />
            <input
              className="input-field" placeholder="Phone" value={contact.phone || ""}
              onChange={(e) => updateContact(i, "phone", e.target.value)}
              style={{ fontSize: 12 }}
            />
            <input
              className="input-field" placeholder="Relation" value={contact.relation || ""}
              onChange={(e) => updateContact(i, "relation", e.target.value)}
              style={{ fontSize: 12 }}
            />
            <button
              onClick={() => removeContact(i)}
              style={{
                background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: 10, width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: "#ef4444", fontSize: 18, fontWeight: 700,
              }}
            >×</button>
          </div>
        ))}

        {form.emergencyContacts.length < 3 && (
          <button
            onClick={addEmergencyContact}
            style={{
              width: "100%", padding: "10px", borderRadius: 12,
              border: "1px dashed rgba(255,255,255,0.1)",
              background: "rgba(15,23,42,0.2)", color: "#64748b",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            + Add Emergency Contact
          </button>
        )}
      </Section>


      {/* ══ SAVE BUTTON ══ */}
      <button onClick={onSave} disabled={saving} className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15 }}>
        {saving
          ? <><Loader2 style={{ width: 17, height: 17, animation: "spin 1s linear infinite" }} /> Saving...</>
          : <><Save style={{ width: 17, height: 17 }} /> Save All Changes</>}
      </button>
    </div>
  );
}
