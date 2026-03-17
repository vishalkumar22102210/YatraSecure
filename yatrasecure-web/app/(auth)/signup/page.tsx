'use client';
import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, Loader2, AlertCircle, MapPin, CheckCircle } from 'lucide-react';
import { API_BASE_URL, setTokens } from '@/app/lib/api';

const SIGNUP_PHOTO = 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&q=80';

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

function PasswordStrengthBar({ password }: { password: string }) {
  const checks = [
    { label: '8+ chars',       ok: password.length >= 8 },
    { label: 'Uppercase',      ok: /[A-Z]/.test(password) },
    { label: 'Lowercase',      ok: /[a-z]/.test(password) },
    { label: 'Number',         ok: /[0-9]/.test(password) },
    { label: 'Special (!@#)', ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter(c => c.ok).length;
  const colors = ['', '#EF4444', '#F59E0B', '#EAB308', '#38BDF8', '#22C55E'];
  const labels = ['', 'Very Weak', 'Weak', 'Average', 'Strong', 'Very Strong'];

  if (!password) return null;
  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
        {[1,2,3,4,5].map(i => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i <= score ? colors[score] : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
        ))}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, color: score > 0 ? colors[score] : 'var(--text3)', margin: '0 0 4px' }}>{labels[score]}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
        {checks.map(({ label, ok }) => (
          <span key={label} style={{ fontSize: 11, color: ok ? '#22c55e' : 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}>
            <CheckCircle style={{ width: 11, height: 11 }} /> {label}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SignupPage() {
  const [username, setUsername] = useState('');
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [fe,       setFe]       = useState<Record<string, string>>({});
  const [mounted,  setMounted]  = useState(false);

  useEffect(() => { setMounted(true); }, []);

  function validate(field: string, val: string) {
    if (field === 'username') return !val.trim() ? 'Username is required' : val.length < 3 ? 'Min 3 characters' : /\s/.test(val) ? 'No spaces allowed' : '';
    if (field === 'email')    return !val.trim() ? 'Email is required' : !/\S+@\S+\.\S+/.test(val) ? 'Invalid email' : '';
    if (field === 'password') return !val ? 'Password is required' : val.length < 8 ? 'Min 8 characters' : '';
    return '';
  }
  function blur(field: string, val: string) { setFe(p => ({ ...p, [field]: validate(field, val) })); }
  function change(field: string, val: string) {
    if (field === 'username') setUsername(val);
    if (field === 'email')    setEmail(val);
    if (field === 'password') setPassword(val);
    if (fe[field]) setFe(p => ({ ...p, [field]: validate(field, val) }));
    setError('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const errs = {
      username: validate('username', username),
      email:    validate('email', email),
      password: validate('password', password),
    };
    setFe(errs);
    if (Object.values(errs).some(Boolean)) return;
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/auth/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Registration failed');
      const accessToken  = data.access_token;
      const refreshToken = data.refresh_token;
      const expiresIn    = data.expires_in;
      if (accessToken) {
        setTokens(accessToken, refreshToken, Number(expiresIn));
        localStorage.setItem('user', JSON.stringify(data.user ?? {}));
        window.location.href = '/dashboard';
      } else {
        window.location.href = '/login?registered=1';
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  const formFields: { key: string; label: string; type: string; placeholder: string; icon: any; autoComplete: string }[] = [
    { key: 'username', label: 'Choose a username',    type: 'text',     placeholder: 'your_username',     icon: User,  autoComplete: 'username'       },
    { key: 'email',    label: 'Email address',        type: 'email',    placeholder: 'name@example.com',  icon: Mail,  autoComplete: 'email'          },
    { key: 'password', label: 'Create a password',   type: 'password', placeholder: '••••••••',          icon: Lock,  autoComplete: 'new-password'   },
  ];

  return (
    <div className="fade-slide in" style={{ display: 'flex', minHeight: '100vh', overflow: 'hidden', background: 'var(--bg)' }}>

      {/* ══ LEFT — PHOTO PANEL ══════════════════════════════════════════════ */}
      <div style={{ flex: '0 0 50%', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }} className="hidden md:flex">
        <div style={{ position: 'absolute', inset: 0, zIndex: 1, opacity: mounted ? 1 : 0, transition: 'opacity 0.7s' }}>
          <img src={SIGNUP_PHOTO} alt="Travel the world" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }} />
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(11,17,32,0.62)', zIndex: 2 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(to top, rgba(11,17,32,0.95) 0%, transparent 100%)', zIndex: 2 }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'var(--cta-gradient)', zIndex: 4 }} />

        <div style={{ position: 'relative', zIndex: 4, padding: '32px 40px' }}>
          <Link href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--cta-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 16px rgba(56,189,248,0.35)' }}>
              <MapPin style={{ width: 18, height: 18, color: 'white' }} />
            </div>
            <span style={{ fontSize: 20, fontWeight: 700, color: 'white', fontFamily: "'Space Grotesk', sans-serif", letterSpacing: '-0.03em' }}>YatraSecure</span>
          </Link>
        </div>

        {/* Benefits list */}
        <div style={{ position: 'relative', zIndex: 4, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '0 48px 56px' }}>
          <div style={{ width: 48, height: 3, background: 'var(--accent)', borderRadius: 2, marginBottom: 20 }} />
          <h2 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: 'white', lineHeight: 1.3, marginBottom: 28, letterSpacing: '-0.03em' }}>
            Join India&apos;s safest<br />travel community
          </h2>
          {[
            'Real-time group trip coordination',
            'Verified travelers only — no spam',
            'Shared wallet with smart bill splitting',
            'AI-powered travel matchmaking',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(56,189,248,0.18)', border: '1px solid rgba(56,189,248,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <CheckCircle style={{ width: 12, height: 12, color: 'var(--accent)' }} />
              </div>
              <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.82)', fontWeight: 500 }}>{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ══ RIGHT — FORM PANEL ══════════════════════════════════════════════ */}
      <div style={{ flex: 1, background: 'var(--bg)', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 40px', overflowY: 'auto', position: 'relative' }}>

        {/* Animated floating travel icons background */}
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
          {[
            { emoji: '✈️', size: 30, top: '5%',  left: '70%', dur: '20s', delay: '0s',   rot: '-15deg' },
            { emoji: '🌋', size: 34, top: '25%', left: '8%',  dur: '24s', delay: '-5s',  rot: '20deg'  },
            { emoji: '🔭', size: 28, top: '50%', left: '85%', dur: '18s', delay: '-9s',  rot: '-10deg' },
            { emoji: '🏞️', size: 36, top: '70%', left: '60%', dur: '28s', delay: '-14s', rot: '12deg'  },
            { emoji: '🛕', size: 32, top: '80%', left: '20%', dur: '22s', delay: '-7s',  rot: '-22deg' },
            { emoji: '🌊', size: 38, top: '15%', left: '45%', dur: '26s', delay: '-3s',  rot: '8deg'   },
            { emoji: '⚓', size: 26, top: '60%', left: '30%', dur: '21s', delay: '-11s', rot: '-18deg' },
            { emoji: '🍍', size: 24, top: '38%', left: '92%', dur: '17s', delay: '-6s',  rot: '25deg'  },
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

          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 28, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.03em', marginBottom: 6 }}>Create your account</h1>
            <p style={{ color: 'var(--text2)', fontSize: 14, lineHeight: 1.6, fontFamily: "'Inter', sans-serif" }}>Free forever. No credit card required.</p>
          </div>

          {error && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 12, marginBottom: 20, background: 'rgba(239,68,68,0.08)', border: '1.5px solid rgba(239,68,68,0.25)' }}>
              <AlertCircle style={{ width: 16, height: 16, color: '#EF4444', flexShrink: 0 }} />
              <p style={{ color: '#EF4444', fontSize: 13, fontWeight: 500, margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {formFields.map(({ key, label, type, placeholder, icon: Icon, autoComplete }, i) => {
              const isPassword = key === 'password';
              const val = key === 'username' ? username : key === 'email' ? email : password;
              return (
                <div key={key} style={{ animation: mounted ? `slideInRight 0.5s cubic-bezier(0.25,0.46,0.45,0.94) ${i * 80 + 80}ms both` : 'none' }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 7 }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <Icon style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', width: 17, height: 17, color: fe[key] ? '#EF4444' : 'var(--text3)', pointerEvents: 'none' }} />
                    <input
                      type={isPassword && showPw ? 'text' : type}
                      value={val}
                      onChange={e => change(key, e.target.value)}
                      onBlur={e => blur(key, e.target.value)}
                      placeholder={placeholder}
                      className={`input-field${fe[key] ? ' error' : ''}`}
                      style={{ paddingLeft: 44, ...(isPassword ? { paddingRight: 44 } : {}) }}
                      autoComplete={autoComplete}
                      required
                    />
                    {isPassword && (
                      <button type="button" onClick={() => setShowPw(!showPw)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', display: 'flex', padding: 0 }}>
                        {showPw ? <EyeOff style={{ width: 17, height: 17 }} /> : <Eye style={{ width: 17, height: 17 }} />}
                      </button>
                    )}
                  </div>
                  {fe[key] && <p style={{ color: '#EF4444', fontSize: 12, marginTop: 5 }}>{fe[key]}</p>}
                  {isPassword && <PasswordStrengthBar password={password} />}
                </div>
              );
            })}

            <div style={{ animation: mounted ? `slideInRight 0.5s cubic-bezier(0.25,0.46,0.45,0.94) 320ms both` : 'none', marginTop: 4 }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ width: '100%', height: 52, fontSize: 16, fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', letterSpacing: '-0.01em' }}>
                {loading ? <Loader2 style={{ width: 20, height: 20, animation: 'spin 1s linear infinite' }} /> : 'Create Account →'}
              </button>
            </div>
          </form>

          <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginTop: 14, lineHeight: 1.7 }}>
            By signing up you agree to our{' '}
            <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Terms</a>{' '}and{' '}
            <a href="#" style={{ color: 'var(--accent)', textDecoration: 'none' }}>Privacy Policy</a>.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '22px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
            <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border2)' }} />
          </div>

          <button type="button"
            style={{ width: '100%', height: 50, borderRadius: 12, border: '1.5px solid var(--border2)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 15, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'rgba(56,189,248,0.06)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          >
            <GoogleIcon /> Sign up with Google
          </button>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text2)', marginTop: 28 }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity:0; transform:translateX(40px); } to { opacity:1; transform:translateX(0); } }
        @keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}