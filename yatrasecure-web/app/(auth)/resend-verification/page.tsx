'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Loader2, CheckCircle, AlertCircle, ArrowLeft, MapPin } from 'lucide-react';
import { API_BASE_URL } from '@/app/lib/api';

export default function ResendVerificationPage() {
  const [email,   setEmail]   = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error,   setError]   = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setMessage('');
    try {
      const res  = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) { setMessage(data.message || 'Verification email sent! Check your inbox.'); setEmail(''); }
      else          { setError(data.message   || 'Something went wrong. Please try again.'); }
    } catch { setError('Network error. Please check your connection.'); }
    finally  { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>
      {/* Ambient glow */}
      <div style={{ position: 'fixed', top: '-10%', left: '50%', transform: 'translateX(-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(56,189,248,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="anim-in" style={{ width: '100%', maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--cta-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(56,189,248,0.35)' }}>
              <MapPin style={{ width: 20, height: 20, color: 'white' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'white', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>YatraSecure</span>
          </Link>
        </div>

        <div className="glass-card" style={{ padding: '40px 36px' }}>
          {/* Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mail style={{ width: 28, height: 28, color: 'var(--accent)' }} />
            </div>
          </div>

          <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 700, color: 'white', textAlign: 'center', marginBottom: 8, letterSpacing: '-0.025em' }}>
            Resend Verification
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: 14, textAlign: 'center', marginBottom: 28, lineHeight: 1.6 }}>
            Enter your email address and we&apos;ll send you a fresh verification link.
          </p>

          {/* Success */}
          {message && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 12, marginBottom: 20, background: 'rgba(34,197,94,0.08)', border: '1.5px solid rgba(34,197,94,0.25)' }}>
              <CheckCircle style={{ width: 16, height: 16, color: '#22c55e', flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: '#22c55e', fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>{message}</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 12, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0, marginTop: 1 }} />
              <p style={{ color: '#ef4444', fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.5 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 7 }}>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: 'var(--text3)', pointerEvents: 'none' }} />
                <input
                  type="email" value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="input-field"
                  style={{ paddingLeft: 44 }}
                  required
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', height: 50, fontSize: 15, fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 4 }}>
              {loading ? <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> Sending...</> : 'Send Verification Link'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--accent)', fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
              <ArrowLeft style={{ width: 14, height: 14 }} /> Back to Login
            </Link>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
