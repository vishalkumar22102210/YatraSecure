'use client';

import { useState, useEffect } from 'react';
import { Wallet, Bell, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { API_BASE_URL, getAccessToken } from '@/app/lib/api';
import toast from 'react-hot-toast';

interface Settlement {
  from: string;
  fromUsername: string;
  to: string;
  toUsername: string;
  amount: number;
}

export default function PendingSettlements({ tripId }: { tripId: string }) {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [nudging, setNudging] = useState<string | null>(null);

  useEffect(() => {
    fetchSettlements();
  }, [tripId]);

  async function fetchSettlements() {
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/expenses/settlement`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettlements(data);
      }
    } catch (e) {
      console.error('Error fetching settlements:', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleNudge(toId: string, amount: number) {
    setNudging(toId);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/expenses/nudge`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ toId, amount }),
      });

      if (res.ok) {
        toast.success('Nudge sent successfully!');
      } else {
        toast.error('Failed to send nudge');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setNudging(null);
    }
  }

  if (loading) return null;
  if (settlements.length === 0) return (
     <div className="glass-card" style={{ padding: 24, borderRadius: 24, display: 'flex', alignItems: 'center', gap: 16, background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
        <CheckCircle2 style={{ width: 24, height: 24, color: '#10b981' }} />
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'white' }}>All Settled Up!</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>No pending expenses in this trip.</div>
        </div>
     </div>
  );

  return (
    <div className="glass-card" style={{ padding: 24, borderRadius: 24, border: '1px solid rgba(255,255,255,0.05)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet style={{ width: 20, height: 20, color: '#3b82f6' }} />
        </div>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0 }}>Pending Settlements</h3>
          <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>Who owes whom in the group</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {settlements.map((s, i) => (
          <div key={i} style={{ 
            padding: '16px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' 
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <div style={{ textAlign: 'right' }}>
                 <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{s.fromUsername}</div>
                 <div style={{ fontSize: 10, color: '#64748b' }}>Owes</div>
               </div>
               <Send style={{ width: 14, height: 14, color: '#64748b' }} />
               <div>
                 <div style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{s.toUsername}</div>
                 <div style={{ fontSize: 10, color: '#64748b' }}>To receive</div>
               </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: '#10b981' }}>₹{s.amount.toLocaleString()}</div>
              <button 
                onClick={() => handleNudge(s.from, s.amount)}
                disabled={nudging === s.from}
                title="Send a gentle reminder"
                style={{ 
                  width: 32, height: 32, borderRadius: 8, background: 'rgba(245,158,11,0.1)', 
                  border: 'none', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  cursor: 'pointer' 
                }}
                className="hover:scale-105 transition-transform"
              >
                {nudging === s.from ? (
                  <div className="animate-spin" style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }} />
                ) : (
                  <Bell style={{ width: 16, height: 16 }} />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: 20, padding: 12, borderRadius: 12, background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <AlertCircle style={{ width: 14, height: 14, color: '#7c3aed' }} />
        <span style={{ fontSize: 11, color: '#94a3b8' }}>Reminders are sent as in-app notifications to fellow travelers.</span>
      </div>
    </div>
  );
}
