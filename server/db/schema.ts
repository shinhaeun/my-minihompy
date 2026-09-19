import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigserial,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const profile = pgTable('profile', {
  id: smallint('id').primaryKey().default(1),
  name: text('name'),
  age: text('age'),
  job: text('job'),
  intro: text('intro'),
  miniLike: text('mini_like'),
  miniColor: text('mini_color'),
  miniMood: text('mini_mood'),
  photoUrl: text('photo_url'),
  bannerTitle: text('banner_title'),
  bannerSubtitle: text('banner_subtitle'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('profile_id_check', sql`${table.id} = 1`),
]);

export const guestbookEntries = pgTable('guestbook_entries', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().default('방문자'),
  message: text('message').notNull(),
  pinned: boolean('pinned').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const diaryEntries = pgTable('diary_entries', {
  entryDate: date('entry_date').primaryKey(),
  content: text('content').notNull().default(''),
  visibility: text('visibility').notNull().default('public'),
  coverPhotoId: uuid('cover_photo_id').references((): AnyPgColumn => diaryPhotos.id, { onDelete: 'set null' }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('diary_entries_visibility_check', sql`${table.visibility} in ('public', 'private', 'friends')`),
]);

export const diaryPhotos = pgTable('diary_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  entryDate: date('entry_date').notNull().references(() => diaryEntries.entryDate, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('diary_photos_entry_date_idx').on(table.entryDate),
]);

export const ownerCredentials = pgTable('owner_credentials', {
  id: smallint('id').primaryKey().default(1),
  securityQuestion: text('security_question').notNull(),
  securityAnswerHash: text('security_answer_hash').notNull(),
  pinHash: text('pin_hash').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('owner_credentials_id_check', sql`${table.id} = 1`),
]);

export const ownerLoginAttempts = pgTable('owner_login_attempts', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  ip: text('ip').notNull(),
  attemptedAt: timestamp('attempted_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index('owner_login_attempts_ip_attempted_at_idx').on(table.ip, table.attemptedAt),
]);

export const visitCounts = pgTable('visit_counts', {
  visitDate: date('visit_date').primaryKey(),
  count: integer('count').notNull().default(0),
});

export const favoritePeople = pgTable('favorite_people', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  note: text('note'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 캘린더 탭: 날짜별 일정. 월/주/일 보기 모두 같은 표를 기간으로 잘라 읽는다.
// 시간은 '종일'을 허용해야 해서 nullable, 형식은 'HH:MM'으로 서버에서 검증한다.
export const scheduleEvents = pgTable('schedule_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  eventDate: date('event_date').notNull(),
  startTime: text('start_time'),
  title: text('title').notNull(),
  memo: text('memo'),
  color: text('color').notNull().default('purple'),
  visibility: text('visibility').notNull().default('public'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('schedule_events_visibility_check', sql`${table.visibility} in ('public', 'private')`),
  index('schedule_events_event_date_idx').on(table.eventDate),
]);

// 카테고리는 주인장이 미리 만들어두고 글 쓸 때 골라 쓰는 목록.
// 색도 직접 고르기 때문에 글마다 문자열로 들고 있지 않고 별도 표로 둔다.
export const tasteCategories = pgTable('taste_categories', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  color: text('color').notNull().default('pink'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// 취향정보 탭: 좋아하는 것에 대해 자유롭게 쓰는 블로그 형태의 글 목록.
// 본문은 글과 사진을 원하는 순서로 섞을 수 있어야 해서 단일 text가 아니라
// [{type:'text',text}, {type:'image',path}] 형태의 블록 배열로 저장한다.
export const tastePosts = pgTable('taste_posts', {
  id: uuid('id').primaryKey().defaultRandom(),
  categoryId: uuid('category_id').references(() => tasteCategories.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  blocks: jsonb('blocks').notNull().default(sql`'[]'::jsonb`),
  visibility: text('visibility').notNull().default('public'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  check('taste_posts_visibility_check', sql`${table.visibility} in ('public', 'private')`),
  index('taste_posts_created_at_idx').on(table.createdAt),
]);
