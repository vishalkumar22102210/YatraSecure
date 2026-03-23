export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001';

// ── Token Helpers ──
export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accesstoken');
}

// ✅ SECURE: No getRefreshToken() — refresh_token lives ONLY in httpOnly cookie

export function setTokens(accessToken: string, expiresIn: number) {
  if (typeof window === 'undefined') return;
  if (!accessToken) {
    console.error('[setTokens] accessToken is undefined — check backend response keys');
    return;
  }
  localStorage.setItem('accesstoken', accessToken);
  // ✅ SECURE: refresh_token is NOT stored in localStorage (httpOnly cookie only)
  const expiresAt = Date.now() + (Number(expiresIn) || 900) * 1000;
  localStorage.setItem('tokenexpiresat', expiresAt.toString());
}

export function clearTokens() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('accesstoken');
  localStorage.removeItem('refreshtoken'); // cleanup legacy key if exists
  localStorage.removeItem('tokenexpiresat');
  localStorage.removeItem('user');
}

// ── Refresh Queue ──
let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

// ── Refresh Access Token ──
// ✅ SECURE: refresh_token is sent automatically via httpOnly cookie (credentials: 'include')
// No token in request body or localStorage
export async function refreshAccessToken(): Promise<string> {
  if (isRefreshing) {
    return new Promise((resolve) => addRefreshSubscriber(resolve));
  }

  isRefreshing = true;

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // ✅ SECURE: sends httpOnly cookie automatically
    });

    if (!response.ok) throw new Error('Token refresh failed');

    const data = await response.json();

    // ✅ Backend returns: access_token, expires_in (NO refresh_token in body)
    const newAccessToken = data.access_token;
    const expiresIn = data.expires_in;

    setTokens(newAccessToken, expiresIn);
    isRefreshing = false;
    onTokenRefreshed(newAccessToken);
    return newAccessToken;
  } catch (error) {
    isRefreshing = false;
    clearTokens();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw error;
  }
}

// ── Fetch With Auth (auto-refresh on 401) ──
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  // If relative URL, prepend API_BASE_URL
  const fullUrl = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;

  let token = getAccessToken();

  if (!token) {
    try {
      token = await refreshAccessToken();
    } catch {
      throw new Error('Not authenticated');
    }
  }

  const makeRequest = (t: string) =>
    fetch(fullUrl, {
      ...options,
      credentials: 'include', // ✅ SECURE: always send cookies
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
        Authorization: `Bearer ${t}`,
      },
    });

  let response = await makeRequest(token);

  // Token expire ho gaya — refresh karke retry
  if (response.status === 401) {
    try {
      const newToken = await refreshAccessToken();
      response = await makeRequest(newToken);
    } catch {
      throw new Error('Session expired. Please login again.');
    }
  }

  return response;
}

// ── Proactive Refresh (60s before expiry) ──
if (typeof window !== 'undefined') {
  setInterval(() => {
    const expiresAt = localStorage.getItem('tokenexpiresat');
    if (!expiresAt) return;
    const timeLeft = parseInt(expiresAt) - Date.now();
    if (timeLeft < 60_000 && timeLeft > 0) {
      refreshAccessToken().catch(() => {});
    }
  }, 30_000);
}
