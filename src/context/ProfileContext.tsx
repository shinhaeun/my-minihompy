import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import type { Profile } from '../shared/types';

const EMPTY: Profile = {
  name: null,
  age: null,
  job: null,
  intro: null,
  miniLike: null,
  miniColor: null,
  miniMood: null,
  photoUrl: null,
  bannerTitle: null,
  bannerSubtitle: null,
};

interface ProfileValue {
  profile: Profile;
  loading: boolean;
  refresh: () => Promise<void>;
  setProfile: (p: Profile) => void;
}

const ProfileContext = createContext<ProfileValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const p = await api.profile.get();
      setProfile(p);
    } catch {
      // 공개 정보 조회 실패 시 기본값 유지
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, setProfile }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
