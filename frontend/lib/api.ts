import axios from 'axios';
import { getSession } from 'next-auth/react';

const API_DEBUG_ENABLED =
  process.env.NEXT_PUBLIC_DEBUG_API === '1' ||
  process.env.NEXT_PUBLIC_DEBUG_API === 'true';

function apiDebugLog(message: string, meta?: Record<string, any>) {
  if (!API_DEBUG_ENABLED) return;
  try {
    // Avoid logging tokens/credentials; keep only safe request info.
    // eslint-disable-next-line no-console
    console.log(`[api] ${message}`, meta ?? {});
  } catch {
    // no-op
  }
}

function redactHeaders(headers: any) {
  const h: Record<string, any> = {};
  if (!headers) return h;
  for (const [k, v] of Object.entries(headers)) {
    const key = String(k).toLowerCase();
    if (key.includes('authorization') || key.includes('cookie') || key.includes('token')) continue;
    if (key === 'x-user-id') {
      h[k] = typeof v === 'string' ? `${v.slice(0, 8)}…` : v;
      continue;
    }
    h[k] = v;
  }
  return h;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Simple in-memory "refresh token" style cache for the session user ID
let cachedUserId: string | null = null;
let cachedExpiry = 0;
let refreshPromise: Promise<string | null> | null = null;

async function getCachedUserId(): Promise<string | null> {
  const now = Date.now();
  if (cachedUserId && now < cachedExpiry - 30_000) {
    // Still valid (with 30s buffer)
    apiDebugLog('cache hit: userId', { userId: `${cachedUserId.slice(0, 8)}…` });
    return cachedUserId;
  }

  if (refreshPromise) {
    apiDebugLog('cache pending: waiting for userId refresh');
    return refreshPromise;
  }

  refreshPromise = (async () => {
    apiDebugLog('cache miss: refreshing session userId');
    const session = await getSession();
    const id = (session as any)?.user?.id || null;
    cachedUserId = id;

    const expires = (session as any)?.expires;
    cachedExpiry = expires ? new Date(expires).getTime() : now + 5 * 60_000; // fallback 5min

    refreshPromise = null;
    apiDebugLog('cache updated: userId', {
      userId: id ? `${String(id).slice(0, 8)}…` : null,
      cachedExpiry,
    });
    return id;
  })();

  return refreshPromise;
}

// Add a request interceptor to inject the user ID from the cached session
api.interceptors.request.use(
  async (config) => {
    const start = Date.now();
    (config as any).__apiStart = start;

    const userId = await getCachedUserId();
    if (userId) {
      (config.headers as any)['X-User-Id'] = userId;
    }

    const method = (config.method || 'get').toUpperCase();
    apiDebugLog('request', {
      method,
      url: `${config.baseURL || ''}${config.url || ''}`,
      params: config.params,
      headers: redactHeaders(config.headers),
    });
    return config;
  },
  (error) => {
    apiDebugLog('request interceptor error', {
      message: error?.message,
      name: error?.name,
    });
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => {
    const cfg: any = response.config || {};
    const start = cfg.__apiStart;
    const durationMs = typeof start === 'number' ? Date.now() - start : undefined;
    apiDebugLog('response', {
      method: (cfg.method || 'get').toUpperCase(),
      url: `${cfg.baseURL || ''}${cfg.url || ''}`,
      status: response.status,
      durationMs,
    });
    return response;
  },
  (error) => {
    const cfg: any = error?.config || {};
    const start = cfg.__apiStart;
    const durationMs = typeof start === 'number' ? Date.now() - start : undefined;
    const status = error?.response?.status;
    apiDebugLog('response error', {
      method: (cfg.method || 'get').toUpperCase(),
      url: cfg.url ? `${cfg.baseURL || ''}${cfg.url}` : undefined,
      status,
      durationMs,
      message: error?.message,
      code: error?.code,
      data: error?.response?.data,
    });
    return Promise.reject(error);
  },
);

export default api;


export interface Task {
  id: string;
  title: string;
  status: 'pending' | 'done' | 'snoozed';
  priority: 'high' | 'medium' | 'low';
  due_date?: string;
  created_at: string;
  email_id?: string;
}


export interface EmailInsight {
  id: string;
  subject: string;
  sender: string;
  snippet: string;
  priority: string;
  category: string;
  received_at: string;
  sent_at: string;
  is_read: boolean;
  is_archived: boolean;
}

export const getTasks = async (userId: string, status?: string) => {
  const params = { user_id: userId, ...(status ? { status } : {}) };
  apiDebugLog('getTasks()', { userId: `${userId.slice(0, 8)}…`, status: status ?? null });
  const res = await api.get<Task[]>('/tasks/', { params });
  apiDebugLog('getTasks() ok', { count: Array.isArray(res.data) ? res.data.length : null });
  return res.data;
};

export const createTask = async (userId: string, data: Partial<Task>) => {
  apiDebugLog('createTask()', { userId: `${userId.slice(0, 8)}…`, keys: Object.keys(data || {}) });
  const res = await api.post<Task>(`/tasks/?user_id=${userId}`, data);
  apiDebugLog('createTask() ok', { id: (res.data as any)?.id });
  return res.data;
};

export const updateTask = async (userId: string, id: string, data: Partial<Task>) => {
  apiDebugLog('updateTask()', {
    userId: `${userId.slice(0, 8)}…`,
    id: `${id.slice(0, 8)}…`,
    keys: Object.keys(data || {}),
  });
  const res = await api.patch<Task>(`/tasks/${id}?user_id=${userId}`, data);
  apiDebugLog('updateTask() ok', { id: (res.data as any)?.id });
  return res.data;
};

export const deleteTask = async (userId: string, id: string) => {
  apiDebugLog('deleteTask()', { userId: `${userId.slice(0, 8)}…`, id: `${id.slice(0, 8)}…` });
  const res = await api.delete<Task>(`/tasks/${id}?user_id=${userId}`);
  apiDebugLog('deleteTask() ok', { id: (res.data as any)?.id });
  return res.data;
};
