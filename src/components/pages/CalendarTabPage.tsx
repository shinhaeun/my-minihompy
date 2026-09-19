import { useEffect, useMemo, useState } from 'react';
import { useSession } from '../../context/SessionContext';
import { api } from '../../lib/api';
import type { CalendarViewMode, ScheduleEvent } from '../../shared/types';
import { DayView, MonthView, WeekView } from '../calendar/CalendarViews';
import { EventForm } from '../calendar/EventForm';
import { dateKey, headerLabel, rangeFor, step } from '../calendar/dateUtils';

// 주의: 일기장 안에도 달력이 있지만 그건 일기를 쓰고 읽는 용도이고,
// 이 탭은 날짜별 '일정'을 다루는 별개 기능이다.
const MODES: { value: CalendarViewMode; label: string }[] = [
  { value: 'month', label: '월' },
  { value: 'week', label: '주' },
  { value: 'day', label: '일' },
];

type Editing = { mode: 'new'; date: string } | { mode: 'edit'; event: ScheduleEvent } | null;

export function CalendarTabPage({ active }: { active: boolean }) {
  const { isOwner } = useSession();
  const [view, setView] = useState<CalendarViewMode>('month');
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [editing, setEditing] = useState<Editing>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  const { start, end } = rangeFor(view, cursor);

  useEffect(() => {
    let cancelled = false;
    api.schedule
      .list(start, end)
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch(() => {
        // 조회 실패 시 빈 달력으로 둔다
      });
    return () => {
      cancelled = true;
    };
  }, [start, end, isOwner, refreshToken]);

  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleEvent[]>();
    for (const e of events) {
      const list = map.get(e.date);
      if (list) list.push(e);
      else map.set(e.date, [e]);
    }
    return map;
  }, [events]);

  function closeForm(changed: boolean) {
    setEditing(null);
    if (changed) setRefreshToken((n) => n + 1);
  }

  // 월/주 보기에서 날짜를 누르면 그 날로 좁혀 들어간다
  function pickDate(d: Date) {
    setCursor(d);
    setView('day');
  }

  const viewProps = {
    cursor,
    byDate,
    onPickDate: pickDate,
    onPickEvent: (e: ScheduleEvent) => {
      if (isOwner) setEditing({ mode: 'edit', event: e });
    },
  };

  return (
    <div className={`page${active ? ' active' : ''}`}>
      <div className="schedule-box">
        <div className="schedule-header">
          <button type="button" className="schedule-nav" onClick={() => setCursor(step(view, cursor, -1))}>
            ◀
          </button>
          <span className="schedule-label">{headerLabel(view, cursor)}</span>
          <button type="button" className="schedule-nav" onClick={() => setCursor(step(view, cursor, 1))}>
            ▶
          </button>
        </div>

        <div className="schedule-toolbar">
          <div className="schedule-modes">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                className={`schedule-mode-btn${view === m.value ? ' active' : ''}`}
                onClick={() => setView(m.value)}
              >
                {m.label}
              </button>
            ))}
          </div>
          <button type="button" className="schedule-today-btn" onClick={() => setCursor(new Date())}>
            오늘
          </button>
          {isOwner && (
            <button
              type="button"
              className="schedule-add-btn"
              onClick={() => setEditing({ mode: 'new', date: dateKey(cursor) })}
            >
              ＋ 일정 추가
            </button>
          )}
        </div>

        {editing && (
          <EventForm
            date={editing.mode === 'new' ? editing.date : editing.event.date}
            event={editing.mode === 'edit' ? editing.event : null}
            onDone={() => closeForm(true)}
            onCancel={() => closeForm(false)}
          />
        )}

        {view === 'month' && <MonthView {...viewProps} />}
        {view === 'week' && <WeekView {...viewProps} />}
        {view === 'day' && <DayView {...viewProps} />}
      </div>
    </div>
  );
}
