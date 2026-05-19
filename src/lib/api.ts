// =============================================================================
// TUTBOT — API client
// -----------------------------------------------------------------------------
// Thin fetch wrapper used by the frontend to talk to the Laravel backend.
//   - Reads VITE_API_URL from .env
//   - Attaches Authorization: Bearer <token> if present in localStorage
//   - Throws ApiError on non-2xx so callers can show inline errors / toasts
//
// Usage:
//   import { api } from './lib/api'
//   const landmark = await api.get<Landmark>(`/landmarks/${id}`)
// =============================================================================

import type { ApiErrorBody } from './types';

const TOKEN_KEY = 'tutbot.token';
// -- In-memory cache for frequently-read endpoints --------------
// Simple stale-while-revalidate: cache is valid for CACHE_TTL ms.
const CACHE_TTL = 30_000; // 30 seconds
const requestCache = new Map<string, { data: unknown; expiresAt: number }>();

function cacheGet<T>(key: string): T | null {
  const entry = requestCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    requestCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function cacheSet(key: string, data: unknown): void {
  requestCache.set(key, { data, expiresAt: Date.now() + CACHE_TTL });
}

export function clearCache() {
  requestCache.clear();
}

function getApiBase(): string {
  // Vite exposes import.meta.env.VITE_*
  // Fallback to /api so the app works behind a same-origin proxy in dev.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env ?? {};
  return env.VITE_API_URL ?? '/api';
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (typeof window === 'undefined') return;
  if (token) window.localStorage.setItem(TOKEN_KEY, token);else
  window.localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;
  constructor(status: number, body: ApiErrorBody | null, message?: string) {
    super(message ?? body?.message ?? `Request failed (${status})`);
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  /** Skip Authorization header even if a token exists. */
  anonymous?: boolean;
  /** Override fetch signal for cancellation. */
  signal?: AbortSignal;
  /** Extra headers (merged after defaults). */
  headers?: Record<string, string>;
}

async function request<T>(
method: string,
path: string,
body?: unknown,
opts: RequestOptions = {})
: Promise<T> {
  const url = path.startsWith('http') ? path : `${getApiBase()}${path}`;
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(opts.headers ?? {})
  };
  if (body !== undefined && !(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  if (!opts.anonymous) {
    const token = getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers,
      body:
      body === undefined ?
      undefined :
      body instanceof FormData ?
      body :
      JSON.stringify(body),
      signal: opts.signal
    });
  } catch (err) {
    // Network error
    throw new ApiError(0, null, (err as Error).message);
  }

  if (res.status === 204) {
    return undefined as unknown as T;
  }

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let errBody: ApiErrorBody | null = null;
    if (isJson) {
      try {
        errBody = (await res.json()) as ApiErrorBody;
      } catch {

        /* ignore parse error */}
    }
    // Auto-logout on 401
    if (res.status === 401) setAuthToken(null);
    throw new ApiError(res.status, errBody);
  }

  if (!isJson) {
    // unexpected non-JSON success; return raw text
    return (await res.text()) as unknown as T;
  }

  return (await res.json()) as T;
}

export const api = {
  get: <T,>(path: string, opts?: RequestOptions) => {
    const cacheKey = `GET:${path}`;
    // Skip cache if signal is provided (likely a one-off fetch)
    if (!opts?.signal) {
      const cached = cacheGet<T>(cacheKey);
      if (cached) return Promise.resolve(cached);
    }
    return request<T>('GET', path, undefined, opts).then(data => {
      if (!opts?.signal) cacheSet(cacheKey, data);
      return data;
    });
  },
  post: <T,>(path: string, body?: unknown, opts?: RequestOptions) =>
  request<T>('POST', path, body, opts),
  put: <T,>(path: string, body?: unknown, opts?: RequestOptions) =>
  request<T>('PUT', path, body, opts),
  patch: <T,>(path: string, body?: unknown, opts?: RequestOptions) =>
  request<T>('PATCH', path, body, opts),
  delete: <T,>(path: string, opts?: RequestOptions) =>
  request<T>('DELETE', path, undefined, opts)
};