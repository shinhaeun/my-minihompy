export type DiaryVisibility = 'public' | 'private' | 'friends';

export interface Profile {
  name: string | null;
  age: string | null;
  job: string | null;
  intro: string | null;
  miniLike: string | null;
  miniColor: string | null;
  miniMood: string | null;
  photoUrl: string | null;
  bannerTitle: string | null;
  bannerSubtitle: string | null;
}

export interface GuestbookEntry {
  id: string;
  name: string;
  message: string;
  date: string; // 'MM.DD'
  pinned: boolean;
}

export interface DiaryPhoto {
  id: string;
  url: string;
}

export interface DiaryMonthEntry {
  date: string; // 'YYYY-MM-DD'
  visibility: DiaryVisibility;
  coverUrl: string | null;
}

export interface DiaryEntry {
  date: string;
  content: string;
  visibility: DiaryVisibility;
  photos: DiaryPhoto[];
  coverPhotoId: string | null;
}

export interface SessionResponse {
  isOwner: boolean;
}

export interface VisitCounts {
  today: number;
  total: number;
}

export interface FavoritePerson {
  id: string;
  name: string;
  note: string | null;
}

export type TasteVisibility = 'public' | 'private';

/** 취향정보 목록에 쓰이는 요약 — 본문 대신 excerpt만 들어있음 */
export interface TastePostSummary {
  id: string;
  title: string;
  excerpt: string;
  visibility: TasteVisibility;
  createdAt: string;
}

export interface TastePost {
  id: string;
  title: string;
  content: string;
  visibility: TasteVisibility;
  createdAt: string;
}

export const NAV_PAGES = [
  'profile',
  'bgm',
  'guestbook',
  'calendar',
  'diary',
  'taste',
  'settings',
] as const;

export type NavPage = (typeof NAV_PAGES)[number];
export type Page = NavPage | 'friend';

export const SEARCH_PAGE_ORDER: Page[] = [
  'profile',
  'bgm',
  'guestbook',
  'calendar',
  'diary',
  'taste',
  'friend',
];
