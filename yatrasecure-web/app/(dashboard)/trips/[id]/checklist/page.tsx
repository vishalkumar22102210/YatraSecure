"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, CheckSquare, Plus, Loader2, Trash2, CheckCircle2, Circle, Sparkles } from "lucide-react";
import { API_BASE_URL, getAccessToken } from "@/app/lib/api";

interface ChecklistItem {
  id: string;
  name: string;
  isCompleted: boolean;
  addedBy: { id: string; username: string; profileImage: string | null };
  completedBy: { id: string; username: string; profileImage: string | null } | null;
  createdAt: string;
}

export default function ChecklistPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState("");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setCurrentUser(JSON.parse(s));
    loadData();
  }, [tripId]);

  async function loadData() {
    setLoading(true);
    try {
      const token = getAccessToken();
      
      const tripRes = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!tripRes.ok) throw new Error("Trip not found");
      const tripData = await tripRes.json();
      setTrip(tripData);

      const itemsRes = await fetch(`/api/trips/${tripId}/checklist`, {
         headers: { Authorization: `Bearer ${token}` }
      });
      if (!itemsRes.ok) throw new Error("Failed to load checklist");
      const itemsData = await itemsRes.json();
      setItems(itemsData);
      
    } catch (e: any) {
      toast.error(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddItem() {
    if (!newItemName.trim() || adding) return;
    setAdding(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/trips/${tripId}/checklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: newItemName.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add item");
      
      setItems([data, ...items]);
      setNewItemName("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAdding(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") handleAddItem();
  }

  async function toggleComplete(itemId: string, currentStatus: boolean) {
    // Optimistic UI update
    setItems(items.map(i => i.id === itemId ? { ...i, isCompleted: !currentStatus, completedBy: !currentStatus ? { id: currentUser?.id, username: currentUser?.username, profileImage: currentUser?.profileImage } : null } : i));
    
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/trips/${tripId}/checklist/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isCompleted: !currentStatus })
      });
      if (!res.ok) throw new Error("Failed to update item");
      const updated = await res.json();
      // Only set from server if needed, our optimistic update covers it mostly
      setItems(prev => prev.map(i => i.id === itemId ? updated : i));
    } catch (e: any) {
      toast.error(e.message);
      loadData(); // revert
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Remove this item?")) return;
    
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/trips/${tripId}/checklist/${itemId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to remove item");
      setItems(items.filter(i => i.id !== itemId));
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function handleSuggestItems() {
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/trips/${tripId}/checklist/suggest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to get suggestions");
      
      const suggestions = data.suggestions || [];
      if (suggestions.length === 0) {
        toast.error("AI couldn't generate items.");
        return;
      }

      // Add each suggested item to the backend (or we could bulk add if backend supports)
      toast.promise(
        Promise.all(suggestions.map(async (name: string) => {
          const addRes = await fetch(`/api/trips/${tripId}/checklist`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name })
          });
          return addRes.json();
        })),
        {
          loading: 'Generating packing list...',
          success: (newItems) => {
            setItems(prev => [...newItems, ...prev]);
            return `Added ${newItems.length} suggested items!`;
          },
          error: 'Failed to add suggestions',
        }
      );
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  const completedCount = items.filter(i => i.isCompleted).length;
  const progressPct = items.length === 0 ? 0 : Math.round((completedCount / items.length) * 100);

  return (
    <div className="anim-in" style={{ padding: "40px 24px", maxWidth: 900, margin: "0 auto", color: "white" }}>
      
      {/* ── BACKGROUND DECOR ── */}
      <div style={{ position: 'fixed', top: '10%', right: '5%', width: 300, height: 300, background: 'rgba(245,158,11,0.05)', filter: 'blur(100px)', borderRadius: '50%', zIndex: -1 }} />
      <div style={{ position: 'fixed', bottom: '10%', left: '5%', width: 250, height: 250, background: 'rgba(59,130,246,0.05)', filter: 'blur(100px)', borderRadius: '50%', zIndex: -1 }} />

      {/* HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
        <button onClick={() => router.push(`/trips/${tripId}`)} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", cursor: "pointer", fontSize: 13, padding: "10px 16px", borderRadius: 12 }} className="hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft style={{ width: 16, height: 16 }} /> Back
        </button>

        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: 28, fontWeight: 900, margin: 0, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Packing List</h1>
          <p style={{ fontSize: 13, color: "#64748b", fontWeight: 600, marginTop: 4 }}>{trip?.name || 'Loading trip...'}</p>
        </div>

        <button 
          onClick={handleSuggestItems}
          disabled={loading || items.length > 20}
          style={{ 
            display: "flex", alignItems: "center", gap: 8, 
            background: "rgba(124,58,237,0.1)", 
            border: "1px solid rgba(124,58,237,0.2)", 
            color: "#a78bfa", cursor: "pointer", fontSize: 13, 
            padding: "10px 18px", borderRadius: 12, fontWeight: 700 
          }} 
          className="hover:bg-purple-500/20 transition-all active:scale-95"
        >
          <Sparkles style={{ width: 16, height: 16 }} />
          <span>Suggest with AI</span>
        </button>
      </div>

      {loading && items.length === 0 ? (
        <div style={{ padding: 100, textAlign: "center" }}>
          <Loader2 style={{ width: 40, height: 40, color: "#f59e0b", animation: "spin 1s linear infinite", margin: "0 auto" }} />
          <p style={{ marginTop: 20, color: '#64748b', fontSize: 14 }}>Synchronizing list...</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: 32, alignItems: 'start' }}>
          
          {/* LEFT COLUMN: STATS & ADD */}
          <div style={{ position: 'sticky', top: 32 }}>
            <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: 24, padding: "28px", marginBottom: 24, border: "1px solid rgba(255,255,255,0.05)", backdropFilter: 'blur(10px)' }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, alignItems: "center" }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: "white" }}>Progress</span>
                <span style={{ fontSize: 20, fontWeight: 900, color: progressPct === 100 ? "#4ade80" : "#f59e0b" }}>{progressPct}%</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: "rgba(255,255,255,0.03)", overflow: "hidden", marginBottom: 14 }}>
                <div style={{ height: "100%", width: `${progressPct}%`, background: progressPct === 100 ? "#4ade80" : "linear-gradient(90deg, #f59e0b, #f97316)", borderRadius: 999, transition: "width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, padding: '12px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', textAlign: 'center' }}>
                   <p style={{ fontSize: 18, fontWeight: 900, margin: 0 }}>{items.length}</p>
                   <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', fontWeight: 700, margin: 4 }}>Total</p>
                </div>
                <div style={{ flex: 1, padding: '12px', borderRadius: 16, background: 'rgba(34,197,94,0.05)', textAlign: 'center' }}>
                   <p style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#4ade80' }}>{completedCount}</p>
                   <p style={{ fontSize: 10, color: '#4ade80', textTransform: 'uppercase', fontWeight: 700, margin: 4 }}>Packed</p>
                </div>
              </div>
            </div>

            {/* ADD INPUT */}
            <div style={{ background: "rgba(15,23,42,0.4)", borderRadius: 24, padding: "24px", border: "1px solid rgba(255,255,255,0.05)" }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: 'white', marginBottom: 16 }}>Quick Add</h3>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <input 
                   value={newItemName}
                   onChange={e => setNewItemName(e.target.value)}
                   onKeyDown={handleKeyDown}
                   placeholder="e.g. Hiking Boots"
                   style={{ width: '100%', background: "rgba(0,0,0,0.2)", border: "1.5px solid rgba(255,255,255,0.05)", padding: "14px 16px", borderRadius: 14, color: "white", outline: "none", fontSize: 14, transition: 'all 0.2s' }}
                />
              </div>
              <button 
                 disabled={adding || !newItemName.trim()}
                 onClick={handleAddItem}
                 style={{ width: '100%', background: "#f59e0b", color: "white", border: "none", padding: "14px", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 800, cursor: (!newItemName.trim() || adding) ? "not-allowed" : "pointer" }}
                 className="hover:bg-amber-600 transition-all active:scale-95 shadow-xl shadow-amber-500/20"
              >
                 {adding ? <Loader2 style={{ width: 18, height: 18, animation: "spin 1s linear infinite" }} /> : <Plus style={{ width: 18, height: 18 }} />}
                 Add to List
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: LIST */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {items.length === 0 ? (
              <div style={{ padding: 100, textAlign: "center", border: "2px dashed rgba(255,255,255,0.03)", borderRadius: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <CheckSquare style={{ width: 48, height: 48, color: "rgba(255,255,255,0.05)", marginBottom: 20 }} />
                <p style={{ color: "#475569", fontSize: 15 }}>No items in the packing list yet.</p>
              </div>
            ) : (
               items.map(item => (
                 <div key={item.id} style={{ 
                   background: item.isCompleted ? "rgba(15,23,42,0.3)" : "rgba(15,23,42,0.6)", 
                   border: `1px solid ${item.isCompleted ? "rgba(74,222,128,0.1)" : "rgba(255,255,255,0.05)"}`, 
                   borderRadius: 20, padding: "20px", 
                   display: "flex", alignItems: "center", gap: 18, 
                   transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                   transform: item.isCompleted ? 'scale(0.98)' : 'scale(1)',
                   opacity: item.isCompleted ? 0.7 : 1
                 }} className="hover:border-white/10 group">
                    <button onClick={() => toggleComplete(item.id, item.isCompleted)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transform: 'scale(1.2)' }}>
                      {item.isCompleted 
                        ? <CheckCircle2 style={{ width: 22, height: 22, color: "#4ade80" }} /> 
                        : <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} className="group-hover:border-amber-500 transition-colors" />
                      }
                    </button>
                    
                    <div style={{ flex: 1, minWidth: 0 }}>
                       <p style={{ fontSize: 16, fontWeight: 700, color: "white", margin: "0 0 6px", textDecoration: item.isCompleted ? "line-through" : "none", transition: 'all 0.2s' }}>{item.name}</p>
                       <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                              {item.addedBy.username?.[0].toUpperCase()}
                            </div>
                            <span style={{ fontSize: 11, color: "#64748b" }}>@{item.addedBy.username}</span>
                          </div>
                          {item.isCompleted && item.completedBy && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontSize: 13, color: '#4ade80' }}>⚡</span>
                              <span style={{ fontSize: 11, color: "#4ade80", fontWeight: 600 }}>Packed by @{item.completedBy.username}</span>
                            </div>
                          )}
                       </div>
                    </div>

                    {(item.addedBy.id === currentUser?.id || trip?.adminId === currentUser?.id) && (
                      <button onClick={() => deleteItem(item.id)} style={{ background: "rgba(239,68,68,0.05)", border: "none", color: "#f87171", width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: 0 }} className="group-hover:opacity-100 transition-all hover:bg-red-500/20 active:scale-90">
                        <Trash2 style={{ width: 14, height: 14 }} />
                      </button>
                    )}
                 </div>
               ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

