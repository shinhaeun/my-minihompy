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

export type TasteColor = 'pink' | 'purple' | 'blue' | 'green' | 'yellow' | 'orange' | 'teal';

export interface TasteCategory {
  id: string;
  name: string;
  color: TasteColor;
}

export type TasteImageSize = 'small' | 'medium' | 'large';
export type TasteImageAlign = 'left' | 'center' | 'right';

/** 사진 블록의 보기 설정 — 글쓴이가 사진마다 따로 정한다 */
export interface TasteImageOptions {
  size: TasteImageSize;
  align: TasteImageAlign;
  caption: string;
}

/** 본문 블록 — 글과 사진을 원하는 순서로 섞기 위해 배열로 다룬다 */
export type TasteBlock =
  | { type: 'text'; text: string }
  | ({ type: 'image'; path: string; url: string } & TasteImageOptions);

/** 저장할 때 서버로 보내는 형태 (사진은 서명 URL 없이 경로만) */
export type TasteBlockInput =
  | { type: 'text'; text: string }
  | ({ type: 'image'; path: string } & TasteImageOptions);

/** 취향정보 목록에 쓰이는 요약 — 본문 대신 excerpt와 첫 사진만 들어있음 */
export interface TastePostSummary {
  id: string;
  category: TasteCategory | null;
  title: string;
  excerpt: string;
  thumbUrl: string | null;
  visibility: TasteVisibility;
  createdAt: string;
}

export interface TastePost {
  id: string;
  category: TasteCategory | null;
  title: string;
  blocks: TasteBlock[];
  visibility: TasteVisibility;
  createdAt: string;
}

export interface TastePostInput {
  title: string;
  categoryId: string | null;
  blocks: TasteBlockInput[];
  visibility: TasteVisibility;
}

/** 캘린더 탭의 일정 — 월/주/일 보기가 모두 같은 데이터를 쓴다 */
export interface ScheduleEvent {
  id: string;
  date: string; // 'YYYY-MM-DD'
  startTime: string | null; // 'HH:MM', null이면 종일
  title: string;
  memo: string | null;
  color: TasteColor;
  visibility: TasteVisibility;
}

export interface ScheduleEventInput {
  date: string;
  startTime: string;
  title: string;
  memo: string;
  color: TasteColor;
  visibility: TasteVisibility;
}

export type CalendarViewMode = 'month' | 'week' | 'day';

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
