import type { ScheduleEvent } from '../../shared/types';
import { EventDot, EventRow } from './EventChip';
import { DOW, addDays, dateKey, isSameDay, startOfWeek } from './dateUtils';

const MONTH_MAX_DOTS = 2;

interface ViewProps {
  cursor: Date;
  byDate: Map<string, ScheduleEvent[]>;
  onPickDate: (d: Date) => void;
  onPickEvent: (e: ScheduleEvent) => void;
}

export function MonthView({ cursor, byDate, onPickDate }: ViewProps) {
  const today = new Date();
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const gridStart = startOfWeek(first);

  const cells = [];
  for (let i = 0; i < 42; i++) {
    const day = addDays(gridStart, i);
    const key = dateKey(day);
    const events = byDate.get(key) ?? [];
    const outside = day.getMonth() !== cursor.getMonth();
    const dow = day.getDay();
    const isToday = isSameDay(day, today);

    cells.push(
      <div
        key={key}
        className={[
          'schedule-cell',
          outside ? 'outside' : '',
          isToday ? 'today' : '',
          dow === 0 ? 'sun' : '',
          dow === 6 ? 'sat' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={() => onPickDate(day)}
      >
        <span className="schedule-cell-num">
          {day.getDate()}
          {isToday && <i className="schedule-today-star">✦</i>}
        </span>
        <div className="schedule-cell-events">
          {events.slice(0, MONTH_MAX_DOTS).map((e) => (
            <EventDot key={e.id} event={e} />
          ))}
          {events.length > MONTH_MAX_DOTS && (
            <span className="schedule-more">+{events.length - MONTH_MAX_DOTS}</span>
          )}
        </div>
      </div>,
    );
  }

  // 마지막 주가 통째로 다음 달이면 그 줄은 그리지 않는다
  const lastWeekStart = 35;
  const lastWeekAllOutside = cells
    .slice(lastWeekStart)
    .every((_, i) => addDays(gridStart, lastWeekStart + i).getMonth() !== cursor.getMonth());

  return (
    <div className="schedule-month">
      <div className="schedule-dow">
        {DOW.map((d, i) => (
          <span key={d} className={i === 0 ? 'sun' : i === 6 ? 'sat' : undefined}>
            {d}
          </span>
        ))}
      </div>
      <div className="schedule-grid">{lastWeekAllOutside ? cells.slice(0, lastWeekStart) : cells}</div>
    </div>
  );
}

export function WeekView({ cursor, byDate, onPickDate, onPickEvent }: ViewProps) {
  const today = new Date();
  const start = startOfWeek(cursor);

  return (
    <div className="schedule-week">
      {Array.from({ length: 7 }, (_, i) => {
        const day = addDays(start, i);
        const key = dateKey(day);
        const events = byDate.get(key) ?? [];
        return (
          <div key={key} className={`schedule-day-block${isSameDay(day, today) ? ' today' : ''}`}>
            <div
              className={[
                'schedule-day-head',
                day.getDay() === 0 ? 'sun' : '',
                day.getDay() === 6 ? 'sat' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => onPickDate(day)}
            >
              <b>{day.getDate()}</b>
              <span>{DOW[day.getDay()]}</span>
            </div>
            <div className="schedule-day-events">
              {events.map((e) => (
                <EventRow key={e.id} event={e} onClick={() => onPickEvent(e)} />
              ))}
              {events.length === 0 && <span className="schedule-day-empty">—</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DayView({ cursor, byDate, onPickEvent }: ViewProps) {
  const events = byDate.get(dateKey(cursor)) ?? [];
  if (events.length === 0) {
    return (
      <div className="schedule-day">
        <p className="schedule-empty">
          <span className="schedule-empty-face">◡</span>
          이 날은 일정이 없어요.
        </p>
      </div>
    );
  }
  return (
    <div className="schedule-day schedule-timeline">
      {events.map((e) => (
        <div key={e.id} className="schedule-timeline-item">
          <span className="schedule-timeline-mark" />
          <EventRow event={e} onClick={() => onPickEvent(e)} />
        </div>
      ))}
    </div>
  );
}
