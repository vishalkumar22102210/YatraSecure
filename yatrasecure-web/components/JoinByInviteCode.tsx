'use client';
import { useState } from 'react';
import toast from 'react-hot-toast';

export default function JoinByInviteCode() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!code.trim()) {
      toast.error('Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/trips/join/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success('Successfully joined the trip!');
        setCode('');
        // Redirect to trip page
        window.location.href = `/trips/${data.tripId}`;
      } else {
        toast.error(data.message || 'Invalid invite code');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">🔐 Join Private Trip</h3>
      <p className="text-sm text-gray-500 mb-4">
        Got an invite code? Enter it below to join a private trip.
      </p>
      <div className="flex gap-3">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter Invite Code (e.g., A1B2C3D4)"
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent uppercase tracking-widest font-mono text-center"
          maxLength={8}
        />
        <button
          onClick={handleJoin}
          disabled={loading || !code.trim()}
          className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {loading ? 'Joining...' : 'Join'}
        </button>
      </div>
    </div>
  );
}