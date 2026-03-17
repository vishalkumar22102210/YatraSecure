"use client";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, MapPin, Phone, Camera, Save, Loader2, AlertCircle, Check, ShieldCheck, Sparkles } from "lucide-react";
import { fetchWithAuth } from "@/app/lib/api";
import toast from "react-hot-toast";

export default function ProfilePage() {
  const router  = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [user, setUser]       = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState(false);
  const [form, setForm]       = useState({ username: "", city: "", state: "", phone: "" });

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) { router.push("/login"); return; }
    fetchProfile();
  }, []);

  async function fetchProfile() {
    try {
      const res = await fetchWithAuth("/users/me");
      const data = await res.json();
      setUser(data);
      setForm({
        username: data.username || "",
        city:     data.city     || "",
        state:    data.state    || "",
        phone:    data.phone    || "",
      });
    } catch { toast.error("Failed to load profile"); }
    finally  { setLoading(false); }
  }

  async function onSave() {
    setSaving(true); setError(""); setSuccess(false);
    try {
      const res = await fetchWithAuth("/users/me", { method: "PATCH", body: JSON.stringify(form) });
      const data = await res.json();
      const updated = { ...JSON.parse(localStorage.getItem("user") || "{}"), ...data };
      localStorage.setItem("user", JSON.stringify(updated));
      setUser(updated);
      setSuccess(true);
      toast.success("Profile updated!");
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to update");
    } finally { setSaving(false); }
  }

  async function onAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5MB allowed"); return; }
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
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally { setUploading(false); }
  }

  const avatar = user?.username?.slice(0, 2).toUpperCase() || "YS";

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: 300 }}>
      <Loader2 style={{ width: 28, height: 28, color: "var(--accent)", animation: "spin 1s linear infinite" }} />
    </div>
  );

  return (
    <div className="anim-in" style={{ maxWidth: 600, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">Manage your personal information</p>
      </div>

      {/* Avatar card */}
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
              : avatar
            }
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              position: "absolute", bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: "50%",
              background: "var(--cta-gradient)",
              border: "2px solid var(--bg)",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", boxShadow: "0 2px 8px rgba(56,189,248,0.4)",
            }}
          >
            {uploading
              ? <Loader2 style={{ width: 12, height: 12, color: "white", animation: "spin 1s linear infinite" }} />
              : <Camera  style={{ width: 12, height: 12, color: "white" }} />
            }
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onAvatarChange} />
        </div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 800, color: "white", marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
            {user?.username}
            {user?.isVerified && <ShieldCheck style={{ width: 18, height: 18, color: '#22c55e' }} />}
          </p>
          <p style={{ fontSize: 13, color: "#475569", marginBottom: 12 }}>{user?.email}</p>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {user?.travelPersonality && (
              <span className="badge" style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)", color: "#a855f7", fontWeight: 700 }}>
                {user.travelPersonality}
              </span>
            )}
            <span className="badge" style={{ background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.2)", color: "#f97316", fontWeight: 700 }}>
              {user?.reputationScore > 600 ? 'Platinum Legend' : user?.reputationScore > 300 ? 'Gold Explorer' : user?.reputationScore > 100 ? 'Silver Adventurer' : 'Bronze Traveler'}
            </span>
            {user?.isVerified && (
              <span className="badge" style={{ background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", fontWeight: 700 }}>
                Identity Verified
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Reputation Stats */}
      <div className="card" style={{ padding: 24, marginBottom: 16, background: 'linear-gradient(135deg, rgba(56,189,248,0.05), rgba(15,23,42,0.5))' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles style={{ width: 16, height: 16, color: 'var(--accent)' }} /> AI Reputation Score
          </h3>
          <span style={{ fontSize: 24, fontWeight: 900, color: 'white' }}>{user?.reputationScore || 0} <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>/ 1000</span></span>
        </div>
        
        <div style={{ width: '100%', height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 10, overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ width: `${(user?.reputationScore || 0) / 10}%`, height: '100%', background: 'var(--cta-gradient)', borderRadius: 10, transition: 'width 1s ease' }} />
        </div>
        
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.5 }}>
          Your reputation is calculated based on your community contributions, verified trips, and traveler connections. Higher scores unlock exclusive marketplace deals and premium badges.
        </p>
      </div>

      {/* Error / Success */}
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

      {/* Form */}
      <div className="card" style={{ padding: 24, marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 18 }}>Personal Details</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

          {[
            { key: "username", label: "Username",  icon: User,  placeholder: "your_username",  type: "text" },
            { key: "city",     label: "City",       icon: MapPin, placeholder: "e.g. Delhi",   type: "text" },
            { key: "state",    label: "State",      icon: MapPin, placeholder: "e.g. Delhi",   type: "text" },
            { key: "phone",    label: "Phone",      icon: Phone,  placeholder: "+91 XXXXXXXXXX", type: "tel"  },
          ].map(({ key, label, icon: Icon, placeholder, type }) => (
            <div key={key}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 7 }}>
                {label}
              </label>
              <div style={{ position: "relative" }}>
                <Icon style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#475569", pointerEvents: "none" }} />
                <input
                  type={type}
                  className="input-field"
                  style={{ paddingLeft: 42 }}
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
                />
              </div>
            </div>
          ))}

          {/* Email — read only */}
          <div>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 7 }}>
              Email <span style={{ color: "#334155" }}>(cannot change)</span>
            </label>
            <div style={{ position: "relative" }}>
              <Mail style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", width: 14, height: 14, color: "#334155", pointerEvents: "none" }} />
              <input
                type="email"
                className="input-field"
                style={{ paddingLeft: 42, opacity: 0.5, cursor: "not-allowed" }}
                value={user?.email || ""}
                readOnly
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save button */}
      <button onClick={onSave} disabled={saving} className="btn-primary" style={{ width: "100%", padding: "14px", fontSize: 15 }}>
        {saving
          ? <><Loader2 style={{ width: 17, height: 17, animation: "spin 1s linear infinite" }} /> Saving...</>
          : <><Save style={{ width: 17, height: 17 }} /> Save Changes</>
        }
      </button>
    </div>
  );
}
