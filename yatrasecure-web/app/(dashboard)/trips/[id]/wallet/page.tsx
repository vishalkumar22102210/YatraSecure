"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  AreaChart, Area
} from 'recharts';
import {
  ArrowLeft, Plus, Wallet, TrendingDown, Users, Receipt,
  Loader2, AlertCircle, X, ChevronDown, Bell, CheckCircle2
} from "lucide-react";
import { API_BASE_URL, getAccessToken } from "@/app/lib/api";

const CATEGORIES = ["Food", "Transport", "Accommodation", "Shopping", "Activities", "Medical", "Other"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const card: React.CSSProperties = {
  borderRadius: 16, background: 'rgba(255,255,255,0.02)',
  border: '1px solid rgba(255,255,255,0.04)', padding: 28,
};
const badge = (color: string, bg: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 12px', borderRadius: 8, fontSize: 11,
  fontWeight: 600, color, background: bg, border: `1px solid ${bg.replace(',0.1)', ',0.2)')}`
});
const btn = (bg: string, color = 'white'): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '10px 18px', borderRadius: 10, fontSize: 13,
  fontWeight: 600, color, background: bg,
  border: 'none', cursor: 'pointer', textDecoration: 'none',
  transition: 'all 0.15s',
});

function timeAgo(d: string) {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return "Just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const CATEGORY_COLOR: Record<string, string> = {
  food: "#f97316", transport: "#60a5fa", accommodation: "#a78bfa",
  shopping: "#fbbf24", activities: "#34d399", medical: "#f87171", other: "#94a3b8",
};

