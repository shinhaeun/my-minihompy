import type { CalendarViewMode } from '../../shared/types';

export const DOW = ['일', '월', '화', '수', '목', '금', '토'];

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Date → 'YYYY-MM-DD' (로컬 기준. toISOString은 UTC로 밀려 날짜가 바뀔 수 있어 쓰지 않는다) */
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function parseKey(key: string) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number) {
  const next = new Date(d);
  next.setDate(next.getDate() + n);
  return next;
}

export function startOfWeek(d: Date) {
  return addDays(d, -d.getDay());
}

export function isSameDay(a: Date, b: Date) {
  return dateKey(a) === dateKey(b);
}

/** 보기 모드에 따라 서버에서 받아올 기간 — 월 보기는 앞뒤 빈칸까지 덮도록 주 단위로 넓힌다 */
export function rangeFor(mode: CalendarViewMode, cursor: Date): { start: string; end: string } {
  if (mode === 'day') return { start: dateKey(cursor), end: dateKey(cursor) };
  if (mode === 'week') {
    const s = startOfWeek(cursor);
    return { start: dateKey(s), end: dateKey(addDays(s, 6)) };
  }
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const last = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0);
  return { start: dateKey(startOfWeek(first)), end: dateKey(addDays(startOfWeek(last), 6)) };
}

/** 이전/다음 버튼이 한 번에 움직이는 폭 */
export function step(mode: CalendarViewMode, cursor: Date, dir: 1 | -1) {
  if (mode === 'day') return addDays(cursor, dir);
  if (mode === 'week') return addDays(cursor, dir * 7);
  return new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1);
}

export function headerLabel(mode: CalendarViewMode, cursor: Date) {
  if (mode === 'month') return `${cursor.getFullYear()}. ${cursor.getMonth() + 1}`;
  if (mode === 'day') {
    return `${cursor.getFullYear()}. ${cursor.getMonth() + 1}. ${cursor.getDate()} (${DOW[cursor.getDay()]})`;
  }
  const s = startOfWeek(cursor);
  const e = addDays(s, 6);
  const sameMonth = s.getMonth() === e.getMonth();
  return sameMonth
    ? `${s.getFullYear()}. ${s.getMonth() + 1}. ${s.getDate()} ~ ${e.getDate()}`
    : `${s.getMonth() + 1}. ${s.getDate()} ~ ${e.getMonth() + 1}. ${e.getDate()}`;
}

export function timeLabel(startTime: string | null) {
  if (!startTime) return '종일';
  const [h, m] = startTime.split(':').map(Number);
  const ampm = h < 12 ? '오전' : '오후';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${ampm} ${h12}시` : `${ampm} ${h12}:${pad2(m)}`;
}
