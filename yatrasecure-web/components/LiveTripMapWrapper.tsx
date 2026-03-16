'use client';

import dynamic from 'next/dynamic';
import { Radar } from 'lucide-react';

const LiveTripMap = dynamic(
  () => import('./LiveTripMap'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: 400, borderRadius: 24, background: 'rgba(15,23,42,0.8)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden'
      }}>
        <Radar className="animate-pulse" style={{ width: 48, height: 48, color: '#f97316', marginBottom: 16 }} />
        <span style={{ color: '#94a3b8', fontSize: 13, fontWeight: 700 }}>Loading Map Engine…</span>
      </div>
    ),
  },
);

export default LiveTripMap;
