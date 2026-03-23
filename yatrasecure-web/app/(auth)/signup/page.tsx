'use client';
import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, User, Loader2, AlertCircle, MapPin, CheckCircle } from 'lucide-react';
import { API_BASE_URL, setTokens } from '@/app/lib/api';

const SIGNUP_PHOTO = 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=1200&q=80';

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19.6 10.23c0-.82-.15-1.42-.4-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z" fill="#4285F4"/>
      <path d="M13.46 15.13c-.83.63-1.96 1.04-3.46 1.04-2.64 0-4.84-1.74-5.64-4.05H2.84v2.52C3.9 17.08 6.79 19 10 19c1.74 0 3.37-.29 4.6-.84l-1.14-2.03z" fill="#34A853"/>
      <path d="M10 3.88c1.88 0 2.87.96 3.54 1.78l2.58-2.58C13.37.98 11.74.2 10 .2 6.79.2 3.9 2.12 2.84 4.78h2.52c.8-2.31 3-4.05 5.64-4.05z" fill="#FBBC05"/>
      <path d="M10 10c-.5 0-.96-.19-1.32-.48l-2.5 1.98C6.3 12.66 7.95 14 10 14c1.5 0 2.63-.41 3.46-1.04l2.04-3.02c.35-.37.54-.87.54-1.46 0-.5-.19-.99-.48-1.35L10 10z" fill="#EA4335"/>
    </svg>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  const strength = !password ? 0 : password.length < 8 ? 1 : /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[@$!%*?&]/.test(password) ? 3 : 2;
  const colors = ['#888', '#EF4444', '#F59E0B', '#10B981'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];
  return (
    <>
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        {[0, 1, 2].map(i => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i < strength ? colors[strength] : '#333' }} />)}
      </div>
      {strength > 0 && <p style={{ fontSize: 12, color: colors[strength], marginTop: 6, fontWeight: 500 }}>{labels[strength]}</p>}
    </>
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
      const res = await fetch(`${API_BASE_URL}/auth/signup`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // ✅ SECURE: accept httpOnly cookie from server
        body:    JSON.stringify({ username: username.trim(), email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || 'Registration failed');
      const accessToken  = data.access_token;
      const expiresIn    = data.expires_in;
      if (accessToken) {
        setTokens(accessToken, Number(expiresIn));
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
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🗺️</div>
            <span style={{ fontSize: 18, fontWeight: 700, color: 'white', fontFamily: "'Space Grotesk', sans-serif" }}>YatraSecure</span>
          </Link>
        </div>

        <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', padding: '32px 40px', position: 'relative', zIndex: 3 }}>
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

        {[
          { emoji: '✈️', size: 28, top: '10%', left: '10%', dur: '20s', delay: '-5s',  rot: '25deg'  },
          { emoji: '🏔️', size: 32, top: '25%', left: '75%', dur: '15s', delay: '-8s',  rot: '-15deg' },
          { emoji: '🎒', size: 24, top: '60%', left: '5%', dur: '25s', delay: '-12s', rot: '35deg'  },
          { emoji: '🌴', size: 28, top: '65%', left: '80%', dur: '18s', delay: '-6s',  rot: '-8deg'  },
          { emoji: '🔭', size: 28, top: '50%', left: '85%', dur: '18s', delay: '-9s',  rot: '-10deg' },
          { emoji: '🏞️', size: 36, top: '70%', left: '60%', dur: '28s', delay: '-14s', rot: '12deg'  },
          { emoji: '🛕', size: 32, top: '80%', left: '20%', dur: '22s', delay: '-7s',  rot: '-22deg' },
          { emoji: '🌊', size: 38, top: '15%', left: '45%', dur: '26s', delay: '-3s',  rot: '8deg'   },
        ].map((e, i) => (
          <div key={i} style={{ position: 'absolute', fontSize: e.size, top: e.top, left: e.left, opacity: 0.4, animation: `float ${e.dur} infinite linear`, animationDelay: e.delay, transform: `rotate(${e.rot})` }}>
            {e.emoji}
          </div>
        ))}
      </div>

      {/* ══ RIGHT — FORM PANEL ══════════════════════════════════════════════ */}
      <div style={{ flex: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 40px', background: 'var(--bg)' }}>
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
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text2)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
                  <div style={{ position: 'relative' }}>
                    <Icon style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 18, height: 18, color: 'var(--text3)', pointerEvents: 'none' }} />
                    <input
                      type={isPassword && !showPw ? 'password' : 'text'}
                      placeholder={placeholder}
                      value={val}
                      onBlur={() => blur(key, val)}
                      onChange={(e) => change(key, e.target.value)}
                      autoComplete={autoComplete}
                      style={{ width: '100%', padding: '12px 12px 12px 40px', borderRadius: 10, border: `1.5px solid ${fe[key] ? '#EF4444' : 'var(--border)'}`, background: 'var(--input-bg)', color: 'var(--text)', fontSize: 14, fontFamily: "'Inter', sans-serif", transition: 'all 0.2s', outline: 'none' }}
                      onFocus={(e) => (e.currentTarget.style.borderColor = fe[key] ? '#EF4444' : 'var(--accent)')}
                      onBlur={(e) => (e.currentTarget.style.borderColor = fe[key] ? '#EF4444' : 'var(--border)')}
                    />
                    {isPassword && (
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 0 }}
                      >
                        {showPw ? <EyeOff style={{ width: 18, height: 18 }} /> : <Eye style={{ width: 18, height: 18 }} />}
                      </button>
                    )}
                  </div>
                  {fe[key] && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 6, fontWeight: 500 }}>{fe[key]}</p>}
                  {key === 'password' && <PasswordStrengthBar password={val} />}
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
            style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid var(--border)', background: 'var(--input-bg)', color: 'var(--text)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, fontSize: 14, fontWeight: 600, transition: 'all 0.2s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
          >
            <GoogleIcon />
            Sign up with Google
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
        @keyframes float { from { transform: translateY(0px) rotate(var(--rot, 0deg)); } to { transform: translateY(-20px) rotate(var(--rot, 0deg)); } }
      `}</style>
    </div>
  );
}