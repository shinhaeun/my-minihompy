import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';

interface SessionValue {
  isOwner: boolean;
  loading: boolean;
  login: (questionAnswer: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isOwner, setIsOwner] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await api.session.get();
      setIsOwner(res.isOwner);
    } catch {
      setIsOwner(false);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = useCallback(async (questionAnswer: string, pin: string) => {
    try {
      const res = await api.session.login(questionAnswer, pin);
      setIsOwner(res.isOwner);
      return res.isOwner;
    } catch {
      setIsOwner(false);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await api.session.logout().catch(() => {});
    setIsOwner(false);
  }, []);

  return (
    <SessionContext.Provider value={{ isOwner, loading, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}
