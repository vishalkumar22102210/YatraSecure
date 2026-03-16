'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import toast from 'react-hot-toast';
import {
  Calendar, MapPin, Users, Wallet, CheckSquare, Settings, AlertCircle, Bot, Compass, ShoppingBag, Plane, Building,
  ArrowRight, Heart, Share2, Plus, Clock, MessageSquare, Shield, Image as ImageIcon,
  Link as LinkIcon, Edit2, Trash2, X, ChevronRight, Download, Send, UserPlus, CheckCircle, XCircle,
  ArrowLeft, Eye, EyeOff, MessageCircle, Pencil, Loader2, LogOut, Sparkles, Save, Radar
} from 'lucide-react';
import { API_BASE_URL, getAccessToken } from '@/app/lib/api';

// Dynamic import for map (SSR fix)
const ItineraryMapWrapper = dynamic(
  () => import('@/components/ItineraryMapWrapper'),
  { ssr: false, loading: () => <div style={{ height: 200, background: 'rgba(15,23,42,0.7)', borderRadius: 14 }} /> }
);
const LiveTripMapWrapper = dynamic(
  () => import('@/components/LiveTripMapWrapper'),
  { ssr: false }
);
import PendingSettlements from '@/components/PendingSettlements';
import FollowButton from '@/components/FollowButton';

// ─── Types ────────────────────────────────────────────────────────────────────
type ItinerarySlot  = { activity: string; place: string; tip: string; cost: number };
type ItineraryDay   = {
  day: number; date: string; title: string;
  morning: ItinerarySlot; afternoon: ItinerarySlot; evening: ItinerarySlot;
  meals: { breakfast: string; lunch: string; dinner: string };
  transport: string; safety_tip: string; estimated_daily_cost: number;
};
type ItineraryData  = {
  summary: string;
  totalBudgetBreakdown: Record<string, number>;
  days: ItineraryDay[];
  general_tips: string[];
  emergency_contacts: Record<string, string>;
};

const defaultSlot: ItinerarySlot = { activity: '–', place: '', tip: '', cost: 0 };
const periodMeta: Record<string, { icon: string; color: string }> = {
  morning:   { icon: '🌅', color: '#fbbf24' },
  afternoon: { icon: '☀️', color: '#fb923c' },
  evening:   { icon: '🌙', color: '#818cf8' },
};

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

