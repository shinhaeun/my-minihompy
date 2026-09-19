import type { ScheduleEvent } from '../../shared/types';
import { paletteColor } from '../../shared/palette';
import { timeLabel } from './dateUtils';

/** 주/일 보기에서 쓰는 한 줄짜리 일정 항목 */
export function EventRow({
  event,
  onClick,
}: {
  event: ScheduleEvent;
  onClick?: () => void;
}) {
  const { bg, fg } = paletteColor(event.color);
  return (
    <div
      className={`schedule-row${onClick ? ' clickable' : ''}`}
      style={{ borderLeftColor: fg, background: bg }}
      onClick={onClick}
    >
      <div className="schedule-row-head">
        <span className="schedule-row-time" style={{ color: fg }}>
          {timeLabel(event.startTime)}
        </span>
        <span className="schedule-row-title">{event.title}</span>
        {event.visibility === 'private' && <span className="schedule-private">비공개</span>}
      </div>
      {event.memo && <p className="schedule-row-memo">{event.memo}</p>}
    </div>
  );
}

/** 월 보기 칸 안에 들어가는 작은 표시 */
export function EventDot({ event }: { event: ScheduleEvent }) {
  const { bg, fg } = paletteColor(event.color);
  return (
    <span className="schedule-dot" style={{ background: bg, color: fg }} title={event.title}>
      {event.title}
    </span>
  );
}
