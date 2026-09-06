create extension if not exists pgcrypto;

-- 싱글턴 프로필 행
create table profile (
  id smallint primary key default 1 check (id = 1),
  name text,
  age text,          -- 원본이 자유 텍스트 필드라 숫자 보장 안 함
  job text,
  intro text,
  mini_like text,
  mini_color text,
  mini_mood text,
  photo_url text,
  updated_at timestamptz not null default now()
);
insert into profile (id) values (1);

create table guestbook_entries (
  id uuid primary key default gen_random_uuid(),
  name text not null default '방문자',
  message text not null,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table diary_entries (
  entry_date date primary key,
  content text not null default '',
  visibility text not null default 'public' check (visibility in ('public', 'private', 'friends')),
  cover_photo_id uuid,
  updated_at timestamptz not null default now()
);

create table diary_photos (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null references diary_entries (entry_date) on delete cascade,
  url text not null, -- diary-photos 버킷 안 storage path (private 버킷이라 signed URL은 API가 요청마다 발급)
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table diary_entries
  add constraint diary_entries_cover_photo_fk
  foreign key (cover_photo_id) references diary_photos (id) on delete set null;

create index on diary_photos (entry_date);

-- 주인장 인증 정보. 실제 값은 여기 insert하지 않음 — scripts/seed-owner-credential.ts로 로컬에서만 1회 주입.
create table owner_credentials (
  id smallint primary key default 1 check (id = 1),
  security_question text not null,
  security_answer_hash text not null, -- pbkdf2$<iterations>$<saltHex>$<hashHex>
  pin_hash text not null,             -- 같은 포맷
  updated_at timestamptz not null default now()
);

create table owner_login_attempts (
  id bigserial primary key,
  ip text not null,
  attempted_at timestamptz not null default now()
);
create index on owner_login_attempts (ip, attempted_at);

-- 전 테이블 RLS 활성화. anon/authenticated 대상 정책을 만들지 않아 deny-all —
-- API가 항상 service_role 키로만 접근하므로 RLS는 방어선 하나를 더 두는 용도.
alter table profile enable row level security;
alter table guestbook_entries enable row level security;
alter table diary_entries enable row level security;
alter table diary_photos enable row level security;
alter table owner_credentials enable row level security;
alter table owner_login_attempts enable row level security;

-- Storage 버킷: profile-photos(public), diary-photos(private)
insert into storage.buckets (id, name, public)
values ('profile-photos', 'profile-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('diary-photos', 'diary-photos', false)
on conflict (id) do nothing;
