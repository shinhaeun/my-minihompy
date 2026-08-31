-- 방명록/일기 기본 시드만 포함 (원본 index.html의 DEFAULT_GUESTBOOK_ENTRIES / DEFAULT_DIARY_ENTRIES와 동일).
-- 실제 주인장 인증 정보(PIN/보안질문 답)는 여기 절대 넣지 않음 — scripts/seed-owner-credential.ts를
-- 로컬에서만 실행해서 별도로 주입한다.

insert into guestbook_entries (name, message, pinned, created_at) values
  ('친구1', '놀러왔어요! 홈피 완전 예쁘다', false, '2026-08-20 12:00:00+09'),
  ('친구2', '담아갈게요 ㅎㅎ', false, '2026-08-19 12:00:00+09'),
  ('친구3', '오늘도 화이팅!', false, '2026-08-18 12:00:00+09');

insert into diary_entries (entry_date, content, visibility) values
  ('2026-08-21', E'안녕하세요! 제 미니홈피에 놀러와주셔서 감사해요.\n여기에 자기소개, 요즘 관심사, 하고 싶은 말을 자유롭게 적어보세요.\n예를 들어 "요즘 OOO에 빠져있어요!" 같은 문장도 좋아요.', 'public');
