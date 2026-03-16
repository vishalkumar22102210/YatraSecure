'use client';

import { useState, useEffect } from 'react';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { API_BASE_URL, getAccessToken } from '@/app/lib/api';
import toast from 'react-hot-toast';

interface FollowButtonProps {
  targetUserId: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export default function FollowButton({ 
  targetUserId, 
  initialIsFollowing = false, 
  onFollowChange,
  variant = 'primary',
  size = 'md'
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkStatus();
  }, [targetUserId]);

  async function checkStatus() {
    try {
      const token = getAccessToken();
      if (!token) {
        setChecking(false);
        return;
      }
      const res = await fetch(`${API_BASE_URL}/social/is-following/${targetUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setIsFollowing(data.following);
      }
    } catch (e) {
      console.error('Error checking follow status', e);
    } finally {
      setChecking(false);
    }
  }

  async function toggleFollow() {
    const token = getAccessToken();
    if (!token) {
      toast.error('Please login to follow travelers');
      return;
    }

    setLoading(true);
    try {
      const method = isFollowing ? 'DELETE' : 'POST';
      const endpoint = isFollowing ? 'unfollow' : 'follow';
      
      const res = await fetch(`${API_BASE_URL}/social/${endpoint}/${targetUserId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const newState = !isFollowing;
        setIsFollowing(newState);
        if (onFollowChange) onFollowChange(newState);
        toast.success(newState ? 'Following!' : 'Unfollowed');
      } else {
        const err = await res.json();
        toast.error(err.message || 'Action failed');
      }
    } catch (e) {
      toast.error('Network error');
    } finally {
      setLoading(false);
    }
  }

  if (checking) return null; // Don't show anything while checking

  const baseStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'all 0.2s',
    border: 'none',
    fontSize: size === 'sm' ? 12 : size === 'md' ? 14 : 16,
    padding: size === 'sm' ? '6px 12px' : size === 'md' ? '10px 20px' : '14px 28px',
  };

  const variants = {
    primary: {
      background: isFollowing ? 'rgba(255,255,255,0.05)' : 'linear-gradient(135deg, #f97316, #fbbf24)',
      color: isFollowing ? '#94a3b8' : 'white',
      border: isFollowing ? '1px solid rgba(255,255,255,0.08)' : 'none',
    },
    outline: {
      background: 'transparent',
      border: `1px solid ${isFollowing ? 'rgba(255,255,255,0.1)' : '#f97316'}`,
      color: isFollowing ? '#94a3b8' : '#f97316',
    },
    ghost: {
      background: 'transparent',
      color: isFollowing ? '#94a3b8' : '#3b82f6',
    }
  };

  return (
    <button 
      onClick={(e) => { e.stopPropagation(); toggleFollow(); }}
      disabled={loading}
      style={{ ...baseStyle, ...variants[variant] }}
      className={`hover:scale-105 active:scale-95 disabled:opacity-50 transition-all ${isFollowing ? 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30' : ''}`}
    >
      {loading ? (
        <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
      ) : isFollowing ? (
        <>
          <UserCheck style={{ width: 16, height: 16 }} />
          <span>Following</span>
        </>
      ) : (
        <>
          <UserPlus style={{ width: 16, height: 16 }} />
          <span>Follow</span>
        </>
      )}
    </button>
  );
}
