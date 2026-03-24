'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, UserPlus, Map, CheckCircle2, AlertCircle, X, Check } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { API_BASE_URL, fetchWithAuth } from '@/app/lib/api';

export default function NotificationDropdown() {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // Poll for unread count
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000); // 15-second polling
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch list when dropdown opens
  useEffect(() => {
    if (dropdownOpen) {
      fetchNotifications();
    }
  }, [dropdownOpen]);

  const fetchUnreadCount = async () => {
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/notifications/unread-count`);
      if (res.ok) {
        const data = await res.json();
        setUnread(data.count);
      }
    } catch (e) {
      // silent — user may not be logged in yet
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`${API_BASE_URL}/notifications`);
      if (res.ok) {
        setNotifications(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string, link: string | null) => {
    try {
      await fetchWithAuth(`${API_BASE_URL}/notifications/${id}/read`, {
        method: 'PATCH',
      });
      // Optimistic update
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnread(prev => Math.max(0, prev - 1));
      
      setDropdownOpen(false);
      if (link) router.push(link);
    } catch (e) {
      console.error(e);
    }
  };

  const markAllAsRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await fetchWithAuth(`${API_BASE_URL}/notifications/read-all`, {
        method: 'PATCH',
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (e) {
      console.error(e);
    }
  };

  // Icon mapper
  const getIcon = (type: string) => {
    if (type === 'FOLLOW') return <UserPlus className="w-4 h-4 text-fuchsia-400" />;
    if (type.includes('join')) return <Map className="w-4 h-4 text-blue-400" />;
    if (type === 'MATCH') return <CheckCircle2 className="w-4 h-4 text-amber-400" />;
    return <AlertCircle className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div ref={dropRef} className="relative">
      <div 
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="w-9 h-9 rounded-full bg-white/[0.03] border border-white/[0.08] flex items-center justify-center cursor-pointer relative transition-all hover:bg-white/10 hover:border-white/20 shadow-[0_0_12px_var(--dashboard-accent)] animate-in fade-in"
      >
        <Bell className="w-4 h-4 text-slate-300" />
        {unread > 0 && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-[9px] font-bold text-white shadow-[0_0_10px_rgba(56,189,248,0.5)]">
            {unread > 9 ? '9+' : unread}
          </div>
        )}
      </div>

      {dropdownOpen && (
        <div className="absolute top-[calc(100%+12px)] right-0 w-[340px] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.6)] overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
            <h3 className="text-sm font-bold text-white">Notifications</h3>
            {unread > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
              >
                <Check className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex justify-center p-8">
                <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center p-8 text-sm text-slate-500">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                You're all caught up!
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((n) => (
                  <div 
                    key={n.id}
                    onClick={() => markAsRead(n.id, n.link)}
                    className={`flex items-start gap-3 p-4 cursor-pointer transition-colors border-b border-white/[0.02] last:border-0 hover:bg-white/[0.04] ${n.isRead ? 'opacity-70' : 'bg-blue-500/[0.02]'}`}
                  >
                    <div className={`w-8 h-8 rounded-full flex shrink-0 items-center justify-center border shadow-inner ${n.isRead ? 'bg-slate-800/50 border-white/5' : 'bg-slate-800 border-white/10 shadow-blue-500/10'}`}>
                      {getIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm tracking-tight ${n.isRead ? 'text-slate-300' : 'text-slate-100 font-semibold'}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-snug break-words line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[10px] font-medium text-slate-500 mt-2 uppercase tracking-wider">
                        {new Date(n.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {!n.isRead && (
                      <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-white/5 bg-black/20 text-center">
            <Link 
              href="/notifications" 
              onClick={() => setDropdownOpen(false)}
              className="text-xs font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-wider block py-1.5"
            >
              View Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
