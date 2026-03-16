'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  ArrowLeft, MapPin, Calendar, Wallet,
  Users, FileText, Globe, Lock, Loader2, Plus,
  Copy, Check, KeyRound, X,
} from 'lucide-react';
import { API_BASE_URL, getAccessToken } from '@/app/lib/api';

const TRIP_TYPES = [
  { value: 'group',      label: 'Group',      emoji: '👥' },
  { value: 'solo',       label: 'Solo',       emoji: '🧍' },
  { value: 'family',     label: 'Family',     emoji: '👨‍👩‍👧' },
  { value: 'adventure',  label: 'Adventure',  emoji: '🏔️' },
  { value: 'pilgrimage', label: 'Pilgrimage', emoji: '🛕' },
  { value: 'business',   label: 'Business',   emoji: '💼' },
];

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

export default function CreateTripPage() {
  const router = useRouter();

  const [name,        setName]        = useState('');
  const [fromCity,    setFromCity]    = useState('');
  const [toCity,      setToCity]      = useState('');
  const [startDate,   setStartDate]   = useState('');
  const [endDate,     setEndDate]     = useState('');
  const [budget,      setBudget]      = useState('');
  const [tripType,    setTripType]    = useState('group');
  const [description, setDescription] = useState('');
  const [isPublic,    setIsPublic]    = useState(true);
  const [loading,     setLoading]     = useState(false);
  const [errors,      setErrors]      = useState<Record<string, string>>({});
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // ── Invite Code Modal State ──
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [createdTripId, setCreatedTripId] = useState('');
  const [createdInviteCode, setCreatedInviteCode] = useState('');
  const [createdTripName, setCreatedTripName] = useState('');
  const [copied, setCopied] = useState(false);

  // ── Validation ──
  function validate() {
    const e: Record<string, string> = {};
    if (!name.trim())                          e.name       = 'Trip name is required';
    else if (name.trim().length < 3)           e.name       = 'Minimum 3 characters';
    if (!fromCity.trim())                      e.fromCity   = 'Departure city is required';
    if (!toCity.trim())                        e.toCity     = 'Destination city is required';
    if (fromCity.trim().toLowerCase() === toCity.trim().toLowerCase())
                                               e.toCity     = 'Destination must differ from departure';
    if (!startDate)                            e.startDate  = 'Start date is required';
    if (!endDate)                              e.endDate    = 'End date is required';
    if (startDate && endDate && endDate < startDate)
                                               e.endDate    = 'End date must be after start date';
    if (!budget)                               e.budget     = 'Budget is required';
    else if (isNaN(Number(budget)) || Number(budget) <= 0)
                                               e.budget     = 'Enter a valid positive amount';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ── Submit ──
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const token = getAccessToken();
      if (!token) { router.replace('/login'); return; }

      const res = await fetch(`${API_BASE_URL}/trips`, {
        method: 'POST',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name:        name.trim(),
          fromCity:    fromCity.trim(),
          toCity:      toCity.trim(),
          startDate:   new Date(startDate).toISOString(),
          endDate:     new Date(endDate).toISOString(),
          budget:      Number(budget),
          tripType,
          description: description.trim() || undefined,
          isPublic:    Boolean(isPublic),
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 400 && Array.isArray(data.message)) {
          const be: Record<string, string> = {};
          (data.message as string[]).forEach((msg) => {
            if (msg.toLowerCase().includes('name'))        be.name      = msg;
            else if (msg.toLowerCase().includes('from'))   be.fromCity  = msg;
            else if (msg.toLowerCase().includes('to'))     be.toCity    = msg;
            else if (msg.toLowerCase().includes('start'))  be.startDate = msg;
            else if (msg.toLowerCase().includes('end'))    be.endDate   = msg;
            else if (msg.toLowerCase().includes('budget')) be.budget    = msg;
          });
          setErrors(be);
          toast.error('Please fix the errors');
        } else {
          toast.error(data.message || 'Failed to create trip');
        }
        return;
      }

      toast.success(`Trip "${data.name}" created!`);

      // If private trip → show invite code modal
      if (!isPublic && data.inviteCode) {
        setCreatedTripId(data.id);
        setCreatedInviteCode(data.inviteCode);
        setCreatedTripName(data.name);
        setShowInviteModal(true);
      } else {
        router.push(`/trips?tab=mine`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(createdInviteCode);
    setCopied(true);
    toast.success('Invite code copied!');
    setTimeout(() => setCopied(false), 2000);
  }

  function handleShareWhatsApp() {
    const msg = encodeURIComponent(
      `🚀 *Join my private trip "${createdTripName}" on YatraSecure!*\n\n` +
      `🔑 Invite Code: *${createdInviteCode}*\n\n` +
      `Go to Dashboard → "Join Private Trip" → Enter this code\n\n` +
      `_Sent via YatraSecure_`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank');
  }

  // ── Duration preview ──
  const durationDays =
    startDate && endDate
      ? Math.ceil(
          (new Date(endDate).getTime() - new Date(startDate).getTime()) /
            86400000,
        )
      : null;

  // ── Styles — NO shorthand border mixing ──
  function getBorderColor(field: string): string {
    if (focusedField === field) return 'rgba(249,115,22,0.5)';
    if (errors[field]) return '#EF4444';
    return 'rgba(255,255,255,0.08)';
  }

  function inp(field: string): React.CSSProperties {
    return {
      width: '100%', height: 44, padding: '0 14px',
      borderRadius: 10, fontSize: 14, color: 'white',
      background: 'rgba(255,255,255,0.02)',
      borderWidth: 1, borderStyle: 'solid',
      borderColor: getBorderColor(field),
      outline: 'none', transition: 'border-color 0.15s',
    };
  }

  return (
    <div className="anim-in" style={{ maxWidth: 640, margin: '0 auto' }}>

      {/* ══ INVITE CODE MODAL ══ */}
      {showInviteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: 20,
        }}>
          <div style={{
            width: '100%', maxWidth: 440, borderRadius: 20, padding: 32,
            background: '#080b12',
            borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.08)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
            textAlign: 'center', position: 'relative',
          }}>
            {/* Close */}
            <button
              onClick={() => { setShowInviteModal(false); router.push(`/trips?tab=mine`); }}
              style={{
                position: 'absolute', top: 14, right: 14,
                background: 'none', borderWidth: 0, borderStyle: 'none', borderColor: 'transparent',
                cursor: 'pointer', padding: 4,
              }}
            >
              <X style={{ width: 18, height: 18, color: '#64748b' }} />
            </button>

            {/* Icon */}
            <div style={{
              width: 60, height: 60, borderRadius: 16, margin: '0 auto 16px',
              background: 'rgba(249,115,22,0.1)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(249,115,22,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <KeyRound style={{ width: 28, height: 28, color: '#f97316' }} />
            </div>

            <h2 style={{ fontSize: 20, fontWeight: 800, color: 'white', marginBottom: 6 }}>
              Private Trip Created! 🎉
            </h2>
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20 }}>
              Share this invite code with your friends so they can join <b style={{ color: '#a78bfa' }}>{createdTripName}</b>
            </p>

            <div style={{
              padding: '16px 20px', borderRadius: 14, marginBottom: 16,
              background: 'rgba(255,255,255,0.02)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(255,255,255,0.1)',
            }}>
              <p style={{ fontSize: 10, color: '#94A3B8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700 }}>
                Invite Code
              </p>
              <p style={{
                fontSize: 32, fontWeight: 900, color: 'white',
                letterSpacing: '0.2em', fontFamily: 'monospace', margin: 0,
              }}>
                {createdInviteCode}
              </p>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <button
                onClick={handleCopyCode}
                style={{
                  flex: 1, height: 44, borderRadius: 10,
                  background: copied ? 'rgba(34,197,94,0.15)' : 'rgba(124,58,237,0.15)',
                  borderWidth: 1, borderStyle: 'solid',
                  borderColor: copied ? 'rgba(34,197,94,0.3)' : 'rgba(124,58,237,0.3)',
                  color: copied ? '#22c55e' : '#a78bfa',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.2s',
                }}
              >
                {copied ? <Check style={{ width: 14, height: 14 }} /> : <Copy style={{ width: 14, height: 14 }} />}
                {copied ? 'Copied!' : 'Copy Code'}
              </button>
              <button
                onClick={handleShareWhatsApp}
                style={{
                  flex: 1, height: 44, borderRadius: 10,
                  background: 'rgba(34,197,94,0.15)',
                  borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(34,197,94,0.3)',
                  color: '#22c55e', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                }}
              >
                📱 Share on WhatsApp
              </button>
            </div>

            {/* Go to trip */}
            <button
              onClick={() => { setShowInviteModal(false); router.push(`/trips?tab=mine`); }}
              style={{
                width: '100%', height: 46, borderRadius: 10,
                background: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
                borderWidth: 0, borderStyle: 'none', borderColor: 'transparent',
                color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(124,58,237,0.35)',
              }}
            >
              Go to Trip →
            </button>

            <p style={{ fontSize: 11, color: '#334155', marginTop: 10 }}>
              💡 You can also find this code on the trip detail page
            </p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28 }}>
        <button
          onClick={() => router.back()}
          style={{
            width: 38, height: 38, borderRadius: 10,
            background: 'rgba(148,163,184,0.06)',
            borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(148,163,184,0.1)',
            cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >
          <ArrowLeft style={{ width: 16, height: 16, color: '#94A3B8' }} />
        </button>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#F1F5F9', margin: 0 }}>
            Create New Trip
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            Plan your next adventure
          </p>
        </div>
      </div>

      {/* ── Form ── */}
      <form onSubmit={handleSubmit}>
        <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 24, background: 'rgba(255,255,255,0.02)', borderRadius: 20, border: '1px solid rgba(255,255,255,0.04)' }}>

          {/* Trip Name */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
              Trip Name <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              style={inp('name')}
              placeholder="e.g., Goa Beach Trip"
              value={name}
              onChange={e => { setName(e.target.value); setErrors(p => ({ ...p, name: '' })); }}
              maxLength={100}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
              {errors.name && <p style={{ fontSize: 12, color: '#EF4444' }}>{errors.name}</p>}
              <p style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>{name.length}/100</p>
            </div>
          </div>

          {/* From → To */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                <MapPin style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                From City <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                style={inp('fromCity')}
                placeholder="Delhi"
                value={fromCity}
                onChange={e => { setFromCity(e.target.value); setErrors(p => ({ ...p, fromCity: '' })); }}
                onFocus={() => setFocusedField('fromCity')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.fromCity && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.fromCity}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                <MapPin style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                To City <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                style={inp('toCity')}
                placeholder="Goa"
                value={toCity}
                onChange={e => { setToCity(e.target.value); setErrors(p => ({ ...p, toCity: '' })); }}
                onFocus={() => setFocusedField('toCity')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.toCity && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.toCity}</p>}
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                <Calendar style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                Start Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="date"
                style={{ ...inp('startDate'), colorScheme: 'dark' }}
                min={getTodayStr()}
                value={startDate}
                onChange={e => { setStartDate(e.target.value); setErrors(p => ({ ...p, startDate: '' })); }}
                onFocus={() => setFocusedField('startDate')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.startDate && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.startDate}</p>}
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
                <Calendar style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
                End Date <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <input
                type="date"
                style={{ ...inp('endDate'), colorScheme: 'dark' }}
                min={startDate || getTodayStr()}
                value={endDate}
                onChange={e => { setEndDate(e.target.value); setErrors(p => ({ ...p, endDate: '' })); }}
                onFocus={() => setFocusedField('endDate')}
                onBlur={() => setFocusedField(null)}
              />
              {errors.endDate && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.endDate}</p>}
            </div>
          </div>

          {/* Duration preview */}
          {durationDays !== null && durationDays > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
              borderRadius: 10, background: 'rgba(124,58,237,0.06)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(124,58,237,0.15)',
            }}>
              <Calendar style={{ width: 14, height: 14, color: '#A78BFA' }} />
              <p style={{ fontSize: 13, color: '#A78BFA', fontWeight: 600 }}>
                {durationDays} day{durationDays !== 1 ? 's' : ''} trip
              </p>
            </div>
          )}

          {/* Budget */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
              <Wallet style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
              Total Budget (₹) <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                fontSize: 15, color: '#64748B', pointerEvents: 'none',
              }}>₹</span>
              <input
                type="number"
                style={{ ...inp('budget'), paddingLeft: 28 }}
                placeholder="50000"
                min="1"
                value={budget}
                onChange={e => { setBudget(e.target.value); setErrors(p => ({ ...p, budget: '' })); }}
                onFocus={() => setFocusedField('budget')}
                onBlur={() => setFocusedField(null)}
              />
            </div>
            {errors.budget && <p style={{ fontSize: 12, color: '#EF4444', marginTop: 4 }}>{errors.budget}</p>}
            {budget && Number(budget) > 0 && !errors.budget && (
              <p style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>
                ₹{Number(budget).toLocaleString('en-IN')}
              </p>
            )}
          </div>

          {/* Trip Type */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>
              <Users style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
              Trip Type
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {TRIP_TYPES.map(t => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setTripType(t.value)}
                  style={{
                    padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.15s',
                    background: tripType === t.value ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.05)',
                    borderWidth: 1, borderStyle: 'solid',
                    borderColor: tripType === t.value ? 'transparent' : 'rgba(255,255,255,0.05)',
                    color: tripType === t.value ? 'black' : '#94A3B8',
                  }}
                >
                  {t.emoji} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 8 }}>
              Visibility
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { val: true,  icon: Globe, label: 'Public',  sub: 'Anyone can find & join', color: '#60A5FA' },
                { val: false, icon: Lock,  label: 'Private', sub: 'Invite code only',        color: '#FBBF24' },
              ].map(opt => (
                <button
                  key={String(opt.val)}
                  type="button"
                  onClick={() => setIsPublic(opt.val)}
                  style={{
                    flex: 1, padding: '12px 16px', borderRadius: 12, cursor: 'pointer',
                    transition: 'all 0.15s', textAlign: 'left',
                    background: isPublic === opt.val ? `rgba(${opt.val ? '96,165,250' : '251,191,36'},0.1)` : 'rgba(255,255,255,0.02)',
                    borderWidth: 1, borderStyle: 'solid',
                    borderColor: isPublic === opt.val ? (opt.val ? 'rgba(96,165,250,0.3)' : 'rgba(251,191,36,0.3)') : 'rgba(255,255,255,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <opt.icon style={{ width: 14, height: 14, color: isPublic === opt.val ? opt.color : '#64748B' }} />
                    <span style={{ fontSize: 13, fontWeight: 700, color: isPublic === opt.val ? opt.color : '#94A3B8' }}>
                      {opt.label}
                    </span>
                    {isPublic === opt.val && (
                      <span style={{
                        marginLeft: 'auto', width: 16, height: 16, borderRadius: '50%',
                        background: opt.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <svg viewBox="0 0 12 12" fill="none" style={{ width: 9, height: 9 }}>
                          <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 11, color: '#475569' }}>{opt.sub}</p>
                </button>
              ))}
            </div>

            {/* Private trip info hint */}
            {!isPublic && (
              <div style={{
                marginTop: 10, padding: '10px 14px', borderRadius: 10,
                background: 'rgba(251,191,36,0.06)',
                borderWidth: 1, borderStyle: 'solid', borderColor: 'rgba(251,191,36,0.15)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <KeyRound style={{ width: 14, height: 14, color: '#FBBF24', flexShrink: 0 }} />
                <p style={{ fontSize: 12, color: '#FBBF24', margin: 0 }}>
                  A unique invite code will be generated. Share it with friends to let them join!
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 6 }}>
              <FileText style={{ width: 12, height: 12, display: 'inline', marginRight: 4 }} />
              Description
              <span style={{ color: '#475569', fontWeight: 400, marginLeft: 6 }}>(optional)</span>
            </label>
            <textarea
              style={{
                width: '100%', height: 96, padding: '12px 14px',
                borderRadius: 10, fontSize: 14, color: 'white',
                background: 'rgba(255,255,255,0.02)',
                borderWidth: 1, borderStyle: 'solid',
                borderColor: focusedField === '_desc' ? 'rgba(249,115,22,0.5)' : 'rgba(255,255,255,0.08)',
                outline: 'none', transition: 'border-color 0.15s',
                resize: 'none', lineHeight: 1.6,
              }}
              placeholder="Tell others about your trip plans..."
              value={description}
              maxLength={500}
              onChange={e => setDescription(e.target.value)}
              onFocus={() => setFocusedField('_desc')}
              onBlur={() => setFocusedField(null)}
            />
            <p style={{ fontSize: 11, color: '#475569', textAlign: 'right', marginTop: 4 }}>
              {description.length}/500
            </p>
          </div>
        </div>

        {/* ── Action Buttons ── */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{
              padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              color: '#94A3B8', background: 'rgba(255,255,255,0.05)',
              borderWidth: 1, borderStyle: 'solid', borderColor: 'transparent',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
            className="hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              flex: 1, height: 48, borderRadius: 10, fontSize: 15, fontWeight: 700,
              color: 'black',
              borderWidth: 0, borderStyle: 'none', borderColor: 'transparent',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.15s',
            }}
          >
            {loading
              ? <><Loader2 style={{ width: 18, height: 18, animation: 'spin 1s linear infinite' }} /> Creating...</>
              : <><Plus style={{ width: 18, height: 18 }} /> Create Trip</>
            }
          </button>
        </div>
      </form>
    </div>
  );
}