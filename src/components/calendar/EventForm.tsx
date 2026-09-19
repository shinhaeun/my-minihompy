import { useState } from 'react';
import { useModal } from '../../context/ModalContext';
import { api } from '../../lib/api';
import { PALETTE } from '../../shared/palette';
import type { ScheduleEvent, TasteColor, TasteVisibility } from '../../shared/types';

interface EventFormProps {
  /** 새 일정을 만들 기본 날짜 */
  date: string;
  /** 있으면 그 일정을 수정, 없으면 새로 만들기 */
  event: ScheduleEvent | null;
  onDone: () => void;
  onCancel: () => void;
}

export function EventForm({ date, event, onDone, onCancel }: EventFormProps) {
  const { alert: showAlert, confirm } = useModal();
  const [eventDate, setEventDate] = useState(event?.date ?? date);
  const [startTime, setStartTime] = useState(event?.startTime ?? '');
  const [title, setTitle] = useState(event?.title ?? '');
  const [memo, setMemo] = useState(event?.memo ?? '');
  const [color, setColor] = useState<TasteColor>(event?.color ?? 'purple');
  const [visibility, setVisibility] = useState<TasteVisibility>(event?.visibility ?? 'public');
  const [busy, setBusy] = useState(false);

  async function save() {
    const trimmed = title.trim();
    if (!trimmed) {
      await showAlert('일정 이름을 입력해주세요.');
      return;
    }
    setBusy(true);
    try {
      const patch = { date: eventDate, startTime, title: trimmed, memo: memo.trim(), color, visibility };
      if (event) await api.schedule.update(event.id, patch);
      else await api.schedule.create(patch);
      onDone();
    } catch {
      await showAlert('일정을 저장하지 못했어요.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!event) return;
    const ok = await confirm('이 일정을 지울까요?');
    if (!ok) return;
    await api.schedule.remove(event.id);
    onDone();
  }

  return (
    <div className="schedule-form">
      <div className="schedule-form-title">{event ? '일정 수정' : '새 일정'}</div>

      <div className="schedule-form-row">
        <input
          type="date"
          className="schedule-input"
          value={eventDate}
          onChange={(e) => setEventDate(e.target.value)}
        />
        <input
          type="time"
          className="schedule-input"
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
        />
      </div>
      <div className="schedule-form-hint">시간을 비우면 '종일'로 표시돼요.</div>

      <input
        type="text"
        className="schedule-input"
        placeholder="일정 이름"
        maxLength={100}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
        }}
      />
      <textarea
        className="schedule-input schedule-memo"
        placeholder="메모 (선택)"
        maxLength={500}
        value={memo}
        onChange={(e) => setMemo(e.target.value)}
      />

      <div className="schedule-form-row">
        <div className="taste-picker-swatches">
          {PALETTE.map((c) => (
            <button
              key={c.key}
              type="button"
              title={c.label}
              className={`taste-swatch${color === c.key ? ' selected' : ''}`}
              style={{ background: c.bg, borderColor: c.fg }}
              onClick={() => setColor(c.key)}
            />
          ))}
        </div>
      </div>

      <div className="schedule-form-footer">
        <div className="diary-visibility-group">
          {(['public', 'private'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={`diary-visibility-btn${visibility === v ? ' active' : ''}`}
              onClick={() => setVisibility(v)}
            >
              {v === 'public' ? '공개' : '비공개'}
            </button>
          ))}
        </div>
        <div className="schedule-form-actions">
          {event && (
            <button type="button" className="diary-back-btn taste-delete-btn" onClick={remove}>
              삭제
            </button>
          )}
          <button type="button" className="diary-back-btn" onClick={onCancel}>
            취소
          </button>
          <button type="button" className="diary-save-btn" disabled={busy} onClick={save}>
            저장
          </button>
        </div>
      </div>
    </div>
  );
}
