import axios from 'axios';
import { getSession } from 'next-auth/react';

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
    return cachedUserId;
  }

  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const session = await getSession();
    const id = (session as any)?.user?.id || null;
    cachedUserId = id;

    const expires = (session as any)?.expires;
    cachedExpiry = expires ? new Date(expires).getTime() : now + 5 * 60_000; // fallback 5min

    refreshPromise = null;
    return id;
  })();

  return refreshPromise;
}

// Add a request interceptor to inject the user ID from the cached session
api.interceptors.request.use(
  async (config) => {
    const userId = await getCachedUserId();
    if (userId) {
      (config.headers as any)['X-User-Id'] = userId;
    }
    return config;
  },
  (error) => {
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
  const res = await api.get<Task[]>('/tasks/', { params });
  return res.data;
};

export const createTask = async (userId: string, data: Partial<Task>) => {
  const res = await api.post<Task>(`/tasks/?user_id=${userId}`, data);
  return res.data;
};

export const updateTask = async (userId: string, id: string, data: Partial<Task>) => {
  const res = await api.patch<Task>(`/tasks/${id}?user_id=${userId}`, data);
  return res.data;
};

export const deleteTask = async (userId: string, id: string) => {
  const res = await api.delete<Task>(`/tasks/${id}?user_id=${userId}`);
  return res.data;
};