export default function WalletPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [wallet, setWallet]       = useState<any>(null);
  const [expenses, setExpenses]   = useState<any[]>([]);
  const [members, setMembers]     = useState<any[]>([]);
  const [trip, setTrip]           = useState<any>(null);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // AI Budget Predictor state
  const [predicting, setPredicting] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [predictError, setPredictError] = useState('');

  const [form, setForm] = useState({
    description: "", amount: "", category: "Food",
    splitType: "equal", paidBy: "",
  });
  const [fe, setFe] = useState<Record<string, string>>({});

  useEffect(() => {
    const s = localStorage.getItem("user");
    if (s) { const u = JSON.parse(s); setCurrentUser(u); setForm(p => ({ ...p, paidBy: u.id })); }
    loadAll();
  }, [tripId]);

  async function loadAll() {
    setLoading(true);
    try {
      const token = getAccessToken();
      if (!token) { router.push("/login"); return; }
      const h = { Authorization: `Bearer ${token}` };

      const [tripRes, memRes] = await Promise.all([
        fetch(`${API_BASE_URL}/trips/${tripId}`,         { headers: h }),
        fetch(`${API_BASE_URL}/trips/${tripId}/members`, { headers: h }),
      ]);
      if (tripRes.ok) setTrip(await tripRes.json());
      if (memRes.ok) setMembers(await memRes.json());

      const wRes = await fetch(`${API_BASE_URL}/trips/${tripId}/wallet`, { headers: h });
      if (wRes.ok) {
        const w = await wRes.json();
        setWallet(w);
        const eRes = await fetch(`${API_BASE_URL}/trips/${tripId}/wallet/expenses`, { headers: h });
        if (eRes.ok) setExpenses(await eRes.json());
      }
    } catch (e: any) { toast.error("Failed to load wallet"); }
    finally { setLoading(false); }
  }

  function validate(f: string, v: string) {
    if (f === "description") return !v.trim() ? "Required" : "";
    if (f === "amount")      return !v ? "Required" : Number(v) <= 0 ? "Must be > 0" : "";
    if (f === "paidBy")      return !v ? "Required" : "";
    return "";
  }

  function change(f: string, v: string) {
    setForm(p => ({ ...p, [f]: v }));
    if (fe[f]) setFe(p => ({ ...p, [f]: validate(f, v) }));
  }

  async function addExpense() {
    const errs = { description: validate("description", form.description), amount: validate("amount", form.amount), paidBy: validate("paidBy", form.paidBy) };
    setFe(errs);
    if (Object.values(errs).some(Boolean)) return;
    setSubmitting(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/wallet/expenses`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || "Failed"); }
      toast.success("Expense added!");
      setForm(p => ({ ...p, description: "", amount: "", category: "Food" }));
      setShowForm(false);
      loadAll();
    } catch (e: any) { toast.error(e.message); }
    finally { setSubmitting(false); }
  }

  async function handlePredictBudget() {
    setPredicting(true);
    setPredictError('');
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/trips/${tripId}/budget-predict`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Prediction failed");
      setPrediction(data);
      toast.success("AI Budget Prediction complete!");
    } catch (e: any) {
      setPredictError(e.message);
      toast.error(e.message);
    } finally {
      setPredicting(false);
    }
  }

  const totalSpent   = expenses.reduce((a, e) => a + (e.amount || 0), 0);
  const totalBudget  = wallet?.totalBudget || trip?.budget || 0;
  const remaining    = totalBudget - totalSpent;
  const spentPct     = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  function calculateSettlements() {
    if (!members.length || !expenses.length) return [];
    const balances: Record<string, number> = {};
    members.forEach(m => balances[m.userId || m.user?.id] = 0);

    expenses.forEach(exp => {
      const p = exp.paidBy;
      const amt = exp.amount;
      const split = amt / members.length;
      if (balances[p] !== undefined) balances[p] += amt;
      members.forEach(m => {
        const uid = m.userId || m.user?.id;
        if (balances[uid] !== undefined) balances[uid] -= split;
      });
    });

    const debtors = Object.keys(balances).filter(k => balances[k] < -0.01).map(k => ({ id: k, amount: -balances[k] })).sort((a,b) => b.amount - a.amount);
    const creditors = Object.keys(balances).filter(k => balances[k] > 0.01).map(k => ({ id: k, amount: balances[k] })).sort((a,b) => b.amount - a.amount);

    const results = [];
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const d = debtors[i], c = creditors[j];
      const amt = Math.min(d.amount, c.amount);
      results.push({ from: d.id, to: c.id, amount: amt });
      d.amount -= amt; c.amount -= amt;
      if (d.amount < 0.01) i++;
      if (c.amount < 0.01) j++;
    }
    return results;
  }

  const settlements = calculateSettlements();

  // ── Chart Data Processing ──
  const categoryData = CATEGORIES.map(cat => {
    const total = expenses
      .filter(e => e.category === cat)
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    return { name: cat, value: total };
  }).filter(c => c.value > 0);

  const memberContributionData = members.map(m => {
    const uid = m.userId || m.user?.id;
    const paid = expenses
      .filter(e => e.paidBy === uid)
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    return { name: m.user?.username || m.username, amount: paid };
  });

  const dailySpendingData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const total = expenses
      .filter(e => new Date(e.createdAt).toDateString() === d.toDateString())
      .reduce((acc, e) => acc + (e.amount || 0), 0);
    return { date: label, amount: total };
  });

  if (loading) return (
    <div className="anim-in">
      {[80, 140, 300].map((h, i) => (
        <div key={i} style={{ height: h, borderRadius: 16, background: "#1a2744", marginBottom: 14, animation: "pulse 1.5s ease-in-out infinite" }} />
      ))}
    </div>
  );

  return (
    <div className="anim-in">

      {/* Back */}
      <button onClick={() => router.push(`/trips/${tripId}`)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#475569", cursor: "pointer", fontSize: 13, marginBottom: 20, padding: 0 }}>
        <ArrowLeft style={{ width: 15, height: 15 }} /> Back to Trip
      </button>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Wallet & Expenses</h1>
          <p className="page-subtitle">{trip?.name}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className={showForm ? "btn-ghost" : "btn-primary"} style={{ padding: "10px 20px" }}>
          {showForm ? <><X style={{ width: 15, height: 15 }} /> Cancel</> : <><Plus style={{ width: 15, height: 15 }} /> Add Expense</>}
        </button>
      </div>

      {/* ── BUDGET OVERVIEW ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { icon: Wallet,      label: "Total Budget", value: `₹${totalBudget.toLocaleString()}`,  color: "#f97316", bg: "rgba(249,115,22,0.1)"   },
          { icon: TrendingDown,label: "Spent",        value: `₹${totalSpent.toLocaleString()}`,   color: "#ef4444", bg: "rgba(239,68,68,0.1)"    },
          { icon: Wallet,      label: "Remaining",    value: `₹${remaining.toLocaleString()}`,    color: remaining >= 0 ? "#22c55e" : "#ef4444", bg: remaining >= 0 ? "rgba(34,197,94,0.1)" : "rgba(239,68,68,0.1)" },
          { icon: Receipt,     label: "Transactions", value: expenses.length,                     color: "#60a5fa", bg: "rgba(96,165,250,0.1)"   },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="card" style={{ padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon style={{ width: 13, height: 13, color }} />
              </div>
              <p style={{ fontSize: 11, color: "#64748b", fontWeight: 600, margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</p>
            </div>
            <p style={{ fontSize: 18, fontWeight: 900, color: "white", margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── CHARTS SECTION ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20, marginBottom: 24 }}>
        
        {/* Category Breakdown Pie */}
        <div className="card" style={{ padding: 24, height: 350, display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 20 }}>Categorical Spending</h3>
          {categoryData.length > 0 ? (
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLOR[entry.name.toLowerCase()] || "#94a3b8"} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }}
                    itemStyle={{ color: 'white' }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 13 }}>
              Add expenses to see breakdown
            </div>
          )}
        </div>

        {/* Member Spending Bar */}
        <div className="card" style={{ padding: 24, height: 350, display: "flex", flexDirection: "column" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 20 }}>Member Contributions</h3>
          {memberContributionData.length > 0 ? (
            <div style={{ flex: 1, minHeight: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={memberContributionData}>
                  <XAxis dataKey="name" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }}
                  />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 13 }}>
              No member data available
            </div>
          )}
        </div>

        {/* Recent Spending Area Chart */}
        <div className="card" style={{ padding: 24, height: 300, gridColumn: "1 / -1" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 20 }}>Spending Trend (Last 7 Days)</h3>
          <div style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailySpendingData}>
                <defs>
                  <linearGradient id="colorAmt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis fontSize={10} tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, fontSize: 12 }}
                />
                <Area type="monotone" dataKey="amount" stroke="#f97316" fillOpacity={1} fill="url(#colorAmt)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── AI BUDGET PREDICTOR ── */}
      {trip?.adminId === currentUser?.id && (
        <div className="card" style={{ padding: 22, marginBottom: 24, background: "rgba(124,58,237,0.03)", borderColor: "rgba(124,58,237,0.15)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: prediction ? 16 : 0 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: "#a78bfa", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                 ✨ AI Smart Budget Predictor
              </h3>
              <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
                Not sure if ₹{totalBudget.toLocaleString()} is enough? Let AI estimate the minimum required budget for {members.length} members based on the route and duration.
              </p>
            </div>
            {!prediction && !predicting && (
              <button onClick={handlePredictBudget} style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.3)", padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }} className="hover:bg-purple-500/20 transition-colors">
                Predict Budget
              </button>
            )}
          </div>

          {predicting && (
            <div style={{ padding: 16, textAlign: "center" }}>
              <Loader2 style={{ width: 24, height: 24, margin: "0 auto 10px", animation: "spin 1s linear infinite", color: "#a78bfa" }} />
              <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0 }}>AI is calculating real-world costs...</p>
            </div>
          )}

          {predictError && (
             <div style={{ padding: 12, background: "rgba(239,68,68,0.1)", color: "#f87171", borderRadius: 10, fontSize: 13, marginTop: 12, border: "1px solid rgba(239,68,68,0.2)" }}>
               {predictError}
             </div>
          )}

          {prediction && !predicting && (
            <div style={{ marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                 <p style={{ fontSize: 16, color: "white", margin: 0, fontWeight: 700 }}>
                   Estimated Cost: <span style={{ color: prediction.totalEstimated > totalBudget ? "#ef4444" : "#4ade80" }}>₹{prediction.totalEstimated?.toLocaleString() || 0}</span>
                 </p>
                 <button onClick={() => setPrediction(null)} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", color: "#94a3b8", padding: "6px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer" }}>Clear</button>
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: 16 }}>
                 {prediction.breakdown?.map((b: any, i: number) => (
                   <div key={i} style={{ background: "rgba(15,23,42,0.6)", padding: "12px 14px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.05)" }}>
                     <p style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, margin: "0 0 4px" }}>{b.category}</p>
                     <p style={{ fontSize: 15, color: "white", fontWeight: 800, margin: "0 0 6px" }}>₹{b.amount?.toLocaleString()}</p>
                     <p style={{ fontSize: 11, color: "#64748b", margin: 0, lineHeight: 1.4 }}>{b.reason}</p>
                   </div>
                 ))}
              </div>

              {prediction.advice && (
                <div style={{ padding: 14, background: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.15)", borderRadius: 10 }}>
                  <p style={{ fontSize: 11, color: "#4ade80", textTransform: "uppercase", fontWeight: 700, margin: "0 0 4px" }}>💡 AI Advice</p>
                  <p style={{ fontSize: 13, color: "#cbd5e1", margin: 0, lineHeight: 1.5 }}>{prediction.advice}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── SETTLEMENT REMINDERS ── */}
      {settlements.length > 0 && (
        <div style={{ ...card, padding: 24, marginBottom: 24, border: '1px solid rgba(59,130,246,0.3)', background: 'linear-gradient(135deg, rgba(30,41,59,0.9), rgba(15,23,42,0.9))', gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users style={{ width: 20, height: 20, color: '#60A5FA' }} />
              </div>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0 }}>Settlement Roadmap</h3>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0 }}>Optimized paths to balance the trip budget</p>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
            {settlements.map((s: any, idx) => {
              const fromUser = members.find((m: any) => (m.userId || m.user?.id) === s.from);
              const toUser = members.find((m: any) => (m.userId || m.user?.id) === s.to);
              const isCurrentUserDebtor = (fromUser?.userId || fromUser?.user?.id) === currentUser?.id;
              
              return (
                <div key={idx} style={{ padding: 16, borderRadius: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: -8 }}>
                     <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#EF4444', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', zIndex: 2 }}>
                        {fromUser?.user?.username?.[0].toUpperCase() || '?'}
                     </div>
                     <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#22C55E', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', marginLeft: -12, zIndex: 1 }}>
                        {toUser?.user?.username?.[0].toUpperCase() || '?'}
                     </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, color: 'white', fontWeight: 600, margin: 0 }}>
                      <span style={{ color: '#F87171' }}>@{fromUser?.user?.username || fromUser?.username}</span>
                      <span style={{ margin: '0 6px', color: '#64748b' }}>→</span>
                      <span style={{ color: '#4ADE80' }}>@{toUser?.user?.username || toUser?.username}</span>
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: 'white', margin: '4px 0 0' }}>₹{Math.round(s.amount).toLocaleString()}</p>
                  </div>
                  {isCurrentUserDebtor ? (
                    <button onClick={() => toast.success("Marked as paid!")} style={{ background: '#22C55E', color: 'white', border: 'none', padding: '8px 16px', borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: 'pointer' }} className="hover:bg-green-600 transition-all">
                      Settle Up
                    </button>
                  ) : (
                    <button onClick={() => toast.success(`Reminder sent to @${fromUser?.user?.username || fromUser?.username}`)} style={{ ...btn('rgba(59,130,246,0.1)', '#60a5fa'), padding: '8px 14px', fontSize: 12 }}>
                      <Bell style={{ width: 14, height: 14 }} /> Remind
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── ADD EXPENSE FORM ── */}
      {showForm && (
        <div className="card" style={{ padding: 22, marginBottom: 24, borderColor: "rgba(249,115,22,0.2)" }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 18 }}>New Expense</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            {/* Description */}
            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 7 }}>Description</label>
              <input className="input-field" style={{ border: `1.5px solid ${fe.description ? "#ef4444" : "#1e293b"}` }} placeholder="e.g. Hotel stay night 1" value={form.description} onChange={e => change("description", e.target.value)} />
              {fe.description && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{fe.description}</p>}
            </div>
            {/* Amount */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 7 }}>Amount (₹)</label>
              <input type="number" className="input-field" style={{ border: `1.5px solid ${fe.amount ? "#ef4444" : "#1e293b"}` }} placeholder="e.g. 2500" value={form.amount} onChange={e => change("amount", e.target.value)} min={1} />
              {fe.amount && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{fe.amount}</p>}
            </div>
            {/* Category */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 7 }}>Category</label>
              <div style={{ position: "relative" }}>
                <select
                  value={form.category}
                  onChange={e => change("category", e.target.value)}
                  style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: "1.5px solid #1e293b", borderRadius: 12, padding: "12px 36px 12px 14px", color: "#f1f5f9", fontSize: 14, fontFamily: "Inter,sans-serif", outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#475569", pointerEvents: "none" }} />
              </div>
            </div>
            {/* Paid By */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 7 }}>Paid By</label>
              <div style={{ position: "relative" }}>
                <select
                  value={form.paidBy}
                  onChange={e => change("paidBy", e.target.value)}
                  style={{ width: "100%", background: "rgba(15,23,42,0.8)", border: `1.5px solid ${fe.paidBy ? "#ef4444" : "#1e293b"}`, borderRadius: 12, padding: "12px 36px 12px 14px", color: "#f1f5f9", fontSize: 14, fontFamily: "Inter,sans-serif", outline: "none", appearance: "none", cursor: "pointer" }}
                >
                  <option value="">Select member</option>
                  {members.map((m: any) => (
                    <option key={m.userId || m.user?.id} value={m.userId || m.user?.id}>
                      @{m.user?.username || m.username}
                    </option>
                  ))}
                </select>
                <ChevronDown style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 13, height: 13, color: "#475569", pointerEvents: "none" }} />
              </div>
              {fe.paidBy && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>{fe.paidBy}</p>}
            </div>
            {/* Split type */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "#94a3b8", marginBottom: 7 }}>Split Type</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["equal", "custom"].map(t => (
                  <button key={t} type="button" onClick={() => change("splitType", t)} style={{ flex: 1, padding: "10px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", transition: "all 0.15s", background: form.splitType === t ? "rgba(249,115,22,0.12)" : "transparent", border: `1px solid ${form.splitType === t ? "rgba(249,115,22,0.35)" : "#1e293b"}`, color: form.splitType === t ? "#f97316" : "#475569" }}>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <button onClick={addExpense} disabled={submitting} className="btn-primary" style={{ width: "100%", padding: "13px" }}>
            {submitting ? <><Loader2 style={{ width: 15, height: 15, animation: "spin 1s linear infinite" }} /> Adding...</> : <><Plus style={{ width: 15, height: 15 }} /> Add Expense</>}
          </button>
        </div>
      )}

      {/* ── EXPENSE LIST ── */}
      <div>
        <h2 style={{ fontSize: 15, fontWeight: 800, color: "white", marginBottom: 16 }}>
          Expenses {expenses.length > 0 && <span style={{ fontSize: 12, color: "#475569", fontWeight: 500 }}>({expenses.length})</span>}
        </h2>

        {expenses.length === 0 ? (
          <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
            <Receipt style={{ width: 32, height: 32, color: "#334155", margin: "0 auto 12px" }} />
            <p style={{ color: "#475569", fontSize: 14, marginBottom: 16 }}>No expenses yet</p>
            <button onClick={() => setShowForm(true)} className="btn-primary" style={{ padding: "10px 24px", fontSize: 13 }}>
              <Plus style={{ width: 14, height: 14 }} /> Add First Expense
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {expenses.map((exp: any) => {
              const catColor = CATEGORY_COLOR[exp.category?.toLowerCase()] || "#94a3b8";
              const paidByUser = members.find((m: any) => (m.userId || m.user?.id) === exp.paidBy);
              return (
                <div key={exp.id} className="card card-hover" style={{ padding: "16px 18px", display: "flex", alignItems: "center", gap: 14 }}>
                  {/* Category dot */}
                  <div style={{ width: 38, height: 38, borderRadius: 11, flexShrink: 0, background: `${catColor}15`, border: `1px solid ${catColor}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Receipt style={{ width: 15, height: 15, color: catColor }} />
                  </div>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: "white", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{exp.description}</p>
                    <div style={{ display: "flex", gap: 10, marginTop: 3 }}>
                      <span className="badge" style={{ background: `${catColor}15`, border: `1px solid ${catColor}25`, color: catColor, fontSize: 10 }}>
                        {exp.category || "Other"}
                      </span>
                      <span style={{ fontSize: 11, color: "#334155" }}>
                        Paid by @{paidByUser?.user?.username || paidByUser?.username || "Unknown"}
                      </span>
                      <span style={{ fontSize: 11, color: "#334155" }}>{timeAgo(exp.createdAt)}</span>
                    </div>
                  </div>
                  {/* Amount */}
                  <div style={{ textAlign: "right", flexShrink: 0 }}>
                    <p style={{ fontSize: 16, fontWeight: 900, color: "#f97316", margin: 0 }}>₹{exp.amount?.toLocaleString()}</p>
                    <p style={{ fontSize: 11, color: "#334155", margin: 0 }}>
                      {exp.splitType === "equal" ? `÷${members.length}` : "Custom split"}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
