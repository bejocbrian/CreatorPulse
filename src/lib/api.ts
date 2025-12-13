import { ApiError } from '@/lib/errors';
import { getAccessToken } from '@/lib/tokenStorage';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

async function parseJsonSafe(res: Response): Promise<unknown> {
  const text = await res.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export async function apiRequest<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
    signal?: AbortSignal;
  } = {}
): Promise<T> {
  const token = getAccessToken();
  const url = `${API_BASE_URL}${path}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.headers ?? {}),
  };

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method: options.method ?? 'GET',
    headers,
    body,
    signal: options.signal,
  });

  if (!res.ok) {
    const payload = await parseJsonSafe(res);

    let message: string | null = null;
    if (typeof payload === 'object' && payload !== null && 'message' in payload) {
      const maybe = (payload as { message?: unknown }).message;
      if (typeof maybe === 'string') message = maybe;
    }

    throw new ApiError(message ?? `Request failed (${res.status})`, res.status, payload);
  }

  return (await parseJsonSafe(res)) as T;
}

export const api = {
  auth: {
    login: (body: { email: string; password: string }) =>
      apiRequest<{ token: string; user: User }>(`/auth/login`, { method: 'POST', body }),
    signup: (body: { name?: string; email: string; password: string }) =>
      apiRequest<{ token: string; user: User }>(`/auth/signup`, { method: 'POST', body }),
    requestReset: (body: { email: string }) => apiRequest<{ ok: true }>(`/auth/reset/request`, { method: 'POST', body }),
    confirmReset: (body: { token: string; password: string }) =>
      apiRequest<{ ok: true }>(`/auth/reset/confirm`, { method: 'POST', body }),
    me: () => apiRequest<User>(`/auth/me`),
  },
  dashboard: {
    activeTransactions: () => apiRequest<Transaction[]>(`/transactions/active`),
    activeChecklists: () => apiRequest<Checklist[]>(`/checklists/active`),
  },
  documents: {
    folders: () => apiRequest<DocumentFolder[]>(`/documents/folders`),
    files: (folderId: string | null) => {
      const qs = folderId ? `?folderId=${encodeURIComponent(folderId)}` : '';
      return apiRequest<DocumentFile[]>(`/documents${qs}`);
    },
    upload: (data: { folderId: string | null; file: File }) => {
      const form = new FormData();
      if (data.folderId) form.set('folderId', data.folderId);
      form.set('file', data.file);
      return apiRequest<DocumentFile>(`/documents/upload`, { method: 'POST', body: form });
    },
    addAnnotation: (documentId: string, body: { text: string; page?: number }) =>
      apiRequest<Annotation>(`/documents/${encodeURIComponent(documentId)}/annotations`, { method: 'POST', body }),
    share: (documentId: string, body: { emails?: string[]; permission: 'view' | 'comment' | 'edit' }) =>
      apiRequest<{ shareUrl: string }>(`/documents/${encodeURIComponent(documentId)}/share`, { method: 'POST', body }),
  },
  billing: {
    subscription: () => apiRequest<SubscriptionStatus>(`/billing/subscription`),
  },
  admin: {
    users: () => apiRequest<User[]>(`/admin/users`),
    analytics: () =>
      apiRequest<{
        dailyActiveUsers: { date: string; count: number }[];
        storageBytesByDay: { date: string; bytes: number }[];
      }>(`/admin/analytics`),
  },
};

export type UserRole = 'user' | 'admin';

export type User = {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
};

export type Transaction = {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'blocked';
  updatedAt: string;
  checklistProgress: number;
};

export type ChecklistItem = {
  id: string;
  label: string;
  done: boolean;
};

export type Checklist = {
  id: string;
  title: string;
  items: ChecklistItem[];
};

export type DocumentFolder = {
  id: string;
  name: string;
  children?: DocumentFolder[];
};

export type Annotation = {
  id: string;
  text: string;
  author: string;
  createdAt: string;
  page?: number;
};

export type DocumentFile = {
  id: string;
  name: string;
  mimeType: string;
  folderId: string | null;
  updatedAt: string;
  annotations?: Annotation[];
};

export type SubscriptionStatus = {
  status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete' | 'none';
  planName?: string;
  currentPeriodEnd?: string;
  portalUrl?: string;
};
