// Local development: backend at http://localhost:5000
const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '') + '/api';

const GET_CACHE_TTL_MS = 20 * 1000; // 20s cache for GET requests
const getCache = new Map<string, { data: unknown; at: number }>();
const inFlight = new Map<string, Promise<unknown>>();

function getToken(): string | null {
  return localStorage.getItem('token');
}

function cacheKey(endpoint: string): string {
  const token = getToken();
  return `${token ?? 'anon'}:${endpoint}`;
}

/** Clear GET cache (e.g. after logout or when you need fresh data). */
export function clearApiCache(): void {
  getCache.clear();
  inFlight.clear();
}

async function doRequest<T>(
  endpoint: string,
  options: RequestInit
): Promise<{ success: boolean; data?: T; message?: string } & Record<string, unknown>> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  } catch (e) {
    return { success: false, message: 'Network error. Please check your connection.' };
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem('token');
      clearApiCache();
      const msg = (data.message || '').toLowerCase();
      if (msg.includes('blocked') || msg.includes('deactivated')) {
        window.location.href = `${window.location.origin}/login?blocked=1`;
        return { success: false, message: data.message || 'Request failed' };
      }
      window.location.href = `${window.location.origin}/login`;
    }
    return { success: false, message: data.message || 'Request failed' };
  }
  return { success: true, ...data } as { success: boolean; data?: T; message?: string } & Record<string, unknown>;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string }> {
  const isGet = (options.method ?? 'GET').toUpperCase() === 'GET';
  const key = cacheKey(endpoint);

  if (isGet) {
    const cached = getCache.get(key);
    if (cached && Date.now() - cached.at < GET_CACHE_TTL_MS) {
      return cached.data as { success: boolean; data?: T; message?: string };
    }
    let promise = inFlight.get(key);
    if (!promise) {
      promise = doRequest<T>(endpoint, options);
      inFlight.set(key, promise);
      promise.finally(() => inFlight.delete(key));
    }
    const result = (await promise) as { success: boolean; data?: T; message?: string };
    if (result.success) {
      getCache.set(key, { data: result, at: Date.now() });
    }
    return result;
  }

  const result = await doRequest<T>(endpoint, options);
  if (result.success && ['POST', 'PUT', 'PATCH', 'DELETE'].includes((options.method ?? '').toUpperCase())) {
    getCache.clear();
  }
  return result;
}