// ─── Component ────────────────────────────────────────────────────────────────
export default function TripDetailPage() {
  const router  = useRouter();
  const params  = useParams();
  const tripId  = params.id as string;

  // core
  const [trip,        setTrip]        = useState<any>(null);
  const [members,     setMembers]     = useState<any[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [joinMsg,     setJoinMsg]     = useState('');
  const [joining,     setJoining]     = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [leaving,     setLeaving]     = useState(false);
  const [joinRequests,setJoinRequests]= useState<any[]>([]);

  // itinerary
  const [itinerary,        setItinerary]        = useState('');
  const [itineraryData,    setItineraryData]    = useState<ItineraryData | null>(null);
  const [generatingAI,     setGeneratingAI]     = useState(false);
  const [savingItinerary,  setSavingItinerary]  = useState(false);
  const [editingItinerary, setEditingItinerary] = useState(false);
  const [editedItinerary,  setEditedItinerary]  = useState('');
  const [itineraryError,   setItineraryError]   = useState('');
  const [customPrompt,     setCustomPrompt]     = useState('');
  const [showPromptBox,    setShowPromptBox]    = useState(false);
  const [showItinerary,    setShowItinerary]    = useState(false);

  // crewai booking agents
  const [generatingBookings, setGeneratingBookings] = useState(false);
  const [bookingPackage,     setBookingPackage]     = useState<any>(null);
  const [bookingPrompt,      setBookingPrompt]      = useState('');
  const [bookingAnswers,     setBookingAnswers]     = useState<any>({ flightPref: 'Budget', flexDates: 'No' });
  const [bookingError,       setBookingError]       = useState('');

  // countdown
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  // hydration guard
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const s = localStorage.getItem('user');
    if (s) setCurrentUser(JSON.parse(s));
    loadTrip();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId]);

  useEffect(() => {
    if (!trip?.startDate) return;
    const target = new Date(trip.startDate).getTime();
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const diff = target - now;
      
      if (diff <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
      } else {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          mins: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          secs: Math.floor((diff % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [trip?.startDate]);

  // ── Parse itinerary safely ─────────────────────────────────────────────────
  function parseItinerary(raw: string) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.days) {
        const safe: ItineraryData = {
          summary:              parsed.summary || 'Trip itinerary',
          totalBudgetBreakdown: (parsed.totalBudgetBreakdown && typeof parsed.totalBudgetBreakdown === 'object') ? parsed.totalBudgetBreakdown : {},
          days: (Array.isArray(parsed.days) ? parsed.days : []).map((d: any) => ({
            day:      d.day  || 0,
            date:     d.date || '',
            title:    d.title || `Day ${d.day}`,
            morning:   (d.morning   && typeof d.morning   === 'object') ? d.morning   : defaultSlot,
            afternoon: (d.afternoon && typeof d.afternoon === 'object') ? d.afternoon : defaultSlot,
            evening:   (d.evening   && typeof d.evening   === 'object') ? d.evening   : defaultSlot,
            meals: (d.meals && typeof d.meals === 'object') ? d.meals : { breakfast: '–', lunch: '–', dinner: '–' },
            transport:            d.transport   || '–',
            safety_tip:           d.safety_tip  || '–',
            estimated_daily_cost: d.estimated_daily_cost || 0,
          })),
          general_tips:       Array.isArray(parsed.general_tips) ? parsed.general_tips : [],
          emergency_contacts: (parsed.emergency_contacts && typeof parsed.emergency_contacts === 'object') ? parsed.emergency_contacts : {},
        };
        setItineraryData(safe);
      } else {
        setItineraryData(null);
      }
    } catch {
      setItineraryData(null);
    }
  }

  // ── Load Trip ──────────────────────────────────────────────────────────────
  async function loadTrip() {
    setLoading(true);
    try {
      const token   = getAccessToken();
      const headers: any = {};
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, { headers });
      if (!res.ok) throw new Error('Trip not found');
      const data = await res.json();
      setTrip(data);

      // Load saved itinerary from DB
      if (data.itinerary) {
        setItinerary(data.itinerary);
        parseItinerary(data.itinerary);
      }

      try {
        const mRes = await fetch(`${API_BASE_URL}/trips/${tripId}/members`, { headers });
        if (mRes.ok) setMembers(await mRes.json());
      } catch { /* ignore */ }

      if (token) {
        try {
          const jRes = await fetch(`${API_BASE_URL}/trips/${tripId}/join-requests`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (jRes.ok) setJoinRequests(await jRes.json());
        } catch { /* ignore */ }
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to load trip');
      router.push('/trips');
    } finally {
      setLoading(false);
    }
  }

  // ── Generate Itinerary ─────────────────────────────────────────────────────
  async function handleGenerateItinerary() {
    setGeneratingAI(true);
    setItineraryError('');
    setShowPromptBox(false);
    try {
      const token = getAccessToken();
      const res   = await fetch(`${API_BASE_URL}/trips/${tripId}/itinerary/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ customPrompt: customPrompt.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Generation failed');
      setItinerary(data.itinerary);
      parseItinerary(data.itinerary);
      setTrip((p: any) => p ? { ...p, itinerary: data.itinerary } : p);
      setCustomPrompt('');
      toast.success('Itinerary generated & saved!');
    } catch (e: any) {
      setItineraryError(e.message || 'Failed to generate itinerary');
      toast.error(e.message || 'Failed to generate itinerary');
    } finally {
      setGeneratingAI(false);
    }
  }

  // ── Save Edited Itinerary to DB ────────────────────────────────────────────
  async function handleSaveItinerary() {
    setSavingItinerary(true);
    setItineraryError('');
    try {
      const token = getAccessToken();
      const res   = await fetch(`${API_BASE_URL}/trips/${tripId}/itinerary`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ itinerary: editedItinerary }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Save failed');
      setItinerary(editedItinerary);
      parseItinerary(editedItinerary);
      setTrip((p: any) => p ? { ...p, itinerary: editedItinerary } : p);
      setEditingItinerary(false);
      toast.success('Itinerary saved to DB!');
    } catch (e: any) {
      setItineraryError(e.message || 'Failed to save');
      toast.error(e.message || 'Failed to save');
    } finally {
      setSavingItinerary(false);
    }
  }

  // ── Call CrewAI Booking Agents ──────────────────────────────────────────────
  async function handleRunBookingAgents() {
    setGeneratingBookings(true);
    setBookingError('');
    try {
      const res = await fetch(`/api/trips/${tripId}/booking-agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          customPrompt: bookingPrompt,
          answers: bookingAnswers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Booking generation failed');
      setBookingPackage(data.package);
      toast.success('AI Booking Deals generated!');
    } catch (e: any) {
      setBookingError(e.message || 'Failed to generate bookings');
      toast.error(e.message || 'Failed to generate bookings');
    } finally {
      setGeneratingBookings(false);
    }
  }

  // ── Trip actions ───────────────────────────────────────────────────────────
  async function handleJoin() {
    setJoining(true);
    try {
      const token = getAccessToken();
      if (!token) { router.push('/login'); return; }
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}/join-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: joinMsg || undefined }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.message || 'Failed'); }
      toast.success('Join request sent!');
      setJoinMsg('');
      loadTrip();
    } catch (e: any) { toast.error(e.message); }
    finally { setJoining(false); }
  }

  async function handleLeave() {
    if (!confirm('Are you sure you want to leave this trip?')) return;
    setLeaving(true);
    try {
      const token = getAccessToken();
      const res   = await fetch(`${API_BASE_URL}/trips/${tripId}/members/leave`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to leave');
      toast.success('Left the trip');
      loadTrip();
    } catch (e: any) { toast.error(e.message); }
    finally { setLeaving(false); }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to DELETE this trip? This cannot be undone.')) return;
    setDeleting(true);
    try {
      const token = getAccessToken();
      const res   = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      toast.success('Trip deleted');
      router.push('/trips');
    } catch (e: any) { toast.error(e.message); }
    finally { setDeleting(false); }
  }

  async function handleRequest(requestId: string, status: 'accepted' | 'rejected') {
    try {
      const token = getAccessToken();
      const res   = await fetch(`${API_BASE_URL}/trips/${tripId}/join-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed');
      toast.success(status === 'accepted' ? 'Member approved!' : 'Request rejected');
      loadTrip();
    } catch (e: any) { toast.error(e.message); }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm('Remove this member?')) return;
    try {
      const token = getAccessToken();
      const res   = await fetch(`${API_BASE_URL}/trips/${tripId}/members/${userId}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed');
      toast.success('Member removed');
      loadTrip();
    } catch (e: any) { toast.error(e.message); }
  }

  // ── Derived ────────────────────────────────────────────────────────────────
  const isAdmin = !!currentUser && !!trip &&
    (trip.adminId === currentUser.id || trip.admin?.id === currentUser.id);
  const isMember = !!currentUser && members.some(
    (m: any) => m.userId === currentUser.id || m.user?.id === currentUser.id,
  );
  const hasPendingRequest = !!currentUser && joinRequests.some(
    (r: any) => r.userId === currentUser.id && r.status === 'pending',
  );

  // ── Loading ────────────────────────────────────────────────────────────────
  if (!mounted || loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 36, height: 36, border: '3px solid #1E293B', borderTopColor: '#7C3AED', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 12 }}>Loading trip...</p>
      </div>
    </div>
  );

  if (!trip) return (
    <div style={{ textAlign: 'center', padding: '80px 0' }}>
      <p style={{ color: '#EF4444' }}>Trip not found</p>
    </div>
  );

  const startDate = new Date(trip.startDate);
  const endDate   = new Date(trip.endDate);
  const days      = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  const isUpcoming = startDate > new Date();
  const isOngoing  = startDate <= new Date() && endDate >= new Date();

  return (
    <div className="anim-in">

      {/* Back */}
      <button onClick={() => router.push('/trips')}
        style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 20, padding: 0 }}>
        <ArrowLeft style={{ width: 16, height: 16 }} /> Back to Trips
      </button>

      {/* ══ HERO BANNER ═══════════════════════════════════════════════════════ */}
      <div style={{ position: 'relative', width: '100%', height: 260, borderRadius: 24, overflow: 'hidden', marginBottom: 32, boxSizing: 'border-box' }}>
        <img 
          src={trip.coverImage || `https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=1470`} 
          alt="Trip Cover" 
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }} 
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(6,9,14,0.9), transparent)', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 24 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                 <span style={badge('#F97316', 'rgba(249,115,22,0.1)')}>{trip.tripType?.toUpperCase()}</span>
                 {isUpcoming && <span style={badge('#22C55E', 'rgba(34,197,94,0.1)')}>UPCOMING</span>}
              </div>
              <h1 style={{ fontSize: 42, fontWeight: 900, color: 'white', letterSpacing: '-0.04em', margin: '0 0 8px' }}>{trip.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, color: '#94A3B8', fontSize: 14 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin style={{ width: 14, height: 14 }} /> {trip.toCity}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Calendar style={{ width: 14, height: 14 }} /> {new Date(trip.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} - {new Date(trip.endDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Users style={{ width: 14, height: 14 }} /> {members.length} Members</span>
              </div>
            </div>

            {/* Countdown Widget */}
            {isUpcoming && (
              <div style={{ display: 'flex', gap: 8 }}>
                {[
                  { label: 'days', val: timeLeft.days },
                  { label: 'hours', val: timeLeft.hours },
                  { label: 'mins', val: timeLeft.mins },
                  { label: 'secs', val: timeLeft.secs },
                ].map(item => (
                  <div key={item.label} style={{ width: 68, height: 72, background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 22, fontWeight: 900, color: 'white', lineHeight: 1 }}>{String(item.val).padStart(2, '0')}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginTop: 4 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Floating Action Buttons */}
        <div style={{ position: 'absolute', top: 24, right: 24, display: 'flex', gap: 8 }}>
           <button style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }} className="hover:bg-white/10">
              <Share2 style={{ width: 18, height: 18 }} />
           </button>
           {isAdmin && (
             <Link href={`/trips/${tripId}/edit`} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }} className="hover:bg-white/10">
                <Edit2 style={{ width: 18, height: 18 }} />
             </Link>
           )}
        </div>
      </div>

      {/* ══ QUICK ACTIONS BAR ═════════════════════════════════════════════════ */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        {isMember && (
          <>
            <Link href={`/trips/${tripId}/chat`} style={btn('#3b82f6')}>
              <MessageSquare style={{ width: 16, height: 16 }} /> Group Chat
            </Link>
            <Link href={`/trips/${tripId}/wallet`} style={btn('#10b981')}>
              <Wallet style={{ width: 16, height: 16 }} /> Trip Wallet
            </Link>
            <Link href={`/trips/${tripId}/checklist`} style={btn('#f59e0b')}>
              <CheckSquare style={{ width: 16, height: 16 }} /> Packing List
            </Link>
            <Link href={`/trips/${tripId}/assistant`} style={btn('#f97316')}>
              <Bot style={{ width: 16, height: 16 }} /> AI Assistant
            </Link>
            <Link href={`/trips/${tripId}/album`} style={btn('#ec4899')}>
              <ImageIcon style={{ width: 16, height: 16 }} /> Trip Album
            </Link>
            <Link href={`/trips/${tripId}/memory`} style={btn('linear-gradient(135deg, #7c3aed, #3b82f6)')}>
              <Sparkles style={{ width: 16, height: 16 }} /> Memory Lane
            </Link>
          </>
        )}
        <div style={{ flex: 1 }} />
        {isAdmin && (
          <button onClick={handleDelete} disabled={deleting} style={btn('rgba(239,68,68,0.1)', '#EF4444')}>
            {deleting ? <Loader2 style={{ width: 14, height: 14, animation: 'spin 0.8s linear infinite' }} /> : <Trash2 style={{ width: 14, height: 14 }} />}
            Delete Trip
          </button>
        )}
      </div>

      {/* ══ LIVE RADAR + SETTLEMENTS ══════════════════════════════════════════ */}
      {isMember && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, marginBottom: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
               <Radar className="anim-pulse" style={{ width: 20, height: 20, color: '#f97316' }} />
               <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: 0 }}>Live Traveler Radar</h3>
               <span style={{ fontSize: 11, fontWeight: 700, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 20 }}>REAL-TIME</span>
            </div>
            <LiveTripMapWrapper tripId={tripId} toCity={trip.toCity} members={members} />
          </div>
          <div style={{ paddingTop: 36 }}>
            <PendingSettlements tripId={tripId} />
          </div>
        </div>
      )}

      {/* ══ INFO CARDS ════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: MapPin,    color: '#7C3AED', bg: 'rgba(124,58,237,0.1)',   label: 'Route',    value: `${trip.fromCity} → ${trip.toCity}` },
          { icon: Calendar,  color: '#06B6D4', bg: 'rgba(6,182,212,0.1)',   label: 'Duration', value: `${days} ${days === 1 ? 'day' : 'days'}` },
          { icon: Wallet,    color: '#10B981', bg: 'rgba(16,185,129,0.1)',  label: 'Budget',   value: `₹${trip.budget?.toLocaleString('en-IN')}` },
          { icon: Users,     color: '#F97316', bg: 'rgba(249,115,22,0.1)', label: 'Members',  value: `${members.length}` },
        ].map(({ icon: Icon, color, bg, label, value }) => (
          <div key={label} style={{...card, padding: 20}}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: bg, border: `1px solid ${bg.replace(',0.1)', ',0.2)')}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon style={{ width: 22, height: 22, color }} />
              </div>
              <div>
                <p style={{ fontSize: 12, color: '#94A3B8', margin: 0, fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: 16, fontWeight: 700, color: 'white', margin: 0 }}>{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ══ DESCRIPTION ══════════════════════════════════════════════════════ */}
      <div style={{ ...card, marginBottom: 24 }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 12 }}>Trip Details</h3>
        <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.7, whiteSpace: 'pre-wrap', margin: 0 }}>
          {trip.description || 'No description provided for this trip.'}
        </p>
      </div>

      {/* ══ ITINERARY SECTION ════════════════════════════════════════════════ */}
      <div style={{ ...card, marginBottom: 24 }}>
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: '#E2E8F0', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles style={{ width: 16, height: 16, color: '#f97316' }} />
            AI Itinerary
            {itinerary && <span style={{ fontSize: 11, color: '#22c55e', background: 'rgba(34,197,94,0.1)', padding: '2px 8px', borderRadius: 20, marginLeft: 4 }}>✓ Saved</span>}
          </h3>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {itinerary && (
              <button
                onClick={() => setShowItinerary(p => !p)}
                style={{ ...btn('rgba(30,41,59,0.8)', '#94a3b8'), padding: '7px 14px', fontSize: 12, border: '1px solid #334155' }}
              >
                {showItinerary ? 'Hide' : 'View'} Itinerary
              </button>
            )}

            {isAdmin && itinerary && !editingItinerary && (
              <button
                onClick={() => { setEditedItinerary(itinerary); setEditingItinerary(true); }}
                style={{ ...btn('rgba(124,58,237,0.15)', '#a78bfa'), padding: '7px 14px', fontSize: 12, border: '1px solid rgba(124,58,237,0.3)' }}
              >
                <Pencil style={{ width: 12, height: 12 }} /> Edit Raw
              </button>
            )}

            {isAdmin && (
              <>
                <button
                  onClick={() => setShowPromptBox(p => !p)}
                  style={{ ...btn(showPromptBox ? 'rgba(34,197,94,0.15)' : 'rgba(30,41,59,0.8)', showPromptBox ? '#4ade80' : '#64748b'), padding: '7px 14px', fontSize: 12, border: `1px solid ${showPromptBox ? 'rgba(34,197,94,0.3)' : '#334155'}` }}
                >
                  ✏️ Instructions
                </button>

                <button
                  onClick={handleGenerateItinerary}
                  disabled={generatingAI}
                  style={{ ...btn(generatingAI ? '#1e293b' : 'rgba(249,115,22,0.15)', generatingAI ? '#475569' : '#fb923c'), padding: '7px 16px', fontSize: 12, border: '1px solid rgba(249,115,22,0.3)' }}
                >
                  {generatingAI
                    ? <><Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> Generating…</>
                    : <><Sparkles style={{ width: 13, height: 13 }} /> {itinerary ? 'Regenerate' : 'Generate with AI'}</>
                  }
                </button>
              </>
            )}
          </div>
        </div>

        {/* Custom Prompt Box */}
        {isAdmin && showPromptBox && (
          <div style={{ marginBottom: 16, padding: 16, background: 'rgba(15,23,42,0.6)', borderRadius: 10, border: '1px solid #1e293b' }}>
            <p style={{ color: '#94a3b8', fontSize: 12, margin: '0 0 6px', fontWeight: 600 }}>
              ✏️ Extra instructions for AI <span style={{ color: '#475569', fontWeight: 400 }}>(optional)</span>
            </p>
            <p style={{ color: '#475569', fontSize: 11, margin: '0 0 10px' }}>
              Example: "Include temple visits", "Budget-friendly dhaba options", "Add adventure activities"
            </p>
            <textarea
              value={customPrompt}
              onChange={e => setCustomPrompt(e.target.value)}
              placeholder="Kuch extra chahiye toh yahan likho…"
              rows={3}
              style={{ width: '100%', borderRadius: 10, padding: '10px 14px', background: 'rgba(15,23,42,0.9)', color: '#e2e8f0', border: '1px solid #334155', fontSize: 13, lineHeight: 1.6, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
            {/* Suggestion chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {['🏛️ Historical places','🍜 Street food focus','💸 Budget-friendly','🏔️ Adventure activities','🌿 Nature & trekking','🛕 Temple visits','📸 Photography spots'].map(chip => (
                <button key={chip} onClick={() => setCustomPrompt(p => p ? `${p}, ${chip}` : chip)}
                  style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, background: 'rgba(30,41,59,0.8)', color: '#64748b', border: '1px solid #334155', cursor: 'pointer' }}>
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {itineraryError && (
          <div style={{ padding: '10px 14px', borderRadius: 9, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171', fontSize: 13, marginBottom: 14 }}>
            {itineraryError}
          </div>
        )}

        {/* Generating spinner */}
        {generatingAI && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <Loader2 style={{ width: 28, height: 28, margin: '0 auto 12px', animation: 'spin 1s linear infinite', color: '#f97316' }} />
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 4px' }}>Groq AI is crafting your itinerary…</p>
            <p style={{ fontSize: 11, color: '#334155' }}>Usually takes 10–20 seconds ☕</p>
          </div>
        )}

        {/* Empty */}
        {!itinerary && !generatingAI && (
          <div style={{ padding: '32px 0', textAlign: 'center' }}>
            <Sparkles style={{ width: 28, height: 28, margin: '0 auto 10px', opacity: 0.2, color: '#f97316' }} />
            <p style={{ fontSize: 14, color: '#64748b', margin: '0 0 4px', fontWeight: 600 }}>No itinerary yet</p>
            <p style={{ fontSize: 12, color: '#475569' }}>
              {isAdmin ? 'Click "Generate with AI" to auto-create a day-wise plan' : 'Admin ne abhi itinerary nahi banayi'}
            </p>
          </div>
        )}

        {/* Edit Mode */}
        {editingItinerary && (
          <div>
            <p style={{ color: '#64748b', fontSize: 12, marginBottom: 8 }}>⚠️ Raw JSON edit — structure mat todna</p>
            <textarea
              value={editedItinerary}
              onChange={e => setEditedItinerary(e.target.value)}
              rows={18}
              style={{ width: '100%', borderRadius: 10, padding: 14, background: 'rgba(15,23,42,0.9)', color: '#e2e8f0', border: '1px solid #334155', fontSize: 12, lineHeight: 1.7, fontFamily: 'monospace', resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => { setEditingItinerary(false); setItineraryError(''); }}
                style={{ ...btn('#1e293b', '#94a3b8'), border: '1px solid #334155', padding: '8px 16px' }}>
                <X style={{ width: 13, height: 13 }} /> Cancel
              </button>
              <button onClick={handleSaveItinerary} disabled={savingItinerary}
                style={{ ...btn('#7c3aed'), padding: '8px 18px' }}>
                {savingItinerary ? <Loader2 style={{ width: 13, height: 13, animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: 13, height: 13 }} />}
                Save to DB
              </button>
            </div>
          </div>
        )}

        {/* ── Structured Itinerary View ── */}
        {itinerary && itineraryData && !editingItinerary && !generatingAI && showItinerary && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32, marginTop: 16 }}>

            {/* Total Summary Mini-Card */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ padding: '20px', background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.1)', borderRadius: 20 }}>
                <p style={{ color: '#60A5FA', fontSize: 11, fontWeight: 700, margin: '0 0 8px', textTransform: 'uppercase' }}>📝 Summary</p>
                <p style={{ color: '#e2e8f0', fontSize: 14, lineHeight: 1.6, margin: 0 }}>{itineraryData.summary}</p>
              </div>
              
              {itineraryData.totalBudgetBreakdown && Object.keys(itineraryData.totalBudgetBreakdown).length > 0 && (
                <div style={{ padding: '20px', background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: 20 }}>
                  <p style={{ color: '#10B981', fontSize: 11, fontWeight: 700, margin: '0 0 10px', textTransform: 'uppercase' }}>💰 Budget Distribution</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {Object.entries(itineraryData.totalBudgetBreakdown).map(([k, v]) => (
                      <div key={k} style={{ background: 'rgba(15,23,42,0.4)', borderRadius: 8, padding: '6px 10px', border: '1px solid rgba(255,255,255,0.03)' }}>
                        <span style={{ color: '#64748b', fontSize: 10, textTransform: 'capitalize', marginRight: 6 }}>{k}:</span>
                        <span style={{ color: 'white', fontSize: 13, fontWeight: 700 }}>₹{Number(v).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Map Overlay */}
            <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
              <ItineraryMapWrapper itineraryData={itineraryData} fromCity={trip.fromCity} toCity={trip.toCity} />
            </div>

            {/* Vertical Timeline */}
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: 40, paddingLeft: 24 }}>
              {/* Timeline Line */}
              <div style={{ position: 'absolute', top: 0, bottom: 0, left: 6, width: 2, background: 'linear-gradient(to bottom, #7C3AED, #3b82f6, #10B981)', opacity: 0.3, borderRadius: 2 }} />

              {itineraryData.days.map((day, idx) => (
                <div key={day.day} style={{ position: 'relative' }}>
                  {/* Day Marker */}
                  <div style={{ position: 'absolute', left: -24, top: 0, width: 14, height: 14, borderRadius: '50%', background: idx % 2 === 0 ? '#7C3AED' : '#3b82f6', border: '3px solid #0f172a', zIndex: 1 }} />
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h4 style={{ fontSize: 18, fontWeight: 800, color: 'white', margin: 0 }}>{day.title}</h4>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Day {day.day} • {trip.startDate ? new Date(new Date(trip.startDate).getTime() + (day.day - 1) * 86400000).toLocaleDateString('en-IN', { weekday: 'long' }) : ''}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 2px', textTransform: 'uppercase' }}>Est. Cost</p>
                      <p style={{ fontSize: 16, fontWeight: 800, color: '#4ade80', margin: 0 }}>₹{Number(day.estimated_daily_cost).toLocaleString('en-IN')}</p>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                    {(['morning', 'afternoon', 'evening'] as const).map(period => {
                      const slot = day[period] ?? defaultSlot;
                      const meta = periodMeta[period];
                      return (
                        <div key={period} style={{ ...card, padding: 20, background: 'rgba(30,41,59,0.3)', position: 'relative', overflow: 'hidden' }} className="hover:border-slate-700 transition-all">
                          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                              {meta.icon}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                <span style={{ fontSize: 10, fontWeight: 700, color: meta.color, textTransform: 'uppercase' }}>{period}</span>
                                <span style={{ fontSize: 11, fontWeight: 600, color: '#4ade80' }}>₹{slot.cost}</span>
                              </div>
                              <h5 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: '0 0 6px' }}>{slot.activity}</h5>
                              <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 6 }}><MapPin style={{ width: 12, height: 12 }} /> {slot.place}</p>
                              {slot.tip && <div style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)', fontSize: 12, color: '#64748b', fontStyle: 'italic' }}>💡 {slot.tip}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Transport & Safety Footer */}
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <div style={{ flex: 1, padding: '12px 16px', background: 'rgba(15,23,42,0.4)', borderRadius: 14, border: '1px solid rgba(148,163,184,0.05)', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Plane style={{ width: 14, height: 14, color: '#60A5FA' }} />
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>{day.transport}</span>
                    </div>
                    <div style={{ flex: 1, padding: '12px 16px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Shield style={{ width: 14, height: 14, color: '#F87171' }} />
                      <span style={{ fontSize: 12, color: '#cbd5e1' }}>{day.safety_tip}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* General Tips & Emergency */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              {itineraryData.general_tips.length > 0 && (
                <div style={card}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: 'white', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><Sparkles style={{ width: 16, height: 16, color: '#fb923c' }} /> Expert Tips</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {itineraryData.general_tips.map((t, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12 }}>
                        <span style={{ color: '#fb923c', fontSize: 13, fontWeight: 800 }}>{i + 1}.</span>
                        <p style={{ fontSize: 13, color: '#94a3b8', margin: 0, lineHeight: 1.6 }}>{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {itineraryData.emergency_contacts && Object.keys(itineraryData.emergency_contacts).length > 0 && (
                <div style={{ ...card, border: '1px solid rgba(239,68,68,0.1)', background: 'rgba(239,68,68,0.01)' }}>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: '#F87171', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}><AlertCircle style={{ width: 16, height: 16 }} /> Emergency Support</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    {Object.entries(itineraryData.emergency_contacts).map(([k, v]) => (
                      <div key={k} style={{ padding: 12, background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(239,68,68,0.05)' }}>
                        <p style={{ fontSize: 10, color: '#64748b', margin: '0 0 4px', textTransform: 'uppercase' }}>{k.replace(/_/g, ' ')}</p>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#F87171', margin: 0 }}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Fallback plain text */}
        {itinerary && !itineraryData && !editingItinerary && !generatingAI && showItinerary && (
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 12, color: '#cbd5e1', lineHeight: 1.8, fontFamily: 'inherit', margin: 0, marginTop: 12 }}>
            {itinerary}
          </pre>
        )}
      </div>

      {/* ══ AI BOOKING AGENTS (CrewAI) ═══════════════════════════════════════ */}
      {isAdmin && (
        <div style={{ ...card, marginBottom: 24, border: '1px solid rgba(59,130,246,0.15)', background: 'rgba(59,130,246,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#60A5FA', margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bot style={{ width: 18, height: 18 }} />
                AI Booking Agents (CrewAI)
              </h3>
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>
                Our Python AI Crew will scout the web for the best packages and formatting them for you.
              </p>
            </div>
            {!bookingPackage && !generatingBookings && (
               <button
                 onClick={handleRunBookingAgents}
                 style={{ ...btn('rgba(59,130,246,0.15)', '#60A5FA'), padding: '8px 16px', fontSize: 13, border: '1px solid rgba(59,130,246,0.3)' }}
               >
                 <Plane style={{ width: 14, height: 14 }} /> Find Deals
               </button>
            )}
          </div>

          {/* Customization Panel */}
          {bookingPackage && !generatingBookings && (
            <div style={{ background: 'rgba(15,23,42,0.6)', borderRadius: 12, padding: 20, border: '1px solid rgba(148,163,184,0.1)', marginBottom: 20 }}>
               <h4 style={{ fontSize: 15, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                 <Settings style={{ width: 16, height: 16, color: '#a855f7' }} /> AI Trip Customization
               </h4>
               
               <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 16 }}>
                 <div>
                   <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>Accommodation Style</label>
                   <select 
                     value={(bookingAnswers as any).accommodation || 'Any'} 
                     onChange={e => setBookingAnswers((prev: any) => ({...prev, accommodation: e.target.value}))}
                     style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: 13 }}
                   >
                     <option value="Any" style={{ color: 'black' }}>Any</option>
                     <option value="Budget Hostel" style={{ color: 'black' }}>Budget Hostel</option>
                     <option value="Mid-range Hotel" style={{ color: 'black' }}>Mid-range Hotel</option>
                     <option value="Luxury Hotel" style={{ color: 'black' }}>Luxury Hotel (5-star)</option>
                     <option value="Airbnb" style={{ color: 'black' }}>Airbnb / Homestay</option>
                   </select>
                 </div>

                 <div>
                   <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>Trip Theme</label>
                   <select 
                     value={(bookingAnswers as any).style || 'Any'} 
                     onChange={e => setBookingAnswers((prev: any) => ({...prev, style: e.target.value}))}
                     style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: 13 }}
                   >
                     <option value="Any" style={{ color: 'black' }}>Balanced / Standard</option>
                     <option value="Adventure" style={{ color: 'black' }}>Adventure & Extreme</option>
                     <option value="Relaxation" style={{ color: 'black' }}>Chill & Relaxation</option>
                     <option value="Cultural" style={{ color: 'black' }}>Cultural & Historical</option>
                     <option value="Party" style={{ color: 'black' }}>Nightlife & Party</option>
                   </select>
                 </div>

                 <div>
                   <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>Food Preferences</label>
                   <select 
                     value={(bookingAnswers as any).food || 'Any'} 
                     onChange={e => setBookingAnswers((prev: any) => ({...prev, food: e.target.value}))}
                     style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: 13 }}
                   >
                     <option value="Any" style={{ color: 'black' }}>Mix of everything</option>
                     <option value="Street Food" style={{ color: 'black' }}>Street Food Focus</option>
                     <option value="Cafe Culture" style={{ color: 'black' }}>Aesthetic Cafes</option>
                     <option value="Fine Dining" style={{ color: 'black' }}>Fine/Upscale Dining</option>
                     <option value="Local Cuisine" style={{ color: 'black' }}>Strictly Authentic Local</option>
                   </select>
                 </div>

                 <div>
                   <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>Hidden Gems Selector</label>
                   <select 
                     value={(bookingAnswers as any).gemsToggle || 'Both'} 
                     onChange={e => setBookingAnswers((prev: any) => ({...prev, gemsToggle: e.target.value}))}
                     style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: 13 }}
                   >
                     <option value="Both" style={{ color: 'black' }}>Mix of Mainstream & Secret</option>
                     <option value="Hidden Gems" style={{ color: 'black' }}>100% Off-The-Beaten-Path</option>
                     <option value="Tourist Attractions" style={{ color: 'black' }}>Must-Sees & Icons Only</option>
                   </select>
                 </div>
               </div>

               <div style={{ marginBottom: 16 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                   <label style={{ fontSize: 12, color: '#cbd5e1' }}>Strict Budget Target</label>
                   <span style={{ fontSize: 13, fontWeight: 700, color: '#4ade80' }}>₹{Number(bookingAnswers.budget || trip?.budget || 50000).toLocaleString()}</span>
                 </div>
                 <input 
                   type="range"
                   min={trip?.budget ? trip.budget * 0.5 : 10000}
                   max={trip?.budget ? trip.budget * 2.0 : 200000}
                   step={5000}
                   value={bookingAnswers.budget || trip?.budget || 50000}
                   onChange={e => setBookingAnswers((prev: any) => ({...prev, budget: parseInt(e.target.value)}))}
                   style={{ width: '100%', accentColor: '#4ade80', cursor: 'pointer' }}
                 />
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                   <span style={{ fontSize: 10, color: '#64748b' }}>Cheaper Look</span>
                   <span style={{ fontSize: 10, color: '#64748b' }}>Luxury Vibe</span>
                 </div>
               </div>

               <label style={{ display: 'block', fontSize: 12, color: '#cbd5e1', marginBottom: 6 }}>Conversational AI Edit <span style={{ color: '#64748b' }}>(Modify specific activities, flights, etc.)</span></label>
               <div style={{ display: 'flex', gap: 12 }}>
                 <input 
                   value={bookingPrompt}
                   onChange={e => setBookingPrompt(e.target.value)}
                   placeholder="e.g. Remove paragliding, add a cooking class instead, make it 20% cheaper..."
                   style={{ flex: 1, padding: '12px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', outline: 'none', fontSize: 13 }}
                 />
                 <button onClick={handleRunBookingAgents} style={{ ...btn('#a855f7'), padding: '0 20px', borderRadius: 8, fontSize: 13, border: '1px solid #c084fc' }}>
                   <Sparkles style={{ width: 14, height: 14 }} /> Rebuild Package
                 </button>
               </div>
            </div>
          )}

          {generatingBookings && (
            <div style={{ padding: '32px 0', textAlign: 'center', background: 'rgba(15,23,42,0.4)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.05)' }}>
              <Loader2 style={{ width: 32, height: 32, margin: '0 auto 12px', animation: 'spin 1s linear infinite', color: '#60A5FA' }} />
              <p style={{ fontSize: 14, color: '#e2e8f0', margin: '0 0 6px', fontWeight: 600 }}>Agents are actively scouting deals...</p>
              <p style={{ fontSize: 12, color: '#64748b', maxWidth: 400, margin: '0 auto' }}>
                This is a multi-step process. "Booking Scouter" is traversing platforms, and "Travel Synthesizer" will format the final package. It may take roughly 30s-1m.
              </p>
            </div>
          )}

          {bookingError && (
            <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, marginTop: 16 }}>
              <p style={{ margin: 0, fontWeight: 600 }}>AI Agent Error:</p>
              <p style={{ margin: '4px 0 0', opacity: 0.9 }}>{bookingError}</p>
            </div>
          )}

          {bookingPackage && !generatingBookings && (
             <div style={{ marginTop: 16 }}>
               <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                 <button onClick={() => { setBookingPackage(null); setBookingPrompt(''); }} style={{ ...btn('rgba(255,255,255,0.05)', '#cbd5e1'), fontSize: 12, padding: '6px 12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                   Start Fresh
                 </button>
               </div>
               
               {bookingPackage.structured ? (
                 <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                   {/* Summary & Budget */}
                   <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
                     <div style={{ padding: 20, background: 'rgba(59,130,246,0.05)', borderRadius: 16, border: '1px solid rgba(59,130,246,0.1)' }}>
                        <h4 style={{ fontSize: 13, color: '#60A5FA', textTransform: 'uppercase', fontWeight: 800, margin: '0 0 12px' }}>💰 AI Budget Estimate</h4>
                        <p style={{ fontSize: 32, fontWeight: 900, color: 'white', margin: '0 0 8px' }}>₹{bookingPackage.totalEstimated?.toLocaleString()}</p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {Object.entries((bookingPackage.budgetBreakdown || {}) as Record<string, number>).map(([k, v]) => (
                            <span key={k} style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(15,23,42,0.5)', padding: '4px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.05)' }}>
                              {k.charAt(0).toUpperCase() + k.slice(1)}: <b>{v}%</b>
                            </span>
                          ))}
                        </div>
                     </div>
                     <div style={{ padding: 20, background: 'rgba(16,185,129,0.05)', borderRadius: 16, border: '1px solid rgba(16,185,129,0.1)' }}>
                        <h4 style={{ fontSize: 13, color: '#10B981', textTransform: 'uppercase', fontWeight: 800, margin: '0 0 12px' }}>💡 Saving Tips</h4>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {(bookingPackage.savingsTips || []).slice(0, 3).map((tip: string, i: number) => (
                            <li key={i} style={{ fontSize: 13, color: '#d1d5db', display: 'flex', gap: 8 }}><CheckCircle style={{ width: 14, height: 14, color: '#34d399', flexShrink: 0, marginTop: 2 }} /> {tip}</li>
                          ))}
                        </ul>
                     </div>
                   </div>

                   {/* Transport */}
                   {bookingPackage.transport?.length > 0 && (
                     <div>
                       <h4 style={{ fontSize: 16, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Plane style={{ width: 18, height: 18, color: '#60A5FA' }} /> Transport</h4>
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                         {bookingPackage.transport.map((t: any, i: number) => (
                           <a key={i} href={t.bookingUrl !== '#' ? t.bookingUrl : undefined} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', padding: 16, background: 'rgba(15,23,42,0.6)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', display: 'block' }} className="hover:border-blue-500/30 transition-all">
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                               <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 12 }}>{t.mode}</span>
                               <span style={{ fontSize: 16, fontWeight: 900, color: '#4ade80' }}>₹{t.estimatedPrice?.toLocaleString()}</span>
                             </div>
                             <h5 style={{ fontSize: 15, fontWeight: 700, color: 'white', margin: '0 0 4px' }}>{t.provider} via {t.platform}</h5>
                             <span style={{ fontSize: 12, color: '#60A5FA' }}>Check availability →</span>
                           </a>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Hotels */}
                   {bookingPackage.hotels?.length > 0 && (
                     <div>
                       <h4 style={{ fontSize: 16, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Building style={{ width: 18, height: 18, color: '#F43F5E' }} /> Top Stays</h4>
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                         {bookingPackage.hotels.map((h: any, i: number) => (
                           <div key={i} style={{ padding: 20, background: 'rgba(15,23,42,0.6)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }} className="hover:border-rose-500/30 transition-all">
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                               <h5 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0, paddingRight: 10 }}>{h.name}</h5>
                               <span style={{ fontSize: 16, fontWeight: 900, color: '#4ade80' }}>₹{h.price?.toLocaleString()}</span>
                             </div>
                             <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                               <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 6px', borderRadius: 4 }}>★ {h.rating}</span>
                               <span style={{ fontSize: 11, fontWeight: 700, color: h.trustScore >= 85 ? '#34d399' : '#fb923c', background: h.trustScore >= 85 ? 'rgba(52,211,153,0.1)' : 'rgba(251,146,60,0.1)', padding: '2px 6px', borderRadius: 4 }}>Trust: {h.trustScore}</span>
                             </div>
                             <p style={{ fontSize: 13, color: '#cbd5e1', margin: '0 0 16px', lineHeight: 1.5, flex: 1 }}>{h.description}</p>
                             
                             {/* Bottom Action Buttons */}
                             <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                               <button onClick={() => toast.success('Saved to trip!')} style={{ flex: 1, padding: '10px 0', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.05)' }} className="hover:bg-white/10 transition-all">
                                 Save
                               </button>
                               <a href={h.bookingUrl !== '#' ? h.bookingUrl : undefined} target="_blank" rel="noreferrer" style={{ flex: 2, textDecoration: 'none', textAlign: 'center', padding: '10px 0', background: 'rgba(244,63,94,0.1)', color: '#fda4af', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid rgba(244,63,94,0.3)' }} className="hover:bg-rose-500 hover:text-white transition-all">
                                 Book on {h.bookingPlatform}
                               </a>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Activities */}
                   {bookingPackage.activities?.length > 0 && (
                     <div>
                       <h4 style={{ fontSize: 16, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Compass style={{ width: 18, height: 18, color: '#f59e0b' }} /> Best Experiences</h4>
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                         {bookingPackage.activities.map((a: any, i: number) => (
                           <div key={i} style={{ padding: 20, background: 'rgba(15,23,42,0.6)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column' }} className="hover:border-amber-500/30 transition-all">
                             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                               <h5 style={{ fontSize: 16, fontWeight: 800, color: 'white', margin: 0, paddingRight: 10 }}>{a.name}</h5>
                               <span style={{ fontSize: 16, fontWeight: 900, color: '#4ade80' }}>₹{a.price?.toLocaleString()}</span>
                             </div>
                             <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                               <span style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', background: 'rgba(251,191,36,0.1)', padding: '2px 6px', borderRadius: 4 }}>★ {a.rating}</span>
                               <span style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', background: 'rgba(167,139,250,0.1)', padding: '2px 6px', borderRadius: 4 }}>{a.category?.toUpperCase()}</span>
                             </div>
                             <p style={{ fontSize: 13, color: '#cbd5e1', margin: '0 0 16px', lineHeight: 1.5, flex: 1 }}>{a.description}</p>
                             
                             {/* Bottom Action Buttons */}
                             <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                               <button onClick={() => toast.success('Saved to trip!')} style={{ flex: 1, padding: '10px 0', background: 'rgba(255,255,255,0.05)', color: 'white', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.05)' }} className="hover:bg-white/10 transition-all">
                                 Save
                               </button>
                               <a href={a.bookingUrl !== '#' ? a.bookingUrl : undefined} target="_blank" rel="noreferrer" style={{ flex: 2, textDecoration: 'none', textAlign: 'center', padding: '10px 0', background: 'rgba(245,158,11,0.1)', color: '#fcd34d', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid rgba(245,158,11,0.3)' }} className="hover:bg-amber-500 hover:text-white transition-all">
                                 Book on {a.bookingPlatform}
                               </a>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}

                   {/* Hidden Gems */}
                   {bookingPackage.hiddenGems?.length > 0 && (
                     <div>
                       <h4 style={{ fontSize: 16, fontWeight: 800, color: 'white', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Sparkles style={{ width: 18, height: 18, color: '#a855f7' }} /> AI Hidden Gems</h4>
                       <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                         {bookingPackage.hiddenGems.map((g: any, i: number) => (
                           <div key={i} style={{ padding: 20, background: 'rgba(168,85,247,0.05)', borderRadius: 16, border: '1px solid rgba(168,85,247,0.1)' }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                               <h5 style={{ fontSize: 15, fontWeight: 800, color: 'white', margin: 0 }}>{g.name}</h5>
                             </div>
                             <p style={{ fontSize: 13, color: '#cbd5e1', margin: '0 0 12px', lineHeight: 1.5 }}>{g.description}</p>
                             <div style={{ background: 'rgba(15,23,42,0.4)', padding: 10, borderRadius: 8, fontSize: 12, color: '#94a3b8' }}>
                               <strong style={{ color: '#c084fc' }}>💡 Insider Tip:</strong> {g.tip}
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                 </div>
               ) : (
                 <div style={{ padding: 24, background: 'rgba(15,23,42,0.6)', borderRadius: 12, border: '1px solid rgba(148,163,184,0.1)' }}>
                    <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 14, color: '#cbd5e1', lineHeight: 1.8, fontFamily: 'inherit', margin: 0 }}>
                      {bookingPackage.package ? bookingPackage.package : (typeof bookingPackage === 'string' ? bookingPackage : JSON.stringify(bookingPackage, null, 2))}
                    </pre>
                 </div>
               )}
             </div>
          )}
        </div>
      )}

      {/* ══ MEMBERS + JOIN ════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Members */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
              <Users style={{ width: 18, height: 18, color: '#f97316' }} /> Members
            </h3>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>
              {members.length}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {members.length === 0
              ? <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', padding: '10px 0' }}>No members yet</p>
              : members.map((m: any) => {
                  const u           = m.user || m;
                  const memberId    = m.userId || u.id;
                  const isAdminMem  = memberId === trip.adminId || memberId === trip.admin?.id;
                  return (
                    <div key={memberId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', transition: 'transform 0.2s, background 0.2s' }} className="hover:bg-white/5 hover:scale-[1.01]">
                      <div style={{ position: 'relative' }}>
                        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'white' }}>
                          {u.profileImage ? <img src={u.profileImage} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} /> : (u.username ? u.username[0].toUpperCase() : '?')}
                        </div>
                        {isAdminMem && (
                          <div style={{ position: 'absolute', bottom: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#f97316', border: '2px solid #0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Admin">
                             <Shield style={{ width: 10, height: 10, color: 'white' }} />
                          </div>
                        )}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: 'white', margin: 0 }}>
                          {u.username}
                        </p>
                        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{u.city || 'Traveler'}</p>
                      </div>
                      {currentUser?.id !== memberId && (
                        <FollowButton targetUserId={memberId} size="sm" variant="ghost" />
                      )}
                      {isAdmin && !isAdminMem && (
                        <button onClick={() => handleRemoveMember(memberId)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: '#ef4444' }} className="hover:bg-red-500/20 transition-colors">
                          <Trash2 style={{ width: 14, height: 14 }} />
                        </button>
                      )}
                    </div>
                  );
                })
            }
          </div>
        </div>

        {/* Join / Quick Actions */}
        <div style={card}>
          {isAdmin ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', display: 'flex', alignItems: 'center', gap: 8, margin: 0 }}>
                  <UserPlus style={{ width: 18, height: 18, color: '#3b82f6' }} /> Join Requests
                </h3>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 20 }}>
                  {joinRequests.filter((r:any) => r.status === 'pending').length}
                </span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {joinRequests.filter((r:any) => r.status === 'pending').length === 0
                  ? <p style={{ fontSize: 13, color: '#64748B', textAlign: 'center', padding: '10px 0' }}>No pending requests</p>
                  : joinRequests.filter((r:any) => r.status === 'pending').map((r:any) => (
                      <div key={r.id} style={{ padding: 16, borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: r.message ? 10 : 0 }}>
                          <p style={{ fontSize: 14, fontWeight: 600, color: 'white', margin: 0 }}>{r.user?.username || 'unknown'}</p>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <button onClick={() => handleRequest(r.id, 'accepted')} title="Approve" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="hover:bg-green-500/20">
                              <CheckCircle style={{ width: 16, height: 16, color: '#22C55E' }} />
                            </button>
                            <button onClick={() => handleRequest(r.id, 'rejected')} title="Reject" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} className="hover:bg-red-500/20">
                              <XCircle style={{ width: 16, height: 16, color: '#EF4444' }} />
                            </button>
                          </div>
                        </div>
                        {r.message && <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, padding: '8px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>"{r.message}"</p>}
                      </div>
                    ))
                }
              </div>
            </>
          ) : !isMember ? (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <UserPlus style={{ width: 18, height: 18, color: '#f97316' }} /> Join this Trip
              </h3>
              {hasPendingRequest ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, borderRadius: 12, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}>
                  <Clock style={{ width: 18, height: 18, color: '#F59E0B' }} />
                  <p style={{ fontSize: 14, color: '#FBBF24', margin: 0, fontWeight: 500 }}>Your join request is pending approval</p>
                </div>
              ) : (
                <>
                  <textarea placeholder="Add a message for the admin (optional)..." value={joinMsg} onChange={e => setJoinMsg(e.target.value)} maxLength={200}
                    style={{ width: '100%', height: 100, padding: 14, borderRadius: 12, fontSize: 14, color: 'white', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', outline: 'none', resize: 'none', marginBottom: 16, fontFamily: 'inherit' }} 
                    onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                  />
                  <button onClick={handleJoin} disabled={joining} className="btn-primary"
                    style={{ width: '100%', height: 44, borderRadius: 10, fontSize: 14, fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {joining ? <Loader2 style={{ width: 16, height: 16, animation: 'spin 0.8s linear infinite' }} /> : <Send style={{ width: 16, height: 16 }} />}
                    Request to Join
                  </button>
                </>
              )}
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'white', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Shield style={{ width: 18, height: 18, color: '#22c55e' }} /> Quick Actions
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { href: `/trips/${tripId}/checklist`,  icon: CheckSquare,   label: 'Shared Packing List',color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                  { href: `/trips/${tripId}/album`,      icon: Compass,       label: 'Trip Photo Album',   color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
                  { href: `/trips/${tripId}/assistant`, icon: Bot,           label: 'AI Travel Assistant', color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
                  { href: `/trips/${tripId}/explore`,   icon: Compass,       label: 'Discover Hidden Gems',color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
                  { href: `/trips/${tripId}/marketplace`,icon: ShoppingBag,  label: 'Travel Marketplace',  color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                  { href: `/trips/${tripId}/chat`,   icon: MessageCircle, label: 'Open Group Chat',   color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
                  { href: `/trips/${tripId}/wallet`, icon: Wallet,        label: 'Wallet & Expenses', color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
                ].map(({ href, icon: Icon, label, color, bg }) => (
                  <Link key={href} href={href}
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', textDecoration: 'none', transition: 'all 0.2s' }}
                    className="hover:bg-white/5"
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon style={{ width: 16, height: 16, color }} />
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'white' }}>{label}</span>
                    <ChevronRight style={{ width: 16, height: 16, color: '#64748b', marginLeft: 'auto' }} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
