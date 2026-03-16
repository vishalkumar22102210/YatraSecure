'use client';
import { useState, FormEvent, useMemo } from 'react';
import Link from 'next/link';
import {
  Mail, Lock, User, Eye, EyeOff,
  ArrowRight, Loader2, AlertCircle,
  Check, X, ShieldCheck,
} from 'lucide-react';
import { API_BASE_URL, setTokens } from '@/app/lib/api';

export default function SignupPage() {
  const [email,    setEmail]    = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [showCf,   setShowCf]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [fe,       setFe]       = useState<Record<string, string>>({});

  const checks = useMemo(() => ({
    len:   password.length >= 8,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    num:   /[0-9]/.test(password),
    spec:  /[!@#$%^&*]/.test(password),
  }), [password]);

  const strength = useMemo(() => {
    const p = Object.values(checks).filter(Boolean).length;
    if (p <= 1) return { l: 'Weak',      w: 20,  c: '#ef4444' };
    if (p === 2) return { l: 'Fair',      w: 40,  c: '#f97316' };
    if (p === 3) return { l: 'Good',      w: 60,  c: '#eab308' };
    if (p === 4) return { l: 'Strong',    w: 80,  c: '#22c55e' };
    return              { l: 'Perfect',   w: 100, c: '#4f46e5' };
  }, [checks]);

  function validate(field: string, val: string) {
    if (field === 'username') return !val.trim() ? 'Required' : val.trim().length < 3 ? 'Min 3 chars' : !/^[a-zA-Z0-9_]+$/.test(val.trim()) ? 'Invalid format' : '';
    if (field === 'email')    return !val.trim() ? 'Required' : !/\S+@\S+\.\S+/.test(val) ? 'Invalid email' : '';
    if (field === 'password') return !val ? 'Required' : val.length < 8 ? 'Min 8 chars' : '';
    if (field === 'confirm')  return !val ? 'Required' : val !== password ? "Passwords don't match" : '';
    return '';
  }

  function change(field: string, val: string, setter: (v: string) => void) {
    setter(val);
    if (fe[field]) setFe((p) => ({ ...p, [field]: validate(field, val) }));
    setError('');
  }
  function blur(field: string, val: string) { setFe((p) => ({ ...p, [field]: validate(field, val) })); }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = { username: validate('username', username), email: validate('email', email), password: validate('password', password), confirm: validate('confirm', confirm) };
    setFe(errs);
    if (Object.values(errs).some(Boolean)) return;

    setLoading(true); setError('');

    try {
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method:  'POST', headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), username: username.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Signup failed');

      const accessToken  = data.access_token;
      const refreshToken = data.refresh_token;
      const expiresIn    = data.expires_in;

      if (!accessToken) throw new Error('Signup failed — no token received');

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
    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
    outline: 'none', transition: 'all 0.2s',
  };
  const inputErr: React.CSSProperties = { ...inputBase, borderColor: 'rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.05)' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 13, fontWeight: 500, color: '#94a3b8', marginBottom: 8 };

  return (
    <div className="anim-in">
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'white', letterSpacing: '-0.03em', marginBottom: 8 }}>
          Create an account
        </h2>
        <p style={{ color: '#64748b', fontSize: 15 }}>
          Join thousands of safe travelers across India
        </p>
      </div>

      {error && (
        <div className="anim-shake" style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, marginBottom: 24,
          background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
        }}>
          <AlertCircle style={{ width: 16, height: 16, color: '#ef4444', flexShrink: 0 }} />
          <p style={{ color: '#fca5a5', fontSize: 13, fontWeight: 500, margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Username */}
        <div>
          <label style={labelStyle}>Username</label>
          <div style={{ position: 'relative' }}>
            <User style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#64748b', pointerEvents: 'none' }} />
            <input
              type="text" value={username} onChange={(e) => change('username', e.target.value, setUsername)} onBlur={(e)  => blur('username', e.target.value)}
              placeholder="e.g. rohit_sharma" style={fe.username ? inputErr : inputBase}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(249,115,22,0.5)'}
              onMouseOut={(e) => { if (!fe.username && e.target !== document.activeElement) (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
              autoComplete="username" required
            />
          </div>
          {fe.username && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{fe.username}</p>}
        </div>

        {/* Email */}
        <div>
          <label style={labelStyle}>Email</label>
          <div style={{ position: 'relative' }}>
            <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#64748b', pointerEvents: 'none' }} />
            <input
              type="email" value={email} onChange={(e) => change('email', e.target.value, setEmail)} onBlur={(e)  => blur('email', e.target.value)}
              placeholder="name@company.com" style={fe.email ? inputErr : inputBase}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(249,115,22,0.5)'}
              onMouseOut={(e) => { if (!fe.email && e.target !== document.activeElement) (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
              autoComplete="email" required
            />
          </div>
          {fe.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{fe.email}</p>}
        </div>

        {/* Password */}
        <div>
          <label style={labelStyle}>Password</label>
          <div style={{ position: 'relative' }}>
            <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#64748b', pointerEvents: 'none' }} />
            <input
              type={showPw ? 'text' : 'password'} value={password} onChange={(e) => change('password', e.target.value, setPassword)} onBlur={(e)  => blur('password', e.target.value)}
              placeholder="Create a strong password" style={{ ...(fe.password ? inputErr : inputBase), paddingRight: 44, fontSize: showPw ? 14 : 18, letterSpacing: showPw ? 'normal' : '2px' }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(249,115,22,0.5)'}
              onMouseOut={(e) => { if (!fe.password && e.target !== document.activeElement) (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
              autoComplete="new-password" required
            />
            <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0 }}>
              {showPw ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
          {fe.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{fe.password}</p>}
          
          {password && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, transition: 'all 0.4s', width: `${strength.w}%`, background: strength.c }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Confirm */}
        <div>
          <label style={labelStyle}>Confirm password</label>
          <div style={{ position: 'relative' }}>
            <ShieldCheck style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: '#64748b', pointerEvents: 'none' }} />
            <input
              type={showCf ? 'text' : 'password'} value={confirm} onChange={(e) => change('confirm', e.target.value, setConfirm)} onBlur={(e)  => blur('confirm', e.target.value)}
              placeholder="Repeat your password" style={{ ...(fe.confirm ? inputErr : inputBase), paddingRight: 44, fontSize: showCf ? 14 : 18, letterSpacing: showCf ? 'normal' : '2px' }}
              onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = 'rgba(249,115,22,0.5)'}
              onMouseOut={(e) => { if (!fe.confirm && e.target !== document.activeElement) (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.08)' }}
              autoComplete="new-password" required
            />
            <button type="button" onClick={() => setShowCf(!showCf)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', padding: 0 }}>
              {showCf ? <EyeOff style={{ width: 16, height: 16 }} /> : <Eye style={{ width: 16, height: 16 }} />}
            </button>
          </div>
          {fe.confirm && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{fe.confirm}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', height: 48, fontSize: 15, fontWeight: 600, marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, transition: 'all 0.2s' }}>
          {loading ? <Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> : 'Create Account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14, color: '#64748b', marginTop: 32 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'white', fontWeight: 600, textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
