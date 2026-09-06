import type {
  DiaryEntry,
  DiaryMonthEntry,
  GuestbookEntry,
  Profile,
  SessionResponse,
} from '../shared/types';

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: init?.body instanceof FormData
      ? undefined
      : { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  session: {
    get: () => request<SessionResponse>('/api/session'),
    login: (questionAnswer: string, pin: string) =>
      request<SessionResponse>('/api/owner/login', {
        method: 'POST',
        body: JSON.stringify({ question_answer: questionAnswer, pin }),
      }),
    logout: () => request<void>('/api/owner/logout', { method: 'POST' }),
  },
  profile: {
    get: () => request<Profile>('/api/profile'),
    update: (patch: Partial<Profile>) =>
      request<Profile>('/api/profile', { method: 'PUT', body: JSON.stringify(patch) }),
    uploadPhoto: (file: File) => {
      const form = new FormData();
      form.append('photo', file);
      return request<Profile>('/api/profile/photo', { method: 'POST', body: form });
    },
  },
  guestbook: {
    list: () => request<GuestbookEntry[]>('/api/guestbook'),
    create: (message: string) =>
      request<GuestbookEntry>('/api/guestbook', {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    pin: (id: string) => request<GuestbookEntry>(`/api/guestbook/${id}/pin`, { method: 'PATCH' }),
    remove: (id: string) => request<void>(`/api/guestbook/${id}`, { method: 'DELETE' }),
  },
  diary: {
    listMonth: (year: number, month: number) =>
      request<DiaryMonthEntry[]>(`/api/diary?year=${year}&month=${month}`),
    get: async (date: string) => {
      try {
        return await request<DiaryEntry>(`/api/diary/${date}`);
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null;
        throw err;
      }
    },
    save: (date: string, patch: { content: string; visibility: string; coverPhotoId: string | null }) =>
      request<DiaryEntry>(`/api/diary/${date}`, { method: 'PUT', body: JSON.stringify(patch) }),
    uploadPhoto: (date: string, file: File) => {
      const form = new FormData();
      form.append('photo', file);
      return request<{ id: string; url: string }>(`/api/diary/${date}/photos`, {
        method: 'POST',
        body: form,
      });
    },
    removePhoto: (date: string, photoId: string) =>
      request<void>(`/api/diary/${date}/photos/${photoId}`, { method: 'DELETE' }),
  },
};

export { ApiError };
