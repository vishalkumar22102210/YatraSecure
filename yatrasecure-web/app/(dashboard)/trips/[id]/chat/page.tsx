"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Send, Users, Loader2, Sparkles, Bot, Clock, Shield, MessageCircle } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { API_BASE_URL, getAccessToken } from "@/app/lib/api";
import toast from "react-hot-toast";

interface Msg { id: string; tripId: string; userId: string; username: string; content: string; createdAt: string; type?: string; }

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}
function formatDay(d: string) {
  const date = new Date(d);
  const today = new Date();
  const diff  = Math.floor((today.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function ChatPage() {
  const params  = useParams();
  const router  = useRouter();
  const tripId  = params.id as string;

  const [trip, setTrip]           = useState<any>(null);
  const [messages, setMessages]   = useState<Msg[]>([]);
  const [input, setInput]         = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading]     = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const socketRef   = useRef<Socket | null>(null);
  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) setCurrentUser(JSON.parse(s));
    loadTrip();
    return () => { socketRef.current?.disconnect(); };
  }, [tripId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadTrip() {
    try {
      const token = getAccessToken();
      if (!token) { router.push("/login"); return; }
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Trip not found");
      setTrip(await res.json());
      // Load history
      const mRes = await fetch(`${API_BASE_URL}/trips/${tripId}/messages`, { headers: { Authorization: `Bearer ${token}` } });
      if (mRes.ok) setMessages(await mRes.json());
      connectSocket(token);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }

  function connectSocket(token: string) {
    const wsBase = process.env.NEXT_PUBLIC_WS_URL || API_BASE_URL.replace(/\/api$/, "");
    const socket = io(`${wsBase}/chat`, { 
      auth: { token }, 
      query: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 3000,
    });
    socketRef.current = socket;

    socket.on("connect",    ()  => { setConnected(true);  socket.emit("joinRoom", { tripId }); });
    socket.on("disconnect", ()  => setConnected(false));
    socket.on("joinedRoom", ()  => {});
    socket.on("newMessage", (m: Msg) => setMessages(p => [...p, m]));
    socket.on("error",      (e) => toast.error(e?.message || "Socket error"));
    socket.on("connect_error", () => setConnected(false));
  }

  function sendMessage() {
    if (!input.trim() || !socketRef.current?.connected) return;
    socketRef.current.emit("sendMessage", { tripId, content: input.trim() });
    setInput("");
    inputRef.current?.focus();
  }

  // Group messages by day
  const grouped: { day: string; msgs: Msg[] }[] = [];
  messages.forEach(m => {
    const day = formatDay(m.createdAt);
    const last = grouped[grouped.length - 1];
    if (last && last.day === day) { last.msgs.push(m); }
    else grouped.push({ day, msgs: [m] });
  });

  if (loading) return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }} className="anim-in">
      <div style={{ height: 60, borderRadius: 14, background: "#1a2744", marginBottom: 14, animation: "pulse 1.5s ease-in-out infinite" }} />
      <div style={{ flex: 1, borderRadius: 14, background: "#1a2744", animation: "pulse 1.5s ease-in-out infinite" }} />
    </div>
  );

  return (
    <div className="anim-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>

      {/* ── HEADER ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14, flexShrink: 0 }}>
        <button onClick={() => router.push(`/trips/${tripId}`)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#475569" }}>
          <ArrowLeft style={{ width: 20, height: 20 }} />
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: "#f1f5f9", margin: 0 }}>{trip?.name} — Chat</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: connected ? "#22c55e" : "#ef4444", flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: "#64748b" }}>{connected ? "Connected" : "Disconnected"}</span>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 9, background: "rgba(148,163,184,0.06)", border: "1px solid #1e293b" }}>
          <Users style={{ width: 13, height: 13, color: "#64748b" }} />
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{trip?.members?.length || 0}</span>
        </div>
      </div>

      {/* ── MESSAGES ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: '24px 20px', display: "flex", flexDirection: "column", gap: 8, background: 'rgba(15,23,42,0.4)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.05)', scrollbarWidth: 'thin' }}>
        {messages.length === 0 ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ textAlign: "center", opacity: 0.5 }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                <MessageCircle style={{ width: 40, height: 40, color: '#3b82f6' }} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', marginBottom: 8 }}>No messages yet</h3>
              <p style={{ fontSize: 14, color: "#94a3b8" }}>Be the first to say hello or ask <br/> <span style={{ color: '#a78bfa', fontWeight: 700 }}>@ai</span> for help!</p>
            </div>
          </div>
        ) : (
          grouped.map((g, gi) => (
            <div key={gi}>
              {/* Day separator */}
              <div style={{ display: "flex", alignItems: "center", gap: 16, margin: '24px 0' }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
                <span style={{ fontSize: 11, color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>{g.day}</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.05)' }} />
              </div>

              {/* Messages */}
              {g.msgs.map((m, mi) => {
                const isMe    = m.userId === currentUser?.id;
                const isAI    = m.type === 'ai' || m.userId === 'system-ai';
                const showAvatar = !isMe && (mi === 0 || g.msgs[mi - 1]?.userId !== m.userId);
                
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", marginBottom: mi < g.msgs.length - 1 && g.msgs[mi+1].userId === m.userId ? 4 : 16, alignItems: 'flex-end', gap: 10 }}>
                    
                    {!isMe && showAvatar && (
                      <div style={{ width: 32, height: 32, borderRadius: 10, background: isAI ? 'linear-gradient(135deg, #7c3aed, #db2777)' : 'linear-gradient(135deg, #1e293b, #334155)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                        {isAI ? <Sparkles style={{ width: 14, height: 14 }} /> : (m.username?.[0].toUpperCase() || '?')}
                      </div>
                    )}
                    {!isMe && !showAvatar && <div style={{ width: 32 }} />}

                    <div style={{ maxWidth: "80%", display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start' }}>
                      {showAvatar && <p style={{ fontSize: 11, color: isAI ? '#a78bfa' : '#94a3b8', fontWeight: 700, margin: '0 0 4px 4px' }}>{isAI ? 'AI COMPANION' : `@${m.username}`}</p>}
                      
                      <div style={{
                        padding: "12px 16px",
                        borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                        background: isMe 
                          ? 'linear-gradient(135deg, #f97316, #ea580c)' 
                          : isAI 
                            ? 'rgba(124, 58, 237, 0.1)' 
                            : 'rgba(255, 255, 255, 0.05)',
                        border: isAI ? '1px solid rgba(124, 58, 237, 0.2)' : '1px solid rgba(255, 255, 255, 0.03)',
                        boxShadow: isAI ? '0 0 20px rgba(124, 58, 237, 0.1)' : 'none',
                        position: 'relative'
                      }}>
                        <p style={{ fontSize: 14, color: 'white', margin: 0, lineHeight: 1.6, wordBreak: "break-word" }}>{m.content}</p>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4, opacity: 0.6 }}>
                          <Clock style={{ width: 10, height: 10 }} />
                          <span style={{ fontSize: 9 }}>{formatTime(m.createdAt)}</span>
                        </div>

                        {isAI && (
                          <div style={{ position: 'absolute', top: -10, right: -10, width: 24, height: 24, borderRadius: '50%', background: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #0f172a' }}>
                            <Bot style={{ width: 12, height: 12, color: 'white' }} />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── INPUT ── */}
      <div style={{ display: "flex", gap: 12, marginTop: 20, flexShrink: 0, padding: '0 8px' }}>
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            ref={inputRef}
            className="input-field"
            placeholder={connected ? "Message Group or @ai..." : "Connecting..."}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !e.shiftKey && sendMessage()}
            disabled={!connected}
            style={{ 
              width: '100%',
              paddingLeft: 20, 
              paddingRight: 50, 
              borderRadius: 20, 
              background: 'rgba(30,41,59,0.8)', 
              border: input.toLowerCase().includes('@ai') ? '1.5px solid #7c3aed' : '1.5px solid rgba(255,255,255,0.05)',
              transition: 'all 0.2s'
            }}
          />
          {input.toLowerCase().includes('@ai') && (
            <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)' }}>
              <Sparkles style={{ width: 16, height: 16, color: '#a78bfa', animation: 'pulse 1s infinite' }} />
            </div>
          )}
        </div>
        <button
          onClick={sendMessage}
          disabled={!input.trim() || !connected}
          style={{ 
            width: 52, 
            height: 52, 
            borderRadius: '50%', 
            background: input.toLowerCase().includes('@ai') ? 'linear-gradient(135deg, #7c3aed, #db2777)' : 'linear-gradient(135deg, #f97316, #ea580c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            transition: 'transform 0.1s, opacity 0.2s'
          }}
          className="hover:scale-105 active:scale-95 disabled:opacity-50"
        >
          <Send style={{ width: 20, height: 20, color: 'white' }} />
        </button>
      </div>
    </div>
  );
}
