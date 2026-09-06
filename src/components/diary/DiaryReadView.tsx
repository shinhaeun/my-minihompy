import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { DiaryEntry } from '../../shared/types';

const VISIBILITY_LABEL: Record<string, string> = {
  public: '공개',
  private: '비공개',
  friends: '친구공개',
};

function dateLabel(key: string) {
  const [y, m, d] = key.split('-');
  return `${y}.${m}.${d}`;
}

export function DiaryReadView({ date, onBack }: { date: string; onBack: () => void }) {
  const [entry, setEntry] = useState<DiaryEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.diary.get(date).then((e) => {
      if (!cancelled) setEntry(e);
    });
    return () => {
      cancelled = true;
    };
  }, [date]);

  return (
    <div className="diary-read" style={{ display: 'flex' }}>
      <div className="diary-write-header">
        <button type="button" className="diary-back-btn" onClick={onBack}>
          ◀ 캘린더로
        </button>
        <span className="diary-write-date">{dateLabel(date)}</span>
      </div>
      {entry && (
        <span className={`diary-read-visibility-badge visibility-${entry.visibility}`}>
          {VISIBILITY_LABEL[entry.visibility]}
        </span>
      )}
      <div className="diary-read-photos">
        {entry?.photos.map((photo) => (
          <img key={photo.id} src={photo.url} alt="" />
        ))}
      </div>
      <p className="diary-read-content">{entry?.content || '(내용 없음)'}</p>
    </div>
  );
}
