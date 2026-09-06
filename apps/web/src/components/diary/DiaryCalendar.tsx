import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { useSession } from '../../context/SessionContext';
import type { DiaryMonthEntry } from '../../shared/types';

const DOW = ['일', '월', '화', '수', '목', '금', '토'];

function pad2(n: number) {
  return n < 10 ? '0' + n : '' + n;
}

function dateKey(y: number, m: number, d: number) {
  return `${y}-${pad2(m + 1)}-${pad2(d)}`;
}

interface DiaryCalendarProps {
  year: number;
  month: number; // 0-indexed
  onPrev: () => void;
  onNext: () => void;
  onOpenWrite: (date: string) => void;
  onOpenRead: (date: string) => void;
  refreshToken: number;
}

export function DiaryCalendar({
  year,
  month,
  onPrev,
  onNext,
  onOpenWrite,
  onOpenRead,
  refreshToken,
}: DiaryCalendarProps) {
  const { isOwner } = useSession();
  const [entries, setEntries] = useState<Record<string, DiaryMonthEntry>>({});

  useEffect(() => {
    let cancelled = false;
    api.diary.listMonth(year, month + 1).then((list) => {
      if (cancelled) return;
      const map: Record<string, DiaryMonthEntry> = {};
      for (const e of list) map[e.date] = e;
      setEntries(map);
    });
    return () => {
      cancelled = true;
    };
  }, [year, month, isOwner, refreshToken]);

  const today = new Date();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < firstDay; i++) {
    cells.push(<div key={`empty-${i}`} className="calendar-cell empty" />);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const key = dateKey(year, month, d);
    const entry = entries[key];
    const isToday = isCurrentMonth && d === today.getDate();
    const clickable = isOwner || !!entry;

    const classes = ['calendar-cell'];
    if (isToday) classes.push('today');
    if (clickable) classes.push('clickable');
    if (entry?.coverUrl) classes.push('has-cover');

    cells.push(
      <div
        key={key}
        className={classes.join(' ')}
        onClick={() => {
          if (!clickable) return;
          if (isOwner) onOpenWrite(key);
          else onOpenRead(key);
        }}
      >
        {entry?.coverUrl && <img className="calendar-cell-cover-img" src={entry.coverUrl} alt="" />}
        <span className="calendar-cell-num">{d}</span>
        {entry && <span className={`calendar-cell-dot visibility-${entry.visibility}`} />}
      </div>,
    );
  }

  return (
    <div className="calendar-box">
      <div className="calendar-header">
        <button type="button" className="calendar-nav-btn" onClick={onPrev}>
          ◀
        </button>
        <span className="calendar-title">
          {year}년 {month + 1}월
        </span>
        <button type="button" className="calendar-nav-btn" onClick={onNext}>
          ▶
        </button>
      </div>
      <div className="calendar-dow">
        {DOW.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      <div className="calendar-grid">{cells}</div>
    </div>
  );
}
