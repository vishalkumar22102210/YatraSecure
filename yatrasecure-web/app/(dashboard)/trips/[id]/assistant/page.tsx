'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Send, Sparkles, Loader2, Bot, User, Trash2 } from 'lucide-react';
import { getAccessToken, API_BASE_URL } from '@/app/lib/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export default function AssistantPage() {
  const params = useParams();
  const router = useRouter();
  const tripId = params.id as string;

  const [trip, setTrip] = useState<any>(null);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Hi there! I'm your AI Travel Companion. 🌍\n\nHow can I help you plan this trip? I can suggest cafes, build tomorrow's itinerary, or help you with local weather!" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetchingTrip, setFetchingTrip] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadTrip();
    
    // Load local history if any
    const saved = localStorage.getItem(`assistant_chat_${tripId}`);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch(e) {}
    }
  }, [tripId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (messages.length > 1) {
      localStorage.setItem(`assistant_chat_${tripId}`, JSON.stringify(messages));
    }
  }, [messages, tripId]);

  async function loadTrip() {
    setFetchingTrip(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE_URL}/trips/${tripId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Trip not found');
      const data = await res.json();
      setTrip(data);
    } catch (error) {
      toast.error('Could not load trip');
      router.push('/trips');
    } finally {
      setFetchingTrip(false);
    }
  }

  async function handleSend() {
    if (!input.trim() || loading) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const token = getAccessToken();
      const res = await fetch(`/api/trips/${tripId}/assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          // Only send the last N messages to save context limit (e.g. last 10)
          messages: newMessages.slice(-10) 
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to get response');

      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);

    } catch (e: any) {
      toast.error(e.message || 'Failed to get AI response');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  function clearHistory() {
    if(confirm('Are you sure you want to clear the chat history?')) {
      const defaultMsgs: Message[] = [
        { role: 'assistant', content: "Hi there! I'm your AI Travel Companion. 🌍\n\nHow can I help you plan this trip? I can suggest cafes, build tomorrow's itinerary, or help you with local weather!" }
      ];
      setMessages(defaultMsgs);
      localStorage.removeItem(`assistant_chat_${tripId}`);
    }
  }

  if (fetchingTrip) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#020617' }}>
        <Loader2 style={{ width: 32, height: 32, color: '#f97316', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  return (
    <div className="anim-in" style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#020617' }}>
      
      {/* HEADER */}
      <div style={{ padding: '20px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button onClick={() => router.push(`/trips/${tripId}`)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }} className="hover:bg-white/10 hover:text-white">
            <ArrowLeft style={{ width: 18, height: 18 }} />
          </button>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: 'white', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Bot style={{ color: '#f97316' }} /> AI Travel Companion
            </h1>
            <p style={{ fontSize: 13, color: '#64748b', margin: '2px 0 0' }}>{trip?.name || 'Your Trip'}</p>
          </div>
        </div>

        <button onClick={clearHistory} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer' }} className="hover:text-red-400 transition-colors">
          <Trash2 style={{ width: 14, height: 14 }} /> Clear Chat
        </button>
      </div>

      {/* CHAT AREA */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ display: 'flex', gap: 16, maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
            {msg.role === 'assistant' && (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Sparkles style={{ width: 16, height: 16, color: 'white' }} />
              </div>
            )}
            
            <div style={{ background: msg.role === 'user' ? '#1e293b' : 'rgba(255,255,255,0.03)', border: `1px solid ${msg.role === 'user' ? '#334155' : 'rgba(255,255,255,0.06)'}`, padding: '16px 20px', borderRadius: 16, borderTopRightRadius: msg.role === 'user' ? 4 : 16, borderTopLeftRadius: msg.role === 'assistant' ? 4 : 16, color: '#e2e8f0', fontSize: 14, lineHeight: 1.6 }}>
              {msg.role === 'user' ? (
                 <span style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</span>
              ) : (
                <div className="prose prose-invert prose-sm" style={{ margin: 0, maxWidth: 'none' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User style={{ width: 16, height: 16, color: 'white' }} />
              </div>
            )}
          </div>
        ))}
        {loading && (
           <div style={{ display: 'flex', gap: 16, maxWidth: '80%', alignSelf: 'flex-start' }}>
             <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f97316, #fbbf24)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
               <Sparkles style={{ width: 16, height: 16, color: 'white' }} />
             </div>
             <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px', borderRadius: 16, borderTopLeftRadius: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
               <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f97316', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
               <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', animationDelay: '0.2s' }} />
               <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fb923c', animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite', animationDelay: '0.4s' }} />
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.8)', flexShrink: 0 }}>
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative' }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about your trip (e.g., 'Suggest good cafes near our hotel')"
            rows={1}
            disabled={loading}
            style={{ width: '100%', borderRadius: 24, padding: '16px 24px', paddingRight: 60, background: 'rgba(255,255,255,0.03)', color: 'white', border: '1px solid rgba(255,255,255,0.1)', fontSize: 15, outline: 'none', resize: 'none', lineHeight: 1.5, minHeight: 56, maxHeight: 200, fontFamily: 'inherit' }}
            onFocus={e => e.target.style.borderColor = 'rgba(249,115,22,0.5)'}
            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.1)'}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || loading}
            style={{ position: 'absolute', right: 8, top: 8, bottom: 8, width: 40, borderRadius: 20, background: input.trim() && !loading ? '#f97316' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: input.trim() && !loading ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}
          >
            <Send style={{ width: 18, height: 18, marginLeft: 2 }} />
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#64748b', marginTop: 12, marginBottom: 0 }}>
          AI Travel Companion can make mistakes. Consider verifying important details.
        </p>
      </div>

    </div>
  );
}
