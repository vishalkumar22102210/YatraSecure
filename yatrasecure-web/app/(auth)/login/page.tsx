'use client';
import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle, MapPin } from 'lucide-react';
import { API_BASE_URL, setTokens } from '@/app/lib/api';

const LOGIN_PHOTO  = 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1200&q=80';
const SIGNUP_PHOTO = 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&q=80';
const LOGIN_QUOTE  = '"The world is a book, and those who do not travel read only one page."';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function LoginPage() {
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [fe,       setFe]       = useState<Record<string, string>>({});
  const [accountTab, setAccountTab] = useState<'personal' | 'business'>('personal');
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function validate(field: string, val: string) {
    if (field === 'email')    return !val.trim() ? 'Email is required' : !/\S+@\S+\.\S+/.test(val) ? 'Invalid email' : '';
    if (field === 'password') return !val ? 'Password is required' : val.length < 6 ? 'Min 6 characters' : '';
    return '';
  }
  function blur(field: string, val: string) { setFe(p => ({ ...p, [field]: validate(field, val) })); }
  function change(field: string, val: string) {
    if (field === 'email')    setEmail(val);
    if (field === 'password') setPassword(val);
    if (fe[field]) setFe(p => ({ ...p, [field]: validate(field, val) }));
    setError('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = { email: validate('email', email), password: validate('password', password) };
    setFe(errs);
    if (Object.values(errs).some(Boolean)) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Invalid credentials');
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

  const fields = ['email', 'password'];

  return (
    <div className="fade-slide in" style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ══ LEFT — PHOTO PANEL ══════════════════════════════════════════════ */}
      <div style={{ flex: '0 0 50%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} className="hidden md:flex">
        {/* Crossfade photo */}
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: mounted ? 1 : 0, transition: 'opacity 0.7s' }}>
          <img src={LOGIN_PHOTO} alt="Travel" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        {/* Dark overlay */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,17,32,0.62)', zIndex: 2 }} />
        {/* Bottom gradient for quote legibility */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(11,17,32,0.95) 0%, transparent 100%)', zIndex: 2 }} />
        {/* Accent line */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--cta-gradient)', zIndex: 4 }} />

        {/* Logo */}
        <div style={{ position: 'relative', zIndex: 4, padding: '32px 40px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--cta-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(56,189,248,0.35)' }}>
              <MapPin style={{ width: 18, height: 18, color: 'white' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'white', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.02em' }}>YatraSecure</span>
          </Link>
        </div>

        {/* Quote */}
        <div style={{ position: 'relative', zIndex: 4, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 48px 56px' }}>
          <div style={{ width: 48, height: 3, background: 'var(--accent)', borderRadius: 2, marginBottom: 20 }} />
          <p style={{ fontStyle: 'italic', fontSize: 'clamp(18px, 2vw, 26px)', color: 'white', lineHeight: 1.55, textShadow: '0 2px 16px rgba(0,0,0,0.5)', marginBottom: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
            {LOGIN_QUOTE}
          </p>
          <div style={{ marginTop: 32, display: 'flex', gap: 28, animation: mounted ? 'fadeUp 0.8s 0.3s ease-out both' : 'none' }}>
            {[['2M+', 'Happy Travelers'], ['50K+', 'Group Trips'], ['4.9★', 'Avg Rating']].map(([v, l]) => (
              <div key={l}>
                <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', fontFamily: "'JetBrains Mono', monospace" }}>{v}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ RIGHT — FORM PANEL ══════════════════════════════════════════════ */}
      <div style={{ flex: 1, background: 'var(--bg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 40px', overflowY: 'auto', position: 'relative' }}>
        
        {/* Animated floating travel icons background */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          {[
            { emoji: '✈️', size: 32, top: '8%',  left: '10%', dur: '18s', delay: '0s',   rot: '25deg'  },
            { emoji: '🧭', size: 28, top: '20%', left: '80%', dur: '22s', delay: '-4s',  rot: '-15deg' },
            { emoji: '🗺️', size: 36, top: '55%', left: '15%', dur: '26s', delay: '-8s',  rot: '10deg'  },
            { emoji: '⛵', size: 30, top: '72%', left: '75%', dur: '20s', delay: '-12s', rot: '-20deg' },
            { emoji: '🏔️', size: 34, top: '40%', left: '88%', dur: '24s', delay: '-6s',  rot: '5deg'   },
            { emoji: '🌍', size: 40, top: '85%', left: '30%', dur: '30s', delay: '-15s', rot: '-10deg' },
            { emoji: '🎒', size: 28, top: '15%', left: '55%', dur: '19s', delay: '-3s',  rot: '18deg'  },
            { emoji: '📍', size: 24, top: '65%', left: '50%', dur: '23s', delay: '-9s',  rot: '-25deg' },
          ].map((item, i) => (
            <div key={i} style={{
              position: 'absolute', top: item.top, left: item.left,
              fontSize: item.size, opacity: 0.07,
              animation: `floatTravel ${item.dur} ease-in-out infinite`,
              animationDelay: item.delay,
              transform: `rotate(${item.rot})`,
              filter: 'blur(0.5px)',
            }}>
              {item.emoji}
            </div>
          ))}
        </div>

        <div style={{ width: '100%', maxWidth: 420, position: 'relative', zIndex: 1 }}>

          {/* Sliding pill account tab */}
          <div style={{ position: 'relative', display: 'flex', marginBottom: 36, background: 'rgba(255,255,255,0.06)', borderRadius: 50, padding: 4, overflow: 'hidden' }}>
            <div style={{
              position: 'absolute', top: 4, bottom: 4,
              left: accountTab === 'personal' ? 4 : 'calc(50% + 2px)',
              width: 'calc(50% - 6px)',
              background: 'var(--accent)', borderRadius: 50,
              boxShadow: '0 4px 14px rgba(56,189,248,0.35)',
              transition: 'left 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
            }} />
            {(['personal', 'business'] as const).map(tab => (
              <button key={tab} type="button" onClick={() => setAccountTab(tab)} style={{
                flex: 1, padding: '11px 0', border: 'none', background: 'transparent',
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600,
                color: accountTab === tab ? 'white' : 'var(--text2)',
                cursor: 'pointer', position: 'relative', zIndex: 1, transition: 'color 0.3s',
              }}>{tab === 'personal' ? 'Personal' : 'Business'}</button>
            ))}
          </div>

          {/* Heading */}
          <div style={{ marginBottom: 28, animation: mounted ? 'slideInRight 0.5s cubic-bezier(0.25,0.46,0.45,0.94) both' : 'none' }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 6 }}>Welcome back, Explorer</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>{accountTab === 'personal' ? 'Sign in to continue your journey.' : 'Access your corporate travel dashboard.'}</p>
          </div>

          {/* Error */}
          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#EF4444', flexShrink: 0 }} />
              <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 500, margin: 0 }}>{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {fields.map((field, i) => (
              <div key={field} style={{ animation: mounted ? `slideInRight 0.5s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 80 + 100}ms both` : 'none' }}>

                {field === 'email' && (
                  <>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 7 }}>Email address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: fe.email ? '#EF4444' : 'var(--text3)', pointerEvents: 'none' }} />
                      <input
                        type="email" value={email}
                        onChange={e => change('email', e.target.value)}
                        onBlur={e => blur('email', e.target.value)}
                        placeholder="name@example.com"
                        className={`input-field${fe.email ? ' error' : ''}`}
                        style={{ paddingLeft: 44 }}
                        autoComplete="email" required
                      />
                    </div>
                    {fe.email && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 5 }}>{fe.email}</p>}
                  </>
                )}

                {field === 'password' && (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                      <label style={{ fontSize: 13, fontWeight: 600, color: 'var(--text2)' }}>Password</label>
                      <Link href="/forgot-password" style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 600, textDecoration: 'none' }}>Forgot password?</Link>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <Lock style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: fe.password ? '#EF4444' : 'var(--text3)', pointerEvents: 'none' }} />
                      <input
                        type={showPw ? 'text' : 'password'} value={password}
                        onChange={e => change('password', e.target.value)}
                        onBlur={e => blur('password', e.target.value)}
                        placeholder="••••••••"
                        className={`input-field auth-pw-input${fe.password ? ' error' : ''}`}
                        style={{ paddingLeft: 44, paddingRight: 44 }}
                        autoComplete="current-password" required
                      />
                      <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 0 }}>
                        {showPw ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
                      </button>
                    </div>
                    {fe.password && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 5 }}>{fe.password}</p>}
                  </>
                )}
              </div>
            ))}

            {/* Submit */}
            <div style={{ animation: mounted ? `slideInRight 0.5s cubic-bezier(0.25,0.46,0.45,0.94) 260ms both` : 'none', marginTop: 4 }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', height: 52, fontSize: 16, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em' }}>
                {loading ? <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} /> : 'Sign In →'}
              </button>
            </div>
          </form>

          {/* Terms */}
          <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 14, lineHeight: 1.7 }}>
            By continuing, you agree to our{' '}
            <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Terms</a>{' '}and{' '}
            <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy</a>.
          </p>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
          </div>

          {/* Google */}
          <button type="button"
            style={{ width: '100%', height: 50, borderRadius: 12, border: '1.5px solid var(--border2)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 15, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(56,189,248,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <GoogleIcon /> Sign in with Google
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)', marginTop: 28 }}>
            Don&apos;t have an account?{' '}
            <Link href="/signup" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Create one free →</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes fadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
        @keyframes floatTravel {
          0%   { transform: translateY(0px) rotate(var(--r, 0deg)) scale(1); }
          30%  { transform: translateY(-18px) rotate(calc(var(--r, 0deg) + 8deg)) scale(1.05); }
          60%  { transform: translateY(-8px) rotate(calc(var(--r, 0deg) - 5deg)) scale(0.97); }
          100% { transform: translateY(0px) rotate(var(--r, 0deg)) scale(1); }
        }
        .auth-pw-input { font-size:15px !important; }
        .auth-pw-input[type='password']:not(:placeholder-shown) { letter-spacing:3px; }
      `}</style>
    </div>
  );
}