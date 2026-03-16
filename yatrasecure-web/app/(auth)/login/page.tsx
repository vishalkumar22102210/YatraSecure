'use client';
import { useState, FormEvent } from 'react';
import Link from 'next/link';
import {
  Mail, Lock, Eye, EyeOff,
  ArrowRight, Loader2, AlertCircle,
} from 'lucide-react';
import { API_BASE_URL, setTokens } from '@/app/lib/api';

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [fe,       setFe]       = useState<Record<string, string>>({});

  function validate(field: string, val: string) {
    if (field === 'email')
      return !val.trim() ? 'Email is required' : !/\S+@\S+\.\S+/.test(val) ? 'Invalid email' : '';
    if (field === 'password')
      return !val ? 'Password is required' : val.length < 6 ? 'Min 6 characters' : '';
    return '';
  }

  function blur(field: string, val: string) {
    setFe((p) => ({ ...p, [field]: validate(field, val) }));
  }

  function change(field: string, val: string) {
    if (field === 'email')    setEmail(val);
    if (field === 'password') setPassword(val);
    if (fe[field]) setFe((p) => ({ ...p, [field]: validate(field, val) }));
    setError('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = { email: validate('email', email), password: validate('password', password) };
    setFe(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Invalid credentials');
      }

      const accessToken  = data.access_token;
      const refreshToken = data.refresh_token;
      const expiresIn    = data.expires_in;

      if (!accessToken) throw new Error('Login failed — no token received');

      setTokens(accessToken, refreshToken, Number(expiresIn));
      localStorage.setItem('user', JSON.stringify(data.user ?? {}));

      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const inputBase: React.CSSProperties = {
    width: '100%', height: 48, paddingLeft: 42, paddingRight: 16,
    borderRadius: 12, fontSize: 14, color: '#f8fafc',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    outline: 'none', transition: 'all 0.2s',
  };
  const inputErr: React.CSSProperties = { ...inputBase, borderColor: 'rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.05)' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 };

  return (
    <div className="anim-in">

      {/* Heading */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'white', letterSpacing: '-0.03em', marginBottom: 8 }}>
          Welcome back
        </h2>
        <p style={{ color: '#64748b', fontSize: 15 }}>
          Sign in to your account to continue
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="anim-shake" style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 16px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0 }} />
          <p style={{ color: '#fca5a5', fontSize: 13, fontWeight: 500, margin: 0 }}>{error}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email</label>
          <div style={{ position: 'relative' }}>
            <Mail style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              width: 16, height: 16, color: '#64748b', pointerEvents: 'none',
            }} />
            <input
              type="email" value={email}
              onChange={(e) => change('email', e.target.value)} onBlur={(e)  => blur('email', e.target.value)}
              placeholder="name@company.com"
              style={fe.email ? inputErr : inputBase}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(249,115,22,0.5)'}
              onMouseOut={(e) => { if (!fe.email && e.target !== document.activeElement) (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
              autoComplete="email" required
            />
          </div>
          {fe.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{fe.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Password</label>
            <Link href="/forgot-password" style={{ fontSize: 13, color: '#f97316', fontWeight: 500, textDecoration: 'none' }}>
              Forgot password?
            </Link>
          </div>
          <div style={{ position: 'relative' }}>
            <Lock style={{
              position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
              width: 16, height: 16, color: '#64748b', pointerEvents: 'none',
            }} />
            <input
              type={showPw ? 'text' : 'password'} value={password}
              onChange={(e) => change('password', e.target.value)} onBlur={(e)  => blur('password', e.target.value)}
              placeholder="••••••••"
              style={{ ...(fe.password ? inputErr : inputBase), paddingRight: 44, fontSize: showPw ? 14 : 18, letterSpacing: showPw ? 'normal' : '2px' }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(249,115,22,0.5)'}
              onMouseOut={(e) => { if (!fe.password && e.target !== document.activeElement) (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
              autoComplete="current-password" required
            />
            <button
              type="button" onClick={() => setShowPw(!showPw)}
              style={{
                position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0,
              }}
            >
              {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
          {fe.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{fe.password}</p>}
        </div>

        {/* Submit */}
        <button
          type="submit" disabled={loading} className="btn-primary"
          style={{
            width: '100%', height: 48, fontSize: 15, fontWeight: 600, marginTop: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            borderRadius: 12, transition: 'all 0.2s',
          }}
        >
          {loading ? (
            <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} />
          ) : (
            'Sign In'
          )}
        </button>
      </form>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '28px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
        <span style={{ fontSize: 12, color: '#64748b', fontWeight: 500, letterSpacing: '0.05em', textTransform: 'uppercase' }}>or continue with</span>
        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
      </div>

      {/* Social */}
      <div style={{ display: 'flex', gap: 12 }}>
        {[
          {
            label: 'Google',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            ),
          },
          {
            label: 'Apple',
            icon: (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="#f1f5f9">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
              </svg>
            ),
          },
        ].map(({ label, icon }) => (
          <button
            key={label} type="button"
            style={{
              flex: 1, height: 46, borderRadius: 12,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.02)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              fontSize: 14, fontWeight: 600, color: '#e2e8f0',
              cursor: 'pointer', transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 32 }}>
        Don't have an account?{' '}
        <Link href="/signup" style={{ color: 'white', fontWeight: 600, textDecoration: 'none' }}>
          Sign up
        </Link>
      </p>

    </div>
  );
}
