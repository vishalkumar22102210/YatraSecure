"use client";
import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Trash2, Loader2, BellOff } from "lucide-react";
import { fetchWithAuth } from "@/app/lib/api";
import toast from "react-hot-toast";

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationsPage() {
  const [notifs, setNotifs]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchNotifs(); }, []);

  async function fetchNotifs() {
    try {
      const res = await fetchWithAuth("/notifications");
      const data = await res.json();
      setNotifs(Array.isArray(data) ? data : data?.notifications || []);
    } catch { setNotifs([]); }
    finally { setLoading(false); }
  }

  async function markRead(id: string) {
    try {
      await fetchWithAuth(`/notifications/${id}/read`, { method: "PATCH" });
      setNotifs(p => p.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch { toast.error("Failed"); }
  }

  async function markAll() {
    try {
      await fetchWithAuth("/notifications/read-all", { method: "PATCH" });
      setNotifs(p => p.map(n => ({ ...n, isRead: true })));
      toast.success("All marked as read");
    } catch { toast.error("Failed"); }
  }

  async function deleteNotif(id: string) {
    try {
      await fetchWithAuth(`/notifications/${id}`, { method: "DELETE" });
      setNotifs(p => p.filter(n => n.id !== id));
    } catch { toast.error("Failed"); }
  }

  async function clearRead() {
    try {
      await fetchWithAuth("/notifications/clear-read", { method: "DELETE" });
      setNotifs(p => p.filter(n => !n.isRead));
      toast.success("Read notifications cleared");
    } catch { toast.error("Failed"); }
  }

  const unread = notifs.filter(n => !n.isRead).length;

  const typeColor: Record<string, string> = {
    memberremoved: "#ef4444",
    memberleft:    "#f97316",
    joinrequest:   "#3b82f6",
    accepted:      "#22c55e",
    rejected:      "#ef4444",
    default:       "#f97316",
  };

  return (
    <div className="anim-in">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">
            {unread > 0 ? <><span style={{ color: "#f97316", fontWeight: 700 }}>{unread}</span> unread notifications</> : "All caught up!"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {unread > 0 && (
            <button onClick={markAll} className="btn-ghost" style={{ padding: "9px 16px", fontSize: 13 }}>
              <CheckCheck style={{ width: 14, height: 14 }} /> Mark all read
            </button>
          )}
          {notifs.some(n => n.isRead) && (
            <button onClick={clearRead} className="btn-danger" style={{ padding: "9px 16px", fontSize: 13 }}>
              <Trash2 style={{ width: 14, height: 14 }} /> Clear read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: 60 }}>
          <Loader2 style={{ width: 28, height: 28, color: "#f97316", animation: "spin 1s linear infinite" }} />
        </div>
      ) : notifs.length === 0 ? (
        <div className="card" style={{ padding: "64px 24px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, margin: "0 auto 20px", background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.15)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BellOff style={{ width: 28, height: 28, color: "#334155" }} />
          </div>
          <p style={{ color: "white", fontWeight: 700, fontSize: 16, marginBottom: 8 }}>No notifications</p>
          <p style={{ color: "#334155", fontSize: 13 }}>You're all caught up! 🎉</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {notifs.map(n => {
            const color = typeColor[n.type] || typeColor.default;
            return (
              <div
                key={n.id}
                className="card"
                style={{
                  padding: "16px 18px",
                  display: "flex", alignItems: "flex-start", gap: 14,
                  borderColor: !n.isRead ? "rgba(249,115,22,0.2)" : "#1e293b",
                  background: !n.isRead ? "rgba(249,115,22,0.04)" : "#1a2744",
                  transition: "all 0.2s",
                }}
              >
                {/* Icon dot */}
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${color}15`, border: `1px solid ${color}25`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Bell style={{ width: 15, height: 15, color }} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <p style={{ fontSize: 13, fontWeight: n.isRead ? 500 : 700, color: n.isRead ? "#94a3b8" : "white", margin: 0 }}>
                      {n.title}
                    </p>
                    {!n.isRead && <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f97316", flexShrink: 0 }} />}
                  </div>
                  <p style={{ fontSize: 12, color: "#475569", margin: 0, lineHeight: 1.5 }}>{n.message}</p>
                  <p style={{ fontSize: 11, color: "#334155", margin: "6px 0 0" }}>{timeAgo(n.createdAt)}</p>
                </div>

                {/* Actions */}
                <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                  {!n.isRead && (
                    <button onClick={() => markRead(n.id)} title="Mark read" style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.2)", color: "#22c55e", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check style={{ width: 13, height: 13 }} />
                    </button>
                  )}
                  <button onClick={() => deleteNotif(n.id)} title="Delete" style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#ef4444", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
