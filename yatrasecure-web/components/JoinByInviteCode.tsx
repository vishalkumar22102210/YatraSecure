'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Lock, Loader2, ArrowRight, KeyRound } from 'lucide-react';
import { API_BASE_URL, getAccessToken } from '@/app/lib/api';

export default function JoinByInviteCode() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const token = getAccessToken();
      if (!token) { router.push('/login'); return; }

      const res = await fetch(`${API_BASE_URL}/trips/join/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim().toUpperCase() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Successfully joined the trip!');
        setCode('');
        router.push(`/trips/${data.tripId}`);
      } else {
        toast.error(data.message || 'Invalid invite code');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      padding: 20, borderRadius: 16,
      background: '#0d1829', border: '1px solid #1e293b',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <KeyRound style={{ width: 16, height: 16, color: '#a78bfa' }} />
        </div>
        <div>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: 0 }}>
            Join Private Trip
          </p>
          <p style={{ fontSize: 11, color: '#475569', margin: 0 }}>
            Enter invite code to join a private trip
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Lock style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            width: 14, height: 14, color: '#475569', pointerEvents: 'none',
          }} />
          <input
            suppressHydrationWarning
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. A1B2C3D4"
            maxLength={8}
            style={{
              width: '100%', height: 42, paddingLeft: 34, paddingRight: 14,
              borderRadius: 10, fontSize: 14, color: '#E2E8F0',
              background: '#0F172A', border: '1px solid rgba(148,163,184,0.12)',
              outline: 'none', fontFamily: 'monospace', letterSpacing: '0.15em',
              textTransform: 'uppercase',
            }}
            onFocus={e => { e.target.style.borderColor = '#7C3AED'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(148,163,184,0.12)'; }}
            onKeyDown={e => { if (e.key === 'Enter') handleJoin(); }}
          />
        </div>
        <button
          suppressHydrationWarning
          onClick={handleJoin}
          disabled={loading || !code.trim()}
          style={{
            height: 42, padding: '0 18px', borderRadius: 10,
            background: code.trim()
              ? 'linear-gradient(135deg, #7C3AED, #4F46E5)'
              : 'rgba(148,163,184,0.08)',
            border: 'none', color: 'white', fontSize: 13, fontWeight: 700,
            cursor: code.trim() ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: 6,
            opacity: loading ? 0.6 : 1, transition: 'all 0.15s',
            boxShadow: code.trim() ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
          }}
        >
          {loading
            ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
            : <ArrowRight style={{ width: 14, height: 14 }} />
          }
          Join
        </button>
      </div>
    </div>
  );
}